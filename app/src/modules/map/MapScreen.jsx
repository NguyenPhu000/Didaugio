import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import { useBoundaryData } from "./hooks/useBoundaryData";
import { useFilterState } from "./hooks/useFilterState";
import { useNavigationStateMachine } from "./hooks/useNavigationStateMachine";
import { useRouteBuilderController } from "./hooks/useRouteBuilderController";
import MapView from "./components/MapView";
import RouteBuilderPanel from "./components/route-builder/RouteBuilderPanel";
import ArrivalConfirmModal from "./components/navigation/ArrivalConfirmModal";
import NavigationStatusBanner from "./components/navigation/NavigationStatusBanner";
import FilterGroupBar from "./components/filters/FilterGroupBar";
import FilterPickerModal from "./components/filters/FilterPickerModal";
import CurrentLocationMarker from "./components/map-overlays/CurrentLocationMarker";
import RouteBuilderStopsMarkerLayer from "./components/map-overlays/RouteBuilderStopsMarkerLayer";
import ActiveRouteLayer from "./components/map-overlays/ActiveRouteLayer";
import { useMapRouting } from "./hooks/useMapRouting";
import { AIEntryButton } from "../../components/composed/AIEntryButton";
import {
  PlacePreviewCard,
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../components/composed/PlacePreviewCard";
import { trackEvent } from "../../lib/analytics";
import { resolveMediaUrl } from "../../lib/media-url";
import { useAuthStore } from "../../stores/authStore";
import { DistrictLayer, WardLayer } from "./components/BoundaryLayer";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
  CAN_THO_CENTER,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "./config/mapConfig";
import { TOKENS } from "../../constants/design-tokens";
import { FLOATING_TAB_CLEARANCE, TAB_BAR_HEIGHT } from "../../../app/(tabs)/_layout";
import { ALL_AREAS_KEY } from "./constants/filter.constants";
import { ROUTE_BUILDER_LONG_PRESS_PICK_RADIUS_M } from "./constants/routeBuilder.constants";
import { NAVIGATION_EVENT_DEDUP_MS } from "./constants/navigation.constants";
import { MAP_TEXT } from "./constants/mapText.constants";
import { distanceMeters } from "./utils/distance";
import {
  formatRouteDistance,
  formatRouteEta,
} from "./utils/routeBuilderMapper";
import { filterVisiblePlaces, getPlaceDistrictMeta } from "./utils/placeFilter";

const isNewArchitectureEnabled = global?.nativeFabricUIManager != null;

if (Platform.OS === "android" && !isNewArchitectureEnabled) {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const MAP_UI_THEME = {
  background: TOKENS.color.neutral[900],
  backgroundElevated: TOKENS.color.neutral[800],
  backgroundSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  text: TOKENS.color.neutral[100],
  textSecondary: TOKENS.color.neutral[400],
  primary: TOKENS.color.primary[500],
  neon: TOKENS.color.primary[400],
  whitePill: "rgba(255,255,255,0.94)",
  whitePillBorder: "rgba(255,255,255,0.18)",
  heroGradient: "rgba(0,0,0,0.72)",
};

const MAP_CANVAS_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};
const PLACE_SPATIAL_INDEX_CELL_DEGREES = 0.003;

const getSpatialCellKey = (latitude, longitude) => {
  const latCell = Math.floor(latitude / PLACE_SPATIAL_INDEX_CELL_DEGREES);
  const lngCell = Math.floor(longitude / PLACE_SPATIAL_INDEX_CELL_DEGREES);
  return `${latCell}:${lngCell}`;
};

const buildNearbySpatialKeys = (latitude, longitude) => {
  const latCell = Math.floor(latitude / PLACE_SPATIAL_INDEX_CELL_DEGREES);
  const lngCell = Math.floor(longitude / PLACE_SPATIAL_INDEX_CELL_DEGREES);
  const keys = [];

  for (let dLat = -1; dLat <= 1; dLat += 1) {
    for (let dLng = -1; dLng <= 1; dLng += 1) {
      keys.push(`${latCell + dLat}:${lngCell + dLng}`);
    }
  }

  return keys;
};

const GlassPanel = ({ style, children, intensity = 40 }) => (
  <BlurView
    intensity={intensity}
    tint="dark"
    style={[
      {
        backgroundColor: MAP_UI_THEME.backgroundSoft,
        borderWidth: 1,
        borderColor: MAP_UI_THEME.border,
        overflow: "hidden",
      },
      style,
    ]}
  >
    {children}
  </BlurView>
);



export default function MapScreen() {
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const isCompactPreviewCard = viewportWidth <= 360 || viewportHeight <= 700;

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const authUser = useAuthStore((state) => state.user);

  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastAppliedFocusRef = useRef(null);
  const lastNavigationEventRef = useRef({ signature: null, timestamp: 0 });

  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);

  const {
    data: mapPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useMapPlaces();

  const {
    districts: districtGeo,
    wards: wardGeo,
    refetch: refetchBoundary,
  } = useBoundaryData();

  const { data: homeData } = useHomeData({ limit: 12 });

  const allPlaces = useMemo(
    () => (Array.isArray(mapPlaces) ? mapPlaces : []),
    [mapPlaces],
  );

  const categories = useMemo(() => {
    const homeCategories =
      homeData?.categories ||
      homeData?.data?.categories ||
      homeData?.data?.data?.categories ||
      [];

    if (Array.isArray(homeCategories) && homeCategories.length > 0) {
      return homeCategories
        .map((item) => ({ id: item?.id, name: item?.name }))
        .filter((item) => item.id != null && item.name);
    }

    const derived = new Map();
    allPlaces.forEach((place) => {
      const id = place?.categoryId ?? place?.category?.id;
      const name = place?.category?.name;
      if (id == null || !name) return;
      const key = String(id);
      if (!derived.has(key)) {
        derived.set(key, { id, name });
      }
    });

    return Array.from(derived.values());
  }, [homeData, allPlaces]);

  const areaOptions = useMemo(() => {
    const areas = new Map();
    allPlaces.forEach((place) => {
      const district = getPlaceDistrictMeta(place);
      if (!district || areas.has(district.key)) return;
      areas.set(district.key, district);
    });

    return Array.from(areas.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "vi"),
    );
  }, [allPlaces]);

  const {
    activeFilterGroup,
    activeCategoryId,
    activeArea,
    quickFilters,
    filterPickerVisible,
    activeFilterGroupMeta,
    activeFilterSummaryLabel,
    filterPickerOptions,
    handleSelectFilterGroup,
    handleOpenFilterPicker,
    handleCloseFilterPicker,
    handleSelectFilterOption,
  } = useFilterState({
    categories,
    areaOptions,
    categoryMarkerStyles: CATEGORY_MARKER_STYLES,
    defaultCategoryIcon: DEFAULT_CATEGORY_ICON,
  });

  const isLoading = isPlacesLoading && allPlaces.length === 0;
  const error = placesError;

  const refetch = useCallback(() => {
    refetchPlaces?.();
    refetchBoundary?.();
  }, [refetchBoundary, refetchPlaces]);

  const openSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchOpen(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, []);

  const closeSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchOpen(false);
    setSearchText("");
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    if (!selectedPlace?.id) return;
    const latest = allPlaces.find(
      (place) => String(place?.id) === String(selectedPlace.id),
    );
    if (latest) {
      setSelectedPlace(latest);
    }
  }, [allPlaces, selectedPlace]);

  const visiblePlaces = useMemo(
    () =>
      filterVisiblePlaces({
        places: allPlaces,
        searchText,
        activeCategoryId,
        activeArea,
        quickFilters,
        getRatingValue: getPlaceRatingValue,
        getReviewCount: getPlaceReviewCount,
        allAreasKey: ALL_AREAS_KEY,
      }),
    [allPlaces, searchText, activeCategoryId, activeArea, quickFilters],
  );

  const visiblePlaceSpatialIndex = useMemo(() => {
    const index = new Map();

    visiblePlaces.forEach((place) => {
      const latitude = Number(place?.latitude);
      const longitude = Number(place?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const key = getSpatialCellKey(latitude, longitude);
      const bucket = index.get(key) || [];
      bucket.push(place);
      index.set(key, bucket);
    });

    return index;
  }, [visiblePlaces]);

  const currentUserNickname = useMemo(() => {
    const nickname =
      authUser?.profile?.nickname || authUser?.nickname || authUser?.username;
    if (typeof nickname === "string" && nickname.trim()) {
      return nickname.trim();
    }

    const fullName = authUser?.profile?.fullName || authUser?.fullName;
    if (typeof fullName === "string" && fullName.trim()) {
      return fullName.trim();
    }

    return null;
  }, [authUser]);

  const currentUserAvatarUri = useMemo(
    () =>
      resolveMediaUrl(
        authUser?.profile?.avatar || authUser?.avatar || authUser?.photoURL,
      ),
    [authUser],
  );

  const mapBoundaryOverlays = useMemo(
    () => (
      <>
        {districtGeo ? <DistrictLayer geojson={districtGeo} /> : null}
        {wardGeo ? <WardLayer geojson={wardGeo} /> : null}
      </>
    ),
    [districtGeo, wardGeo],
  );

  const selectedPlaceId = selectedPlace?.id ?? null;

  const activePlace = useMemo(
    () => visiblePlaces.find((p) => p.id === selectedPlaceId) || selectedPlace,
    [visiblePlaces, selectedPlaceId, selectedPlace],
  );

  const focusMapForLocation = useCallback((location) => {
    if (location) {
      mapRef.current?.flyTo([location.longitude, location.latitude], 15);
      return;
    }
    mapRef.current?.flyTo([CAN_THO_CENTER.lng, CAN_THO_CENTER.lat], 12);
  }, []);

  const routeBuilder = useRouteBuilderController({
    allPlaces,
    onSelectPlace: setSelectedPlace,
    onLocationResolved: focusMapForLocation,
  });

  const {
    currentLocation,
    locateNow,
    mode: routeBuilderMode,
    setMode: setRouteBuilderMode,
    draftStops: routeBuilderDraftStops,
    canConfirm: routeBuilderCanConfirm,
    hasConfirmedRoute: routeBuilderHasConfirmedRoute,
    isDirty: routeBuilderIsDirty,
    minimumStops: routeBuilderMinimumStops,
    enabled: routeBuilderEnabled,
    pendingArrival: routeBuilderPendingArrival,
    recoveryMode: routeBuilderRecoveryMode,
    activeTarget: routeBuilderActiveTarget,
    distanceToActiveTargetLabel: routeBuilderDistanceToActiveTargetLabel,
    completedLegs: routeBuilderCompletedLegs,
    legCount: routeBuilderLegCount,
    hasPendingArrival: routeBuilderHasPendingArrival,
    completedView: routeBuilderCompletedView,
    etaLabel: routeBuilderEtaLabel,
    distanceLabel: routeBuilderDistanceLabel,
    isRouteError: isRouteBuilderError,
    isRouteFetching: isRouteBuilderFetching,
    arrivalAlertVisible: routeBuilderArrivalAlertVisible,
    recoveryCoordinates: routeBuilderRecoveryCoordinates,
    recoverySource: routeBuilderRecoverySource,
    legVisuals: routeBuilderLegVisuals,
    addStopFromPlace: handleAddRouteBuilderStopFromPlace,
    removeStop: handleRemoveRouteBuilderStop,
    clear: handleClearRouteBuilder,
    confirmRoute: handleConfirmRouteBuilder,
    exit: handleExitRouteBuilder,
    confirmArrivedLeg: handleConfirmArrivedRouteBuilderLeg,
    dismissArrivalAlert: handleDismissRouteBuilderArrivalAlert,
    resetProgress: handleResetRouteBuilderProgress,
    toggleCompletedView: handleToggleCompletedLegView,
    retryRoute: refetchRouteBuilder,
    hasFinished: routeBuilderHasFinished,
  } = routeBuilder;

  const routeOriginFromCurrentLocation = useMemo(() => {
    if (
      !currentLocation ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      name: MAP_TEXT.common.currentLocationName,
    };
  }, [currentLocation]);

  const routeDestinationFromSelectedPlace = useMemo(() => {
    if (
      !activePlace ||
      !Number.isFinite(activePlace.latitude) ||
      !Number.isFinite(activePlace.longitude)
    ) {
      return null;
    }

    return {
      lat: Number(activePlace.latitude),
      lng: Number(activePlace.longitude),
      name: activePlace.name || MAP_TEXT.common.destinationName,
    };
  }, [activePlace]);

  const shouldSuppressSingleRoute = routeBuilderEnabled;

  const routeOrigin = shouldSuppressSingleRoute
    ? null
    : routeOriginFromCurrentLocation;
  const routeDestination = shouldSuppressSingleRoute
    ? null
    : routeDestinationFromSelectedPlace;

  const routeEnabled = Boolean(routeOrigin && routeDestination);

  const {
    coordinates: routeCoordinates,
    source: routeSource,
    distanceM: routeDistanceM,
    durationS: routeDurationS,
    isError: isRouteError,
    isFallback: isRouteFallback,
    isFetching: isRouteFetching,
    error: routeError,
    refetch: refetchRoute,
  } = useMapRouting({
    origin: routeOrigin,
    destination: routeDestination,
    mode: "motorcycle",
    enabled: routeEnabled,
  });

  const routeEtaLabel = useMemo(
    () => formatRouteEta(routeDurationS),
    [routeDurationS],
  );
  const routeDistanceLabel = useMemo(
    () => formatRouteDistance(routeDistanceM),
    [routeDistanceM],
  );

  const shouldShowPreviewTravelInfo = useMemo(() => {
    if (shouldSuppressSingleRoute) return false;
    if (!routeEnabled || !activePlace) return false;
    return true;
  }, [activePlace, routeEnabled, shouldSuppressSingleRoute]);

  const previewTravelLoading =
    shouldShowPreviewTravelInfo &&
    isRouteFetching &&
    !routeEtaLabel &&
    !routeDistanceLabel;

  const routeStatus = useMemo(() => {
    if (routeBuilderMode || !routeEnabled) return null;

    if (isRouteError) {
      return {
        type: "error",
        icon: "wifi-off",
        title: MAP_TEXT.errors.routeDirectionTitle,
        message: routeError?.message || MAP_TEXT.errors.routeDirectionMessage,
        canRetry: true,
      };
    }

    if (routeSource === "fallback" || isRouteFallback) {
      return {
        type: "fallback",
        icon: "info-outline",
        title: MAP_TEXT.errors.routeFallbackTitle,
        message: MAP_TEXT.errors.routeFallbackMessage,
        canRetry: true,
      };
    }

    return null;
  }, [
    isRouteError,
    isRouteFallback,
    routeBuilderMode,
    routeEnabled,
    routeError?.message,
    routeSource,
  ]);

  const handleLocate = useCallback(async () => {
    const location = await locateNow();
    focusMapForLocation(location ?? null);
    return location;
  }, [focusMapForLocation, locateNow]);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    if (place.longitude && place.latitude) {
      mapRef.current?.flyTo([place.longitude, place.latitude], 15);
    }
  }, []);

  const handleLongPressPlace = useCallback(
    (place) => {
      handleAddRouteBuilderStopFromPlace(place);
    },
    [handleAddRouteBuilderStopFromPlace],
  );

  const handleStartRouteFromPreview = useCallback(
    async (place) => {
      if (!place?.id) return;

      const routeMode = MAP_TEXT.analytics.routeModeCurrentLocationToPlace;
      const eventSignature = `${String(place.id)}:${routeMode}:${routeSource || MAP_TEXT.common.unknownValue}`;
      const now = Date.now();

      // Guard against rapid double-press firing duplicated analytics events.
      if (
        lastNavigationEventRef.current.signature === eventSignature &&
        now - lastNavigationEventRef.current.timestamp <
          NAVIGATION_EVENT_DEDUP_MS
      ) {
        return;
      }

      lastNavigationEventRef.current = {
        signature: eventSignature,
        timestamp: now,
      };

      trackEvent("navigation_started", {
        placeId: place.id,
        placeName: place.name || MAP_TEXT.common.unknownValue,
        fromScreen: "map_preview",
        routeMode,
        routeSource: routeSource || MAP_TEXT.common.unknownValue,
        distance: routeDistanceM ?? null,
        duration: routeDurationS ?? null,
        vehicleType: "motorcycle",
        timestamp: new Date().toISOString(),
      });

      setSelectedPlace(place);
      setRouteBuilderMode(false);

      if (!currentLocation) {
        await handleLocate();
      }
    },
    [
      currentLocation,
      handleLocate,
      routeDistanceM,
      routeDurationS,
      routeSource,
    ],
  );

  const handleClosePreview = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleMapPress = useCallback((event) => {
    if (event?.nativeEvent?.action === "marker-press") return;
    setSelectedPlace(null);
  }, []);

  const handleMapLongPress = useCallback(
    (event) => {
      const latitude = Number(event?.nativeEvent?.coordinate?.latitude);
      const longitude = Number(event?.nativeEvent?.coordinate?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      let nearestPlace = null;
      let minDistance = Number.POSITIVE_INFINITY;
      const candidatePlaces = buildNearbySpatialKeys(latitude, longitude)
        .flatMap((key) => visiblePlaceSpatialIndex.get(key) || []);

      candidatePlaces.forEach((place) => {
        const placeLat = Number(place?.latitude);
        const placeLng = Number(place?.longitude);
        if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) return;

        const meters = distanceMeters(latitude, longitude, placeLat, placeLng);
        if (meters < minDistance) {
          minDistance = meters;
          nearestPlace = place;
        }
      });

      if (
        nearestPlace &&
        minDistance <= ROUTE_BUILDER_LONG_PRESS_PICK_RADIUS_M
      ) {
        handleLongPressPlace(nearestPlace);
      }
    },
    [handleLongPressPlace, visiblePlaceSpatialIndex],
  );

  const handleOpenPlaceDetail = useCallback(
    (place) => {
      if (!place?.id) return;
      router.push(`/place/${place.id}`);
    },
    [router],
  );

  useEffect(() => {
    const focusLat = Array.isArray(params.focusLat)
      ? params.focusLat[0]
      : params.focusLat;
    const focusLng = Array.isArray(params.focusLng)
      ? params.focusLng[0]
      : params.focusLng;
    const focusPlaceId = Array.isArray(params.focusPlaceId)
      ? params.focusPlaceId[0]
      : params.focusPlaceId;
    const search = Array.isArray(params.search)
      ? params.search[0]
      : params.search;

    if (search) {
      setSearchText(String(search));
    }

    if (!focusLat || !focusLng) return;

    const lat = Number(focusLat);
    const lng = Number(focusLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = `${lat}:${lng}:${focusPlaceId || ""}`;
    if (lastAppliedFocusRef.current === key) return;
    lastAppliedFocusRef.current = key;

    mapRef.current?.flyTo([lng, lat], 15);

    if (!focusPlaceId) return;
    const matchedPlace = (mapPlaces || []).find(
      (place) =>
        String(place.id) === String(focusPlaceId) ||
        String(place.slug) === String(focusPlaceId),
    );
    if (matchedPlace) {
      setSelectedPlace(matchedPlace);
    }
  }, [params, mapPlaces]);

  const routeBuilderNavigationMeta = useNavigationStateMachine({
    routeBuilderMode,
    routeBuilderHasFinished,
    routeBuilderPendingArrival,
    routeBuilderRecoveryMode,
    routeBuilderActiveTargetName: routeBuilderActiveTarget?.name,
  });

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: MAP_UI_THEME.background }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View className="absolute inset-0">
        {isLoading ? (
          <View
            className="flex-1 items-center justify-center gap-3"
            style={{ backgroundColor: MAP_UI_THEME.background }}
          >
            <ActivityIndicator color={MAP_UI_THEME.neon} size="large" />
            <Text
              className="text-[14px] font-medium"
              style={{ color: MAP_UI_THEME.text }}
            >
              {MAP_TEXT.loading.map}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            className="flex-1 items-center justify-center gap-3"
            style={{ backgroundColor: MAP_UI_THEME.background }}
          >
            <MaterialIcons name="wifi-off" size={40} color="#FB7185" />
            <Text className="text-[14px]" style={{ color: MAP_UI_THEME.text }}>
              {MAP_TEXT.errors.mapData}
            </Text>
            <Pressable
              onPress={refetch}
              className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <MaterialIcons
                name="refresh"
                size={18}
                color={MAP_UI_THEME.text}
              />
              <Text className="text-[14px] font-bold text-white">
                {MAP_TEXT.errors.retry}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Always render MapView - pins should be visible even if there are errors */}
        <MapView
          ref={mapRef}
          places={visiblePlaces}
          selectedPlaceId={activePlace?.id ?? null}
          onSelectPlace={handleSelectPlace}
          onLongPressPlace={handleLongPressPlace}
          onPressMap={handleMapPress}
          onLongPressMap={handleMapLongPress}
          tileUrls={mapStyle.urls}
          mapType={mapStyle.mapType || "standard"}
          useNativeCleanStyle={mapStyle.useNativeCleanStyle === true}
          style={MAP_CANVAS_STYLE}
        >
          {mapBoundaryOverlays}

          <CurrentLocationMarker
            location={currentLocation}
            nickname={currentUserNickname}
            avatarUri={currentUserAvatarUri}
          />

          <RouteBuilderStopsMarkerLayer stops={routeBuilderDraftStops} />

          <ActiveRouteLayer
            routeBuilderEnabled={routeBuilderEnabled}
            routeBuilderRecoveryMode={routeBuilderRecoveryMode}
            routeBuilderRecoveryCoordinates={routeBuilderRecoveryCoordinates}
            routeBuilderRecoverySource={routeBuilderRecoverySource}
            routeBuilderLegVisuals={routeBuilderLegVisuals}
            routeCoordinates={routeCoordinates}
            routeSource={routeSource}
          />
        </MapView>
      </View>

      <RouteBuilderPanel
        visible={routeBuilderMode}
        bottomOffset={FLOATING_TAB_CLEARANCE + 4}
        statusLabel={routeBuilderNavigationMeta.label}
        draftStops={routeBuilderDraftStops}
        canConfirm={routeBuilderCanConfirm}
        hasConfirmedRoute={routeBuilderHasConfirmedRoute}
        isDirty={routeBuilderIsDirty}
        minimumStops={routeBuilderMinimumStops}
        enabled={routeBuilderEnabled}
        pendingArrival={routeBuilderPendingArrival}
        recoveryMode={routeBuilderRecoveryMode}
        activeTargetName={routeBuilderActiveTarget?.name}
        distanceToActiveTargetLabel={routeBuilderDistanceToActiveTargetLabel}
        completedLegs={routeBuilderCompletedLegs}
        legCount={routeBuilderLegCount}
        hasPendingArrival={routeBuilderHasPendingArrival}
        completedView={routeBuilderCompletedView}
        etaLabel={routeBuilderEtaLabel}
        distanceLabel={routeBuilderDistanceLabel}
        isRouteError={isRouteBuilderError}
        isRouteFetching={isRouteBuilderFetching}
        onExit={handleExitRouteBuilder}
        onRemoveStop={handleRemoveRouteBuilderStop}
        onConfirmRoute={handleConfirmRouteBuilder}
        onClear={handleClearRouteBuilder}
        onConfirmArrived={handleConfirmArrivedRouteBuilderLeg}
        onResetProgress={handleResetRouteBuilderProgress}
        onToggleCompletedView={handleToggleCompletedLegView}
        onRetryRoute={refetchRouteBuilder}
      />

      <ArrivalConfirmModal
        visible={routeBuilderMode && routeBuilderArrivalAlertVisible}
        targetName={routeBuilderPendingArrival?.targetName}
        onDismiss={handleDismissRouteBuilderArrivalAlert}
        onConfirm={handleConfirmArrivedRouteBuilderLeg}
      />

      <NavigationStatusBanner
        visible={routeEnabled && Boolean(routeStatus)}
        routeStatus={routeStatus}
        routeEtaLabel={routeEtaLabel}
        routeDistanceLabel={routeDistanceLabel}
        isRouteFetching={isRouteFetching}
        onRetry={refetchRoute}
        bottomOffset={
          routeBuilderMode
            ? FLOATING_TAB_CLEARANCE + 82
            : activePlace
              ? FLOATING_TAB_CLEARANCE + 194
              : FLOATING_TAB_CLEARANCE + 82
        }
      />

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 12 }}
        pointerEvents="box-none"
      >
        <View className="flex-row items-start px-4 gap-3" pointerEvents="auto">
          <Pressable
            className="w-[48px] h-[48px]"
            style={{ display: "none" }}
            onPress={undefined}
            accessibilityRole="button"
            accessibilityLabel={MAP_TEXT.accessibility.openMenu}
          >
            <BlurView
              tint="light"
              intensity={80}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.5)",
                overflow: "hidden",
              }}
            >
              <MaterialIcons
                name="menu"
                size={24}
                color={TOKENS.color.neutral[700]}
              />
            </BlurView>
          </Pressable>

          {/* Search bar expanding */}
          <View
            style={{
              flex: searchOpen ? 1 : 0,
              width: searchOpen ? undefined : 48,
              height: 48,
            }}
          >
            <BlurView
              tint="light"
              intensity={80}
              style={{
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
                overflow: "hidden",
                height: 48,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <Pressable
                onPress={searchOpen ? undefined : openSearch}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MaterialIcons
                  name="search"
                  size={22}
                  color={
                    searchOpen
                      ? TOKENS.color.primary[500]
                      : TOKENS.color.neutral[700]
                  }
                />
              </Pressable>

              {searchOpen ? (
                <>
                  <TextInput
                    ref={searchInputRef}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder={MAP_TEXT.search.placeholder}
                    placeholderTextColor={TOKENS.color.neutral[500]}
                    style={{
                      flex: 1,
                      height: 48,
                      fontSize: 15,
                      fontWeight: "700",
                      color: TOKENS.color.neutral[900],
                      paddingRight: 8,
                      fontFamily: TOKENS.font.semibold,
                    }}
                    returnKeyType="search"
                    onSubmitEditing={() => Keyboard.dismiss()} // Chỉ đóng bàn phím, để user thấy marker kết quả
                    autoCorrect={false}
                  />
                  {searchText.length > 0 ? (
                    <Pressable
                      onPress={() => setSearchText("")}
                      style={{
                        width: 44,
                        height: 48,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        size={20}
                        color={TOKENS.color.neutral[500]}
                      />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={closeSearch}
                    style={{
                      paddingRight: 14,
                      paddingLeft: 6,
                      height: 48,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: TOKENS.color.neutral[600],
                        fontSize: 14,
                        fontFamily: TOKENS.font.semibold,
                      }}
                    >
                      {MAP_TEXT.search.cancel}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </BlurView>
          </View>

          {/* Vùng trống để đẩy Profile */}
          {!searchOpen ? <View style={{ flex: 1 }} /> : null}

          <View className="items-end gap-2">
            <Pressable
              className="w-[48px] h-[48px]"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <BlurView
                tint="light"
                intensity={80}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  overflow: "hidden",
                }}
              >
                <MaterialIcons
                  name="person"
                  size={24}
                  color={TOKENS.color.neutral[700]}
                />
              </BlurView>
            </Pressable>
          </View>
        </View>

        <FilterGroupBar
          activeFilterGroup={activeFilterGroup}
          onSelectFilterGroup={handleSelectFilterGroup}
          activeFilterGroupMeta={activeFilterGroupMeta}
          activeFilterSummaryLabel={activeFilterSummaryLabel}
          onOpenFilterPicker={handleOpenFilterPicker}
        />

        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 14,
            bottom: FLOATING_TAB_CLEARANCE + 84,
            zIndex: 55,
          }}
        >
          <View className="items-end gap-3" pointerEvents="auto">
            <AIEntryButton onPress={() => router.push("/(tabs)/ai")} />

            <Pressable className="w-[44px] h-[44px]" onPress={handleLocate}>
              <GlassPanel
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                intensity={52}
              >
                <MaterialIcons
                  name="my-location"
                  size={20}
                  color={MAP_UI_THEME.neon}
                />
              </GlassPanel>
            </Pressable>

            <View className="flex-row items-center gap-2">
              {layerModalVisible && (
                <GlassPanel
                  style={{
                    flexDirection: "row",
                    padding: 4,
                    borderRadius: 26,
                    alignItems: "center",
                    gap: 4,
                  }}
                  intensity={80}
                >
                  <Pressable
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      setMapStyle(MAP_STYLES.OSM);
                      setLayerModalVisible(false);
                    }}
                    className="w-[44px] h-[44px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        mapStyle.key === "osm" ? "#1D1D1F" : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name="map"
                      size={20}
                      color={
                        mapStyle.key === "osm" ? "#FFFFFF" : MAP_UI_THEME.text
                      }
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      setMapStyle(MAP_STYLES.HYBRID);
                      setLayerModalVisible(false);
                    }}
                    className="w-[44px] h-[44px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        mapStyle.key === "hybrid" ? "#1D1D1F" : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name="satellite"
                      size={20}
                      color={
                        mapStyle.key === "hybrid"
                          ? "#FFFFFF"
                          : MAP_UI_THEME.text
                      }
                    />
                  </Pressable>
                </GlassPanel>
              )}
              <Pressable
                className="w-[44px] h-[44px]"
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setLayerModalVisible(!layerModalVisible);
                }}
              >
                <GlassPanel
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  intensity={52}
                >
                  <MaterialIcons
                    name={layerModalVisible ? "close" : "layers"}
                    size={20}
                    color={MAP_UI_THEME.text}
                  />
                </GlassPanel>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {activePlace && !routeBuilderMode ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: FLOATING_TAB_CLEARANCE + 8,
            zIndex: 70,
          }}
        >
          <PlacePreviewCard
            place={activePlace}
            onClose={handleClosePreview}
            onViewDetail={handleOpenPlaceDetail}
            onStartRoute={handleStartRouteFromPreview}
            showRouteAction
            travelEtaLabel={
              shouldShowPreviewTravelInfo ? routeEtaLabel : undefined
            }
            travelDistanceLabel={
              shouldShowPreviewTravelInfo ? routeDistanceLabel : undefined
            }
            travelLoading={previewTravelLoading}
            compact={isCompactPreviewCard}
          />
        </View>
      ) : null}

      <FilterPickerModal
        visible={filterPickerVisible}
        activeFilterGroupLabel={activeFilterGroupMeta.label}
        options={filterPickerOptions}
        onClose={handleCloseFilterPicker}
        onSelectOption={handleSelectFilterOption}
      />


    </View>
  );
}
