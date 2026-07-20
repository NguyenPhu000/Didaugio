import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StatusBar,
  View,
  useWindowDimensions,
  Alert,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateMoment } from "../explore/hooks/useEvents";
import { useMapActiveTripNavigation } from "./hooks/useMapActiveTripNavigation";
import { useMapDiscoveryState } from "./hooks/useMapDiscoveryState";
import { useMapLocationTracker } from "./hooks/useMapLocationTracker";
import { useMapPlaceRouting } from "./hooks/useMapPlaceRouting";
import { useMapRouteParams } from "./hooks/useMapRouteParams";
import { useMapTripPreview } from "./hooks/useMapTripPreview";
import { useMapTripExperience } from "./hooks/useMapTripExperience";
import { MapScreenCanvas } from "./components/MapScreenCanvas";
import { MapScreenOverlays } from "./components/MapScreenOverlays";
import { MapScreenTripOverlays } from "./components/MapScreenTripOverlays";
import {
  useActiveTrip,
  ARRIVAL_RADIUS_M,
} from "../trips/hooks/useActiveTrip";
import { buildTripDays } from "../trips/utils/tripHelpers";
import { useDepartureAlerts } from "../trips/hooks/useDepartureAlerts";
import { useTripDetail, useUpdateTrip } from "../trips/hooks/useTripDetail";
import { sendLocalNotification } from "../../lib/local-notifications";
import { useAuthStore } from "../../stores/authStore";
import {
  CAN_THO_CENTER,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "./config/mapConfig";
import { TOKENS } from "../../constants/design-tokens";
import {
  FLOATING_TAB_CLEARANCE,
} from "../../../app/(tabs)/_layout";
import { ALL_AREAS_KEY, FILTER_GROUP_OPTIONS } from "./constants/filter.constants";
import {
  SCREEN_DIM_ACTIVATE_DISTANCE_M,
  SCREEN_DIM_DEACTIVATE_DISTANCE_M,
  SCREEN_DIM_OVERLAY_OPACITY,
} from "./constants/navigation.constants";
import { MAP_TEXT } from "./constants/mapText.constants";
import {
  getVoiceMutedPreference,
  setVoiceMutedPreference,
  speakNavigationInstruction,
  stopSpeech,
} from "./utils/voiceGuidance";

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
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
};
const ARRIVING_SOON_RADIUS_M = 150;

const showLocationPermissionAlert = () => {
  Alert.alert(
    "Yeu cau quyen truy cap vi tri",
    "Vui long cap quyen vi tri trong Cai dat de ung dung co the dan duong thoi gian thuc.",
    [
      { text: "Huy", style: "cancel" },
      { text: "Mo Cai dat", onPress: () => Linking.openSettings() },
    ],
  );
};

function buildLocalDateTime(ymd, hhmm) {
  if (!ymd || !hhmm) return null;
  const [year, month, day] = String(ymd).split("-").map(Number);
  const [hours, minutes] = String(hhmm).split(":").map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export default function MapScreen() {
  const { t } = useTranslation();
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
  const [selectedPlace, setSelectedPlace] = useState(null);
  // Selecting a place only opens its preview. A route starts explicitly from
  // the directions action so marker taps never trigger a routing request.
  const [routingPlace, setRoutingPlace] = useState(null);
  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [mapRegion, setMapRegion] = useState({
    latitude: CAN_THO_CENTER.lat,
    longitude: CAN_THO_CENTER.lng,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  });

  // States cho Active Trip Mode
  const [nearbyTriggered, setNearbyTriggered] = useState(false);
  const [startNavConfirmVisible, setStartNavConfirmVisible] = useState(false);
  const [tripCompleteVisible, setTripCompleteVisible] = useState(false);
  const [completeIsTripEnd, setCompleteIsTripEnd] = useState(false);
  const [completeDayNumber, setCompleteDayNumber] = useState(1);
  const [isVoiceMuted, setIsVoiceMuted] = useState(true);

  const [isMomentUploading, setIsMomentUploading] = useState(false);

  const createMomentMutation = useCreateMoment();

  const {
    activeArea,
    activeCategoryId,
    activeFilterGroupMeta,
    activePlace,
    allPlaces,
    districtGeo,
    error,
    filterHandlers,
    filterPickerOptions,
    filterPickerVisible,
    filterState,
    handleCloseFilterPicker,
    handleResetFilters,
    handleSelectFilterOption,
    isLoading,
    isPlacesLoading,
    quickFilters,
    refetch,
    searchHandlers,
    searchState,
    searchText,
    setSearchText,
    visiblePlaces,
  } = useMapDiscoveryState({
    authUser,
    mapRegion,
    router,
    searchInputRef,
    selectedPlace,
    setSelectedPlace,
  });

  const mapTransportToMode = useCallback((transport) => {
    if (!transport) return "motorcycle";
    const t = String(transport).toLowerCase().trim();
    if (t.includes("đi bộ") || t.includes("walking")) return "walking";
    if (t.includes("xe hơi") || t.includes("ô tô") || t.includes("car")) return "driving";
    if (t.includes("xe đạp") || t.includes("cycling") || t.includes("bike")) return "cycling";
    if (t.includes("xe buýt") || t.includes("bus")) return "driving";
    return "motorcycle";
  }, []);

  useEffect(() => {
    let cancelled = false;
    getVoiceMutedPreference().then((muted) => {
      if (!cancelled) setIsVoiceMuted(muted);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const handleTopControlsLayout = useCallback((event) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setTopControlsHeight((previous) =>
      previous === nextHeight ? previous : nextHeight,
    );
  }, []);

  const focusMapForLocation = useCallback((location) => {
    if (location) {
      mapRef.current?.flyTo([location.longitude, location.latitude], 15);
      return;
    }
    mapRef.current?.flyTo([CAN_THO_CENTER.lng, CAN_THO_CENTER.lat], 12);
  }, []);

  // ─── Active Trip Mode ───────────────────────────────────────────────────────
  const activeTrip = useActiveTrip();
  const {
    isActive: hasActiveTrip,
    activeTrip: activeTripDetail,
    targetPoint: activeTargetPoint,
    nextDestination: activeNextDestination,
    isLastDestination: isActiveLastDestination,
    visitedIds: activeVisitedIds,
    markArrived: markActiveArrived,
    exitActiveTrip,
  } = activeTrip;

  const updateActiveTripMutation = useUpdateTrip(activeTrip.activeTripId);
  const rawTripPreviewId = Array.isArray(params.tripPreviewId)
    ? params.tripPreviewId[0]
    : params.tripPreviewId;
  const tripPreviewId =
    rawTripPreviewId && !hasActiveTrip ? String(rawTripPreviewId) : null;
  const { tripView } = useMapTripExperience({
    activeTrip: {
      isActive: hasActiveTrip,
      isPaused: activeTrip.isPaused,
    },
    tripPreviewId,
  });
  const { isActiveTripMode, isTripPreviewMode, isNormalMapMode } = tripView;
  const {
    currentLocation,
    hasForegroundPermission: mapHasForegroundPermission,
    locateNow,
  } = useMapLocationTracker({
    watchEnabled: isNormalMapMode,
    watchHeadingEnabled: false,
  });
  const hasMeasuredTopControls = topControlsHeight > 0 || !isNormalMapMode;
  const mapFabTopOffset = isNormalMapMode
    ? (insets.top || 0) + 12 + topControlsHeight + 12
    : (insets.top || 0) + 120;
  const mapStatusTopOffset = mapFabTopOffset + 54;
  const shouldShowMapStatus = isNormalMapMode && hasMeasuredTopControls;
  const hasActiveFilters =
    searchText.trim().length > 0 ||
    activeCategoryId !== null ||
    activeArea !== ALL_AREAS_KEY ||
    Object.values(quickFilters).some(Boolean);
  const { data: previewTrip, isLoading: isPreviewTripLoading } =
    useTripDetail(tripPreviewId);
  const updatePreviewTripMutation = useUpdateTrip(tripPreviewId);
  const [activeArrivalVisible, setActiveArrivalVisible] = useState(false);
  const followCameraRef = useRef(false);
  const arrivalHandledRef = useRef(null);
  const dimActivatedRef = useRef(false);
  const [isScreenDimmed, setIsScreenDimmed] = useState(false);

  const {
    activeDistanceToNextTurnLabel,
    activeDistanceToTarget,
    activeEventId,
    activeInstruction,
    activeInstructionIcon,
    activeMapPadding,
    activeRouteCoordinates,
    activeRouteDistanceLabel,
    activeRouteEtaLabel,
    activeRouteSource,
    activeTravelMode,
    activeTripLocation,
    activeTripSpeedKmh,
    activeUpcomingStep,
    broadcastNotice,
    isActiveRouteFetching,
    locateActiveTripNow,
    navigationController,
    shouldShowNativeUserLocation,
  } = useMapActiveTripNavigation({
    activeNextDestination,
    activeTargetPoint,
    activeTrip,
    activeTripDetail,
    currentLocation,
    isActiveTripMode,
    isTripPreviewMode,
    mapHasForegroundPermission,
    mapRef,
    nearbyTriggered,
    resolveTravelMode: mapTransportToMode,
    showLocationPermissionAlert,
    viewportHeight,
  });
  const {
    handleCancelTripPreview,
    handleConfirmTripPreview,
    isPreviewRouteError,
    isPreviewRouteLoading,
    previewSegments,
    previewStops,
  } = useMapTripPreview({
    activeTrip,
    floatingTabClearance: FLOATING_TAB_CLEARANCE,
    followCameraRef,
    insets,
    isTripPreviewMode,
    locateActiveTripNow,
    mapRef,
    previewTrip,
    resolveTravelMode: mapTransportToMode,
    router,
    t,
    updatePreviewTripMutation,
  });

  const handleToggleVoice = useCallback(() => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      void setVoiceMutedPreference(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isActiveTripMode || activeTrip.isPaused || !activeInstruction) return;

    const nextTurnDistance = navigationController.distanceToNextTurn;
    const distanceToDest = activeDistanceToTarget;
    let speechKey = null;
    let speechText = null;

    if (Number.isFinite(distanceToDest) && distanceToDest <= 30) {
      speechKey = `arrival:${activeNextDestination?.id ?? "destination"}`;
      speechText = t("map.voice.arrived", { name: activeTargetPoint?.name || t("map.voice.defaultDestination") });
    } else if (Number.isFinite(nextTurnDistance) && nextTurnDistance <= 50) {
      speechKey = `turn-now:${activeUpcomingStep?.maneuver?.location?.join(",")}`;
      speechText = activeInstruction;
    } else if (Number.isFinite(nextTurnDistance) && nextTurnDistance <= 300) {
      speechKey = `turn-soon:${activeUpcomingStep?.maneuver?.location?.join(",")}`;
      speechText = t("map.voice.distanceInstruction", { distance: Math.round(nextTurnDistance), instruction: activeInstruction });
    }

    if (speechText) {
      void speakNavigationInstruction(speechText, {
        key: speechKey,
        isMuted: isVoiceMuted,
        speedKmh: activeTripSpeedKmh,
      });
    }

    return () => {
      stopSpeech();
    };
  }, [
    activeDistanceToTarget,
    activeInstruction,
    activeNextDestination?.id,
    activeTargetPoint?.name,
    activeTrip.isPaused,
    activeTripSpeedKmh,
    activeUpcomingStep,
    isActiveTripMode,
    isVoiceMuted,
    navigationController.distanceToNextTurn,
    t,
  ]);

  // Nhắc nhở di chuyển thông minh trước 10 phút.
  useDepartureAlerts({
    activeTrip: activeTripDetail,
    visitedIds: activeVisitedIds,
    nextDestination: activeNextDestination,
    enabled: isActiveTripMode,
  });

  const dayDateMap = useMemo(() => {
    const map = new Map();
    if (!activeTripDetail) return map;
    for (const day of buildTripDays(activeTripDetail)) {
      map.set(day.dayNumber, day.dateYmd);
    }
    return map;
  }, [activeTripDetail]);

  const currentDestination = useMemo(() => {
    if (!activeTripDetail?.destinations?.length) return null;
    const visited = activeTripDetail.destinations
      .filter((d) => activeVisitedIds.includes(d.id) && d.endTime)
      .sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return a.order - b.order;
      });
    return visited.length ? visited[visited.length - 1] : null;
  }, [activeTripDetail, activeVisitedIds]);

  const departureReminder = useMemo(() => {
    if (!isActiveTripMode || activeTrip.isPaused || !currentDestination || !activeNextDestination) return null;
    const ymd = dayDateMap.get(currentDestination.dayNumber);
    const endAt = buildLocalDateTime(ymd, currentDestination.endTime);
    if (!endAt) return null;

    const now = new Date();
    const timeDiffMs = endAt.getTime() - now.getTime();
    const minutesLeft = timeDiffMs / (60 * 1000);

    if (minutesLeft <= 10 && minutesLeft >= -15) {
      return {
        nextName: activeNextDestination.place?.name || t("map.departureReminderBanner.defaultNextName"),
        minutesLeft: Math.max(0, Math.ceil(minutesLeft)),
      };
    }
    return null;
  }, [isActiveTripMode, activeTrip.isPaused, currentDestination, activeNextDestination, dayDateMap, t]);

  // Phát hiện sắp đến nơi (< 150m) → mở bottom banner không chặn bản đồ.
  useEffect(() => {
    if (!isActiveTripMode || !activeNextDestination) {
      setActiveArrivalVisible(false);
      return;
    }
    if (
      Number.isFinite(activeDistanceToTarget) &&
      activeDistanceToTarget <= ARRIVING_SOON_RADIUS_M &&
      arrivalHandledRef.current !== activeNextDestination.id
    ) {
      setActiveArrivalVisible(true);
    }
  }, [isActiveTripMode, activeDistanceToTarget, activeNextDestination]);

  // Reset nearbyTriggered và arrivalHandled khi đổi destination chặng tiếp theo
  useEffect(() => {
    setNearbyTriggered(false);
    arrivalHandledRef.current = null;
  }, [activeNextDestination?.id]);

  // Hysteresis logic cho nearby warning banner (khoảng cách <= 150m)
  useEffect(() => {
    if (
      !isActiveTripMode ||
      activeTrip.isPaused ||
      !activeDistanceToTarget ||
      activeArrivalVisible ||
      activeDistanceToTarget <= ARRIVAL_RADIUS_M
    ) {
      setNearbyTriggered(false);
      return;
    }
    if (activeDistanceToTarget <= 150) {
      setNearbyTriggered(true);
    } else if (activeDistanceToTarget > 200) {
      setNearbyTriggered(false);
    }
  }, [activeDistanceToTarget, isActiveTripMode, activeTrip.isPaused, activeArrivalVisible]);

  // Screen dimming: giảm sáng khi đường thẳng dài (> 1km không có ngã rẽ)
  useEffect(() => {
    if (!isActiveTripMode || activeTrip.isPaused) {
      setIsScreenDimmed(false);
      dimActivatedRef.current = false;
      return;
    }

    const nextTurnDist = navigationController.distanceToNextTurn;
    if (!Number.isFinite(nextTurnDist)) {
      setIsScreenDimmed(false);
      dimActivatedRef.current = false;
      return;
    }

    if (dimActivatedRef.current) {
      if (nextTurnDist <= SCREEN_DIM_DEACTIVATE_DISTANCE_M) {
        dimActivatedRef.current = false;
        setIsScreenDimmed(false);
      }
    } else if (nextTurnDist >= SCREEN_DIM_ACTIVATE_DISTANCE_M) {
      dimActivatedRef.current = true;
      setIsScreenDimmed(true);
    }
  }, [isActiveTripMode, activeTrip.isPaused, navigationController.distanceToNextTurn]);

  const handleExitActiveTrip = useCallback(async () => {
    followCameraRef.current = false;
    setActiveArrivalVisible(false);
    await exitActiveTrip();
  }, [exitActiveTrip]);

  const handleRequestStopActiveTrip = useCallback(() => {
    Alert.alert(
      t("mapScreen.stopJourneyTitle"),
      t("mapScreen.stopJourneyMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("mapScreen.stopJourney"),
          style: "destructive",
          onPress: () => {
            void handleExitActiveTrip();
          },
        },
      ],
    );
  }, [handleExitActiveTrip, t]);

  const handlePauseActiveTrip = useCallback(async () => {
    await activeTrip.pauseActiveTrip();
    followCameraRef.current = false;
    setIsScreenDimmed(false);
  }, [activeTrip]);

  const handleResumeActiveTrip = useCallback(async () => {
    await activeTrip.resumeActiveTrip();
    followCameraRef.current = true;
    await locateActiveTripNow();
  }, [activeTrip, locateActiveTripNow]);

  const handleDismissActiveArrival = useCallback(() => {
    // Tạm ẩn popup cho điểm hiện tại, tránh bật lại liên tục khi vẫn ở gần.
    if (activeNextDestination) {
      arrivalHandledRef.current = activeNextDestination.id;
    }
    setActiveArrivalVisible(false);
  }, [activeNextDestination]);

  const handlePrimaryTripComplete = useCallback(async () => {
    setTripCompleteVisible(false);
    if (completeIsTripEnd) {
      await handleExitActiveTrip();
    } else {
      await activeTrip.pauseActiveTrip();
    }
  }, [handleExitActiveTrip, completeIsTripEnd, activeTrip]);

  const handleConfirmActiveArrival = useCallback(async () => {
    const arrivedDest = activeNextDestination;
    if (!arrivedDest) return;

    arrivalHandledRef.current = arrivedDest.id;
    setActiveArrivalVisible(false);
    await markActiveArrived(arrivedDest.id);

    const updatedVisitedIds = [...activeVisitedIds, arrivedDest.id];

    if (isActiveLastDestination) {
      const finishedTripId = activeTrip.activeTripId;
      await sendLocalNotification({
        title: t("mapScreen.journeyComplete"),
        body: t("mapScreen.journeyCompleteDesc"),
        data: { tripId: finishedTripId },
      });
      if (finishedTripId) {
        updateActiveTripMutation.mutate({ status: "completed" });
      }
      setCompleteIsTripEnd(true);
      setCompleteDayNumber(arrivedDest.dayNumber);
      setTripCompleteVisible(true);
    } else {
      const currentDay = arrivedDest.dayNumber;
      const destinationsInDay = (activeTripDetail?.destinations || []).filter(
        (d) => d.dayNumber === currentDay
      );
      const isDayFinished = destinationsInDay.every((d) =>
        updatedVisitedIds.includes(d.id)
      );

      if (isDayFinished) {
        await sendLocalNotification({
          title: t("mapScreen.dayComplete", { day: currentDay }),
          body: t("mapScreen.dayCompleteDesc"),
        });
        setCompleteIsTripEnd(false);
        setCompleteDayNumber(currentDay);
        setTripCompleteVisible(true);
      } else {
        await sendLocalNotification({
          title: t("mapScreen.checkedIn"),
          body: t("mapScreen.checkedInDesc", { name: arrivedDest.place?.name || t("map.common.destinationNameLower") }),
        });
      }
    }
  }, [
    activeNextDestination,
    markActiveArrived,
    activeVisitedIds,
    isActiveLastDestination,
    activeTrip.activeTripId,
    activeTripDetail,
    t,
    updateActiveTripMutation,
  ]);

  const handleLocate = useCallback(async () => {
    if (isActiveTripMode) {
      followCameraRef.current = true;
      const location = await locateActiveTripNow();
      focusMapForLocation(location ?? null);
      return location;
    }
    const location = await locateNow();
    focusMapForLocation(location ?? null);
    return location;
  }, [focusMapForLocation, locateNow, isActiveTripMode, locateActiveTripNow]);

  const {
    handleStartRouteFromPreview,
    isRouteFetching,
    previewTravelLoading,
    refetchRoute,
    routeCoordinates,
    routeDistanceLabel,
    routeEnabled,
    routeEtaLabel,
    routeSource,
    routeStatus,
    shouldShowPreviewTravelInfo,
  } = useMapPlaceRouting({
    activePlace,
    currentLocation,
    handleLocate,
    isActiveTripMode,
    lastNavigationEventRef,
    routingPlace,
    setRoutingPlace,
    setSelectedPlace,
  });

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    setRoutingPlace(null);
    if (place.longitude && place.latitude) {
      const latOffset = 0.0022;
      mapRef.current?.flyTo([Number(place.longitude), Number(place.latitude) - latOffset], 15);
    }
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedPlace(null);
    setRoutingPlace(null);
  }, []);

  const handleMapPress = useCallback((event) => {
    if (event?.nativeEvent?.action === "marker-press") return;
    setSelectedPlace(null);
    setRoutingPlace(null);
  }, []);

  const handleOpenPlaceDetail = useCallback(
    (place) => {
      if (!place?.id) return;
      router.push(`/place/${place.id}`);
    },
    [router],
  );

  useMapRouteParams({
    activeTrip,
    lastAppliedFocusRef,
    mapPlaces: allPlaces,
    mapRef,
    params,
    router,
    setRoutingPlace,
    setSearchText,
    setSelectedPlace,
    setStartNavConfirmVisible,
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

      <MapScreenCanvas
        activeArea={activeArea}
        activeMapPadding={activeMapPadding}
        activePlace={activePlace}
        activeRouteCoordinates={activeRouteCoordinates}
        activeRouteSource={activeRouteSource}
        activeTrip={activeTrip}
        activeTripLocation={activeTripLocation}
        allAreasKey={ALL_AREAS_KEY}
        districtGeo={districtGeo}
        error={error}
        handleMapPress={handleMapPress}
        handleSelectPlace={handleSelectPlace}
        isActiveTripMode={isActiveTripMode}
        isLoading={isLoading}
        isTripPreviewMode={isTripPreviewMode}
        mapCanvasStyle={MAP_CANVAS_STYLE}
        mapRef={mapRef}
        mapStyle={mapStyle}
        mapText={MAP_TEXT}
        mapUiTheme={MAP_UI_THEME}
        navigationController={navigationController}
        previewSegments={previewSegments}
        previewStops={previewStops}
        refetch={refetch}
        routeCoordinates={routeCoordinates}
        routeSource={routeSource}
        setMapRegion={setMapRegion}
        shouldShowNativeUserLocation={shouldShowNativeUserLocation}
        visiblePlaces={visiblePlaces}
      />

      <MapScreenTripOverlays
        activeDistanceToNextTurnLabel={activeDistanceToNextTurnLabel}
        activeDistanceToTarget={activeDistanceToTarget}
        activeInstruction={activeInstruction}
        activeInstructionIcon={activeInstructionIcon}
        activeRouteDistanceLabel={activeRouteDistanceLabel}
        activeRouteEtaLabel={activeRouteEtaLabel}
        activeTargetPoint={activeTargetPoint}
        activeTravelMode={activeTravelMode}
        activeTrip={activeTrip}
        activeUpcomingStep={activeUpcomingStep}
        broadcastNotice={broadcastNotice}
        departureReminder={departureReminder}
        floatingTabClearance={FLOATING_TAB_CLEARANCE}
        handleCancelTripPreview={handleCancelTripPreview}
        handleConfirmTripPreview={handleConfirmTripPreview}
        handlePauseActiveTrip={handlePauseActiveTrip}
        handleRequestStopActiveTrip={handleRequestStopActiveTrip}
        handleResumeActiveTrip={handleResumeActiveTrip}
        handleToggleVoice={handleToggleVoice}
        insets={insets}
        isActiveRouteFetching={isActiveRouteFetching}
        isActiveTripMode={isActiveTripMode}
        isPreviewRouteError={isPreviewRouteError}
        isPreviewRouteLoading={isPreviewRouteLoading}
        isPreviewTripLoading={isPreviewTripLoading}
        isTripPreviewMode={isTripPreviewMode}
        isVoiceMuted={isVoiceMuted}
        mapText={MAP_TEXT}
        navigationController={navigationController}
        nearbyTriggered={nearbyTriggered}
        previewSegments={previewSegments}
        previewStops={previewStops}
        previewTrip={previewTrip}
        t={t}
        updatePreviewTripMutation={updatePreviewTripMutation}
      />
      <MapScreenOverlays
        activeArrivalVisible={activeArrivalVisible}
        activeDistanceToTarget={activeDistanceToTarget}
        activeEventId={activeEventId}
        activeFilterGroupMeta={activeFilterGroupMeta}
        activeNextDestination={activeNextDestination}
        activePlace={activePlace}
        activeTrip={activeTrip}
        activeTripLocation={activeTripLocation}
        activeTripSpeedKmh={activeTripSpeedKmh}
        activeTargetPoint={activeTargetPoint}
        completeDayNumber={completeDayNumber}
        completeIsTripEnd={completeIsTripEnd}
        createMomentMutation={createMomentMutation}
        error={error}
        filterGroups={FILTER_GROUP_OPTIONS}
        filterHandlers={filterHandlers}
        filterPickerOptions={filterPickerOptions}
        filterPickerVisible={filterPickerVisible}
        filterState={filterState}
        floatingTabClearance={FLOATING_TAB_CLEARANCE}
        followCameraRef={followCameraRef}
        handleCloseFilterPicker={handleCloseFilterPicker}
        handleClosePreview={handleClosePreview}
        handleConfirmTripComplete={handlePrimaryTripComplete}
        handleConfirmActiveArrival={handleConfirmActiveArrival}
        handleDismissActiveArrival={handleDismissActiveArrival}
        handleExitActiveTrip={handleExitActiveTrip}
        handleLocate={handleLocate}
        handleOpenPlaceDetail={handleOpenPlaceDetail}
        handleResetFilters={handleResetFilters}
        handleSelectFilterOption={handleSelectFilterOption}
        handleStartRouteFromPreview={handleStartRouteFromPreview}
        handleTopControlsLayout={handleTopControlsLayout}
        hasActiveFilters={hasActiveFilters}
        hasMeasuredTopControls={hasMeasuredTopControls}
        insets={insets}
        isActiveTripMode={isActiveTripMode}
        isCompactPreviewCard={isCompactPreviewCard}
        isMomentUploading={isMomentUploading}
        isPlacesLoading={isPlacesLoading}
        isRouteFetching={isRouteFetching}
        isScreenDimmed={isScreenDimmed}
        isTripPreviewMode={isTripPreviewMode}
        layerModalVisible={layerModalVisible}
        locateActiveTripNow={locateActiveTripNow}
        mapFabTopOffset={mapFabTopOffset}
        mapStatusTopOffset={mapStatusTopOffset}
        mapStyle={mapStyle}
        mapStyles={MAP_STYLES}
        mapText={MAP_TEXT}
        previewTravelLoading={previewTravelLoading}
        refetch={refetch}
        refetchRoute={refetchRoute}
        routeDistanceLabel={routeDistanceLabel}
        routeEnabled={routeEnabled}
        routeEtaLabel={routeEtaLabel}
        routeStatus={routeStatus}
        screenDimOverlayOpacity={SCREEN_DIM_OVERLAY_OPACITY}
        searchHandlers={searchHandlers}
        searchState={searchState}
        setIsMomentUploading={setIsMomentUploading}
        setLayerModalVisible={setLayerModalVisible}
        setMapStyle={setMapStyle}
        setSearchText={setSearchText}
        setStartNavConfirmVisible={setStartNavConfirmVisible}
        setTripCompleteVisible={setTripCompleteVisible}
        shouldShowMapStatus={shouldShowMapStatus}
        shouldShowPreviewTravelInfo={shouldShowPreviewTravelInfo}
        startNavConfirmVisible={startNavConfirmVisible}
        t={t}
        tripCompleteVisible={tripCompleteVisible}
        visiblePlaces={visiblePlaces}
      />
    </View>
  );
}
