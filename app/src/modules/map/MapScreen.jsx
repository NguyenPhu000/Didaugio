import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useWindowDimensions,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import { useBoundaryData } from "./hooks/useBoundaryData";
import { useFilterState } from "./hooks/useFilterState";
import { useNavigationStateMachine } from "./hooks/useNavigationStateMachine";
import { useRouteBuilderController } from "./hooks/useRouteBuilderController";
import { useMapLocationTracker } from "./hooks/useMapLocationTracker";
import MapView from "./components/MapView";
import RoutePolyline from "./components/RoutePolyline";
import RouteBuilderPanel from "./components/route-builder/RouteBuilderPanel";
import ArrivalConfirmModal from "./components/navigation/ArrivalConfirmModal";
import ActiveTripNavBanner from "./components/navigation/ActiveTripNavBanner";
import NavigationStatusBanner from "./components/navigation/NavigationStatusBanner";
import NearbyWarningBanner from "./components/navigation/NearbyWarningBanner";
import StartNavigationModal from "./components/navigation/StartNavigationModal";
import TripCompleteModal from "./components/navigation/TripCompleteModal";
import DepartureReminderBanner from "./components/navigation/DepartureReminderBanner";
import {
  buildManeuverLabel,
  getManeuverIcon,
  pickUpcomingStep,
} from "./utils/maneuver";
import {
  useActiveTrip,
  ARRIVAL_RADIUS_M,
} from "../trips/hooks/useActiveTrip";
import { buildTripDays } from "../trips/utils/tripHelpers";
import { useDepartureAlerts } from "../trips/hooks/useDepartureAlerts";
import { useUpdateTrip } from "../trips/hooks/useTripDetail";
import { sendLocalNotification } from "../../lib/local-notifications";
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
import {
  FLOATING_TAB_CLEARANCE,
  TAB_BAR_HEIGHT,
} from "../../../app/(tabs)/_layout";
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

  // States cho Active Trip Mode
  const [nearbyTriggered, setNearbyTriggered] = useState(false);
  const [startNavConfirmVisible, setStartNavConfirmVisible] = useState(false);
  const [tripCompleteVisible, setTripCompleteVisible] = useState(false);
  const [completeIsTripEnd, setCompleteIsTripEnd] = useState(false);
  const [completeDayNumber, setCompleteDayNumber] = useState(1);

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

  // ─── MapTransportToMode helper ─────────────────────────────────────────────
  // Chuyển đổi phương tiện tiếng Việt sang OSRM mode.
  const mapTransportToMode = useCallback((transport) => {
    if (!transport) return "motorcycle";
    const t = String(transport).toLowerCase().trim();
    if (t.includes("đi bộ") || t.includes("walking")) return "walking";
    if (t.includes("xe hơi") || t.includes("ô tô") || t.includes("car")) return "driving";
    if (t.includes("xe đạp") || t.includes("cycling") || t.includes("bike")) return "cycling";
    if (t.includes("xe buýt") || t.includes("bus")) return "driving";
    return "motorcycle";
  }, []);

  // ─── Active Trip Ferry Avoidance (per-trip from AsyncStorage) ──────────────
  const [activeTripAvoidFerry, setActiveTripAvoidFerry] = useState(false);

  useEffect(() => {
    if (!isActiveTripMode || !activeTrip?.activeTripId) {
      setActiveTripAvoidFerry(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const key = `trip_avoidFerry_${activeTrip.activeTripId}`;
        const val = await AsyncStorage.getItem(key);
        if (!cancelled) setActiveTripAvoidFerry(val === "true");
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [isActiveTripMode, activeTrip?.activeTripId]);

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

  const routeBuilderNavigationMeta = useNavigationStateMachine({
    routeBuilderMode,
    routeBuilderHasFinished,
    routeBuilderPendingArrival,
    routeBuilderRecoveryMode,
    routeBuilderActiveTargetName: routeBuilderActiveTarget?.name,
  });

  // ─── Active Trip Mode ───────────────────────────────────────────────────────
  const activeTrip = useActiveTrip();
  const {
    isActive: isActiveTripMode,
    activeTrip: activeTripDetail,
    targetPoint: activeTargetPoint,
    nextDestination: activeNextDestination,
    isLastDestination: isActiveLastDestination,
    visitedIds: activeVisitedIds,
    markArrived: markActiveArrived,
    exitActiveTrip,
  } = activeTrip;

  const updateActiveTripMutation = useUpdateTrip(activeTrip.activeTripId);

  // Tần suất và khoảng cách GPS động dựa trên nearbyTriggered
  const gpsIntervals = useMemo(() => {
    if (nearbyTriggered) {
      return { timeInterval: 3000, distanceInterval: 5 }; // Boost frequency when NEARBY
    }
    return { timeInterval: 10000, distanceInterval: 15 }; // Default cruising frequency
  }, [nearbyTriggered]);

  // GPS thời gian thực riêng cho active trip (route builder dùng tracker khác). Dừng định vị khi paused.
  const {
    currentLocation: activeTripLocation,
    locateNow: locateActiveTripNow,
  } = useMapLocationTracker({
    watchEnabled: isActiveTripMode && !activeTrip.isPaused,
    timeInterval: gpsIntervals.timeInterval,
    distanceInterval: gpsIntervals.distanceInterval,
  });

  const [activeArrivalVisible, setActiveArrivalVisible] = useState(false);
  const followCameraRef = useRef(false);
  const arrivalHandledRef = useRef(null);

  // Xin quyền vị trí (foreground + background) khi vào Active Trip Mode.
  useEffect(() => {
    if (!isActiveTripMode) return;
    let cancelled = false;
    (async () => {
      try {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (cancelled || fg.status !== "granted") return;
        await Location.requestBackgroundPermissionsAsync();
      } catch {
        // Bỏ qua lỗi xin quyền — chế độ foreground vẫn hoạt động.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActiveTripMode]);

  // Bật auto-follow + bay camera về vị trí hiện tại khi vào chế độ.
  useEffect(() => {
    if (!isActiveTripMode || activeTrip.isPaused) {
      followCameraRef.current = false;
      return;
    }
    followCameraRef.current = true;
    void locateActiveTripNow();
  }, [isActiveTripMode, activeTrip.isPaused, locateActiveTripNow]);

  // Auto-follow camera theo GPS khi đang dẫn đường.
  useEffect(() => {
    if (!isActiveTripMode || activeTrip.isPaused || !followCameraRef.current || !activeTripLocation) {
      return;
    }
    mapRef.current?.flyTo(
      [activeTripLocation.longitude, activeTripLocation.latitude],
      16,
    );
  }, [
    isActiveTripMode,
    activeTrip.isPaused,
    activeTripLocation?.latitude,
    activeTripLocation?.longitude,
  ]);

  const activeRouteOrigin = useMemo(() => {
    if (!isActiveTripMode || activeTrip.isPaused || !activeTripLocation) return null;
    return {
      lat: activeTripLocation.latitude,
      lng: activeTripLocation.longitude,
      name: MAP_TEXT.common.currentLocationName,
    };
  }, [
    isActiveTripMode,
    activeTrip.isPaused,
    activeTripLocation?.latitude,
    activeTripLocation?.longitude,
  ]);

  // Mode cho active trip: lấy từ transportToNext của chặng hiện tại.
  // Phương tiện của chặng hiện tại được lưu ở địa điểm xuất phát (địa điểm liền trước của đích đến tiếp theo).
  const activeTravelMode = useMemo(() => {
    if (!activeTripDetail?.destinations?.length || !activeNextDestination) {
      return "motorcycle";
    }

    const ordered = [...activeTripDetail.destinations].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return a.order - b.order;
    });

    const currentIndex = ordered.findIndex((d) => d.id === activeNextDestination.id);
    if (currentIndex > 0) {
      const prevDest = ordered[currentIndex - 1];
      // Nếu cùng ngày, lấy phương tiện chặng tiếp theo của điểm trước đó
      if (prevDest.dayNumber === activeNextDestination.dayNumber) {
        return mapTransportToMode(prevDest.transportToNext);
      }
    }

    // Nếu là địa điểm đầu tiên của chuyến đi hoặc điểm đầu tiên của ngày mới,
    // sử dụng phương tiện đi tiếp của chính điểm đó, hoặc mặc định là xe máy
    return mapTransportToMode(activeNextDestination.transportToNext || "motorcycle");
  }, [activeTripDetail?.destinations, activeNextDestination, mapTransportToMode]);

  const {
    coordinates: activeRouteCoordinates,
    firstRoute: activeFirstRoute,
    source: activeRouteSource,
    distanceM: activeRouteDistanceM,
    durationS: activeRouteDurationS,
    isFetching: isActiveRouteFetching,
    ferryAvoidanceFailed: activeRouteFerryAvoidanceFailed,
  } = useMapRouting({
    origin: activeRouteOrigin,
    destination: activeTargetPoint,
    mode: activeTravelMode,
    options: {
      exclude: activeTripAvoidFerry ? "ferry" : undefined,
    },
    enabled: Boolean(activeRouteOrigin && activeTargetPoint),
  });

  const activeDistanceToTarget = useMemo(() => {
    if (!activeTripLocation || !activeTargetPoint) return null;
    return distanceMeters(
      activeTripLocation.latitude,
      activeTripLocation.longitude,
      activeTargetPoint.lat,
      activeTargetPoint.lng,
    );
  }, [activeTripLocation, activeTargetPoint]);

  const activeUpcomingStep = useMemo(() => {
    const steps = activeFirstRoute?.legs?.[0]?.steps;
    return pickUpcomingStep(steps, activeTripLocation, distanceMeters);
  }, [activeFirstRoute, activeTripLocation]);

  const activeInstruction = useMemo(
    () => (activeUpcomingStep ? buildManeuverLabel(activeUpcomingStep) : null),
    [activeUpcomingStep],
  );
  const activeInstructionIcon = useMemo(
    () =>
      activeUpcomingStep ? getManeuverIcon(activeUpcomingStep) : "navigation",
    [activeUpcomingStep],
  );
  const activeRouteEtaLabel = useMemo(
    () => formatRouteEta(activeRouteDurationS),
    [activeRouteDurationS],
  );
  const activeRouteDistanceLabel = useMemo(
    () => formatRouteDistance(activeRouteDistanceM),
    [activeRouteDistanceM],
  );

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
        nextName: activeNextDestination.place?.name || "địa điểm tiếp theo",
        minutesLeft: Math.max(0, Math.ceil(minutesLeft)),
      };
    }
    return null;
  }, [isActiveTripMode, activeTrip.isPaused, currentDestination, activeNextDestination, dayDateMap]);

  // Phát hiện đến nơi (< 50m) → mở popup điểm danh.
  useEffect(() => {
    if (!isActiveTripMode || !activeNextDestination) {
      setActiveArrivalVisible(false);
      return;
    }
    if (
      Number.isFinite(activeDistanceToTarget) &&
      activeDistanceToTarget <= ARRIVAL_RADIUS_M &&
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
    if (!isActiveTripMode || activeTrip.isPaused || !activeDistanceToTarget || activeDistanceToTarget <= ARRIVAL_RADIUS_M) {
      setNearbyTriggered(false);
      return;
    }
    if (activeDistanceToTarget <= 150) {
      setNearbyTriggered(true);
    } else if (activeDistanceToTarget > 200) {
      setNearbyTriggered(false);
    }
  }, [activeDistanceToTarget, isActiveTripMode, activeTrip.isPaused]);

  const handleExitActiveTrip = useCallback(async () => {
    followCameraRef.current = false;
    setActiveArrivalVisible(false);
    await exitActiveTrip();
  }, [exitActiveTrip]);

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
        title: "Hoàn thành hành trình!",
        body: `Chúc mừng bạn đã hoàn thành chuyến đi "${activeTripDetail?.title || "của mình"}". Hẹn gặp lại ở những hành trình tiếp theo!`,
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
          title: `Hoàn thành Ngày ${currentDay}!`,
          body: `Tất cả các địa điểm của ngày hôm nay đã được khám phá. Hãy nghỉ ngơi lấy sức nhé!`,
        });
        setCompleteIsTripEnd(false);
        setCompleteDayNumber(currentDay);
        setTripCompleteVisible(true);
      } else {
        await sendLocalNotification({
          title: "Đã điểm danh!",
          body: `Bạn đã đến ${arrivedDest.place?.name || "địa điểm"}. Tiếp tục đến điểm kế tiếp nhé!`,
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
    updateActiveTripMutation,
  ]);

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
  }, [currentLocation?.latitude, currentLocation?.longitude]);

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

  const shouldSuppressSingleRoute = routeBuilderEnabled || isActiveTripMode;

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
    ferryAvoidanceFailed: routeFerryAvoidanceFailed,
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
        avoidFerry: false,
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
      const candidatePlaces = buildNearbySpatialKeys(
        latitude,
        longitude,
      ).flatMap((key) => visiblePlaceSpatialIndex.get(key) || []);

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
    const startNav = Array.isArray(params.startNav)
      ? params.startNav[0]
      : params.startNav;

    if (startNav === "true") {
      setStartNavConfirmVisible(true);
      router.setParams({ startNav: undefined });
    }

    const resumeNav = Array.isArray(params.resumeNav)
      ? params.resumeNav[0]
      : params.resumeNav;

    if (resumeNav === "true") {
      activeTrip.resumeActiveTrip();
      router.setParams({ resumeNav: undefined });
    }

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
  }, [params, mapPlaces, router]);

  const showFerryWarning = useMemo(() => {
    if (isActiveTripMode) return activeTripAvoidFerry && Boolean(activeRouteFerryAvoidanceFailed);
    if (routeBuilderMode) return Boolean(routeBuilderEnabled && routeBuilder?.ferryAvoidanceFailed);
    return false;
  }, [
    activeTripAvoidFerry,
    isActiveTripMode,
    activeRouteFerryAvoidanceFailed,
    routeBuilderMode,
    routeBuilderEnabled,
    routeBuilder?.ferryAvoidanceFailed,
  ]);

  const warningTargetName = useMemo(() => {
    if (isActiveTripMode) return activeTargetPoint?.name;
    if (routeBuilderMode) return routeBuilder?.activeTarget?.name;
    return activePlace?.name;
  }, [isActiveTripMode, activeTargetPoint, routeBuilderMode, routeBuilder?.activeTarget, activePlace]);

  const warningTopOffset = useMemo(() => {
    if (isActiveTripMode) {
      return (insets.top || 0) + 106;
    }
    return (insets.top || 0) + 114;
  }, [isActiveTripMode, insets.top]);

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
            <MaterialIconsRounded name="wifi-off" size={40} color="#FB7185" />
            <Text className="text-[14px]" style={{ color: MAP_UI_THEME.text }}>
              {MAP_TEXT.errors.mapData}
            </Text>
            <Pressable
              onPress={refetch}
              className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <MaterialIconsRounded
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
          {districtGeo ? <DistrictLayer geojson={districtGeo} /> : null}
          {wardGeo ? <WardLayer geojson={wardGeo} /> : null}

          <CurrentLocationMarker
            location={isActiveTripMode ? activeTripLocation : currentLocation}
            avatarUri={currentUserAvatarUri}
            heading={
              (isActiveTripMode ? activeTripLocation : currentLocation)?.heading
            }
            headingAccuracy={
              (isActiveTripMode ? activeTripLocation : currentLocation)
                ?.headingAccuracy
            }
          />

          <RouteBuilderStopsMarkerLayer stops={routeBuilderDraftStops} />

          {isActiveTripMode && activeRouteCoordinates.length > 1 ? (
            <RoutePolyline
              coordinates={activeRouteCoordinates}
              source={activeRouteSource || "osrm"}
              strokeWidth={6}
              isPrimary
              dashed={activeRouteSource === "fallback"}
              color="hsl(145, 63%, 38%)"
              strokeOpacity={0.95}
            />
          ) : (
            <ActiveRouteLayer
              routeBuilderEnabled={routeBuilderEnabled}
              routeBuilderRecoveryMode={routeBuilderRecoveryMode}
              routeBuilderRecoveryCoordinates={routeBuilderRecoveryCoordinates}
              routeBuilderRecoverySource={routeBuilderRecoverySource}
              routeBuilderLegVisuals={routeBuilderLegVisuals}
              routeCoordinates={routeCoordinates}
              routeSource={routeSource}
            />
          )}
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

      <ActiveTripNavBanner
        visible={isActiveTripMode && !activeTrip.isPaused}
        topOffset={(insets.top || 0) + 12}
        instruction={activeInstruction}
        instructionIcon={activeInstructionIcon}
        targetName={activeTargetPoint?.name}
        etaLabel={activeRouteEtaLabel}
        distanceLabel={activeRouteDistanceLabel}
        isFetching={isActiveRouteFetching}
        travelMode={activeTravelMode}
        onExit={handleExitActiveTrip}
      />

      <NearbyWarningBanner
        visible={isActiveTripMode && !activeTrip.isPaused && nearbyTriggered}
        topOffset={(insets.top || 0) + 94}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? 0}
      />

      <DepartureReminderBanner
        visible={Boolean(departureReminder)}
        bottomOffset={FLOATING_TAB_CLEARANCE + 12}
        nextName={departureReminder?.nextName}
        minutesLeft={departureReminder?.minutesLeft ?? 10}
      />

      {/* Banner khi Hành trình đang tạm nghỉ */}
      {isActiveTripMode && activeTrip.isPaused && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: FLOATING_TAB_CLEARANCE + 12,
            zIndex: 80,
          }}
        >
          <BlurView
            tint="dark"
            intensity={36}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.16)",
              backgroundColor: "rgba(16, 24, 32, 0.92)",
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialIconsRounded name="pause-circle-filled" size={24} color="#FFD60A" />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: TOKENS.font.semibold }}>
                  Hành trình đang tạm nghỉ
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: TOKENS.font.medium }}>
                  Dẫn đường và theo dõi GPS đã dừng để tiết kiệm pin.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={async () => {
                await activeTrip.resumeActiveTrip();
                followCameraRef.current = true;
                await locateActiveTripNow();
              }}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#007BFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                Tiếp tục
              </Text>
            </Pressable>
          </BlurView>
        </View>
      )}

      <StartNavigationModal
        visible={startNavConfirmVisible}
        onDismiss={() => {
          setStartNavConfirmVisible(false);
          handleExitActiveTrip();
        }}
        onConfirm={async () => {
          setStartNavConfirmVisible(false);
          followCameraRef.current = true;
          await locateActiveTripNow();
        }}
      />

      <TripCompleteModal
        visible={tripCompleteVisible}
        isTripEnd={completeIsTripEnd}
        dayNumber={completeDayNumber}
        onDismiss={() => {
          setTripCompleteVisible(false);
          if (completeIsTripEnd) {
            handleExitActiveTrip();
          }
        }}
        onPrimaryAction={handlePrimaryTripComplete}
        primaryActionText={completeIsTripEnd ? "Hoàn tất" : "Tạm nghỉ"}
      />

      <ArrivalConfirmModal
        visible={isActiveTripMode && !activeTrip.isPaused && activeArrivalVisible}
        targetName={activeTargetPoint?.name}
        onDismiss={handleDismissActiveArrival}
        onConfirm={handleConfirmActiveArrival}
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
              ? FLOATING_TAB_CLEARANCE + 124
              : FLOATING_TAB_CLEARANCE + 82
        }
      />

      {showFerryWarning && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            ...(isActiveTripMode
              ? { top: warningTopOffset }
              : {
                  bottom: routeBuilderMode
                    ? FLOATING_TAB_CLEARANCE + 154
                    : activePlace
                      ? FLOATING_TAB_CLEARANCE + 196
                      : FLOATING_TAB_CLEARANCE + 128,
                }),
            zIndex: 99,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FECACA",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <MaterialIconsRounded name="directions-boat" size={16} color="#B45309" />
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontFamily: TOKENS.font.semibold,
                  color: "#92400E",
                  lineHeight: 15,
                }}
              >
                Không tìm thấy đường tránh phà. Đã chấp nhận tuyến có phà.
              </Text>
            </View>
          </View>
        </View>
      )}

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 12 }}
        pointerEvents="box-none"
      >
        {!isActiveTripMode ? (
          <View
            className="flex-row items-center px-4 gap-3"
            pointerEvents="auto"
          >
            {/* Search bar — full width glass pill */}
            <Pressable
              onPress={searchOpen ? undefined : openSearch}
              style={{ flex: 1 }}
            >
              <BlurView
                tint="light"
                intensity={80}
                style={{
                  borderRadius: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  overflow: "hidden",
                  height: 44,
                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MaterialIconsRounded
                    name="search"
                    size={20}
                    color={
                      searchOpen
                        ? TOKENS.color.primary[500]
                        : TOKENS.color.neutral[500]
                    }
                  />
                </View>

                {searchOpen ? (
                  <>
                    <TextInput
                      ref={searchInputRef}
                      value={searchText}
                      onChangeText={setSearchText}
                      placeholder={MAP_TEXT.search.placeholder}
                      placeholderTextColor={TOKENS.color.neutral[400]}
                      style={{
                        flex: 1,
                        height: 44,
                        fontSize: 14,
                        color: TOKENS.color.neutral[900],
                        fontFamily: TOKENS.font.medium,
                      }}
                      returnKeyType="search"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      autoCorrect={false}
                    />
                    {searchText.length > 0 ? (
                      <Pressable
                        onPress={() => setSearchText("")}
                        hitSlop={8}
                        style={{
                          width: 36,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialIconsRounded
                          name="close"
                          size={18}
                          color={TOKENS.color.neutral[400]}
                        />
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={closeSearch}
                      hitSlop={8}
                      style={{
                        paddingRight: 14,
                        paddingLeft: 4,
                        height: 44,
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: TOKENS.color.neutral[500],
                          fontSize: 13,
                          fontFamily: TOKENS.font.medium,
                        }}
                      >
                        {MAP_TEXT.search.cancel}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Text
                    style={{
                      flex: 1,
                      color: TOKENS.color.neutral[400],
                      fontSize: 14,
                      fontFamily: TOKENS.font.medium,
                      paddingRight: 14,
                    }}
                    numberOfLines={1}
                  >
                    {MAP_TEXT.search.placeholder}
                  </Text>
                )}
              </BlurView>
            </Pressable>

            {/* Profile avatar */}
            {!searchOpen ? (
              <Pressable
                onPress={() => router.push("/(tabs)/profile")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  overflow: "hidden",
                }}
              >
                <MaterialIconsRounded
                  name="person"
                  size={22}
                  color={TOKENS.color.neutral[600]}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!isActiveTripMode ? (
          <FilterGroupBar
            activeFilterGroup={activeFilterGroup}
            onSelectFilterGroup={handleSelectFilterGroup}
            activeFilterGroupMeta={activeFilterGroupMeta}
            activeFilterSummaryLabel={activeFilterSummaryLabel}
            onOpenFilterPicker={handleOpenFilterPicker}
          />
        ) : null}

{/* Phương tiện active trip tự động lấy từ transportToNext */}

        {/* Floating action buttons — vertical stack */}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 14,
            bottom:
              activePlace && !routeBuilderMode
                ? FLOATING_TAB_CLEARANCE + 108
                : FLOATING_TAB_CLEARANCE + 12,
            zIndex: 55,
          }}
        >
          <View
            style={{ alignItems: "flex-end", gap: 10 }}
            pointerEvents="auto"
          >
            {/* Layer picker popover */}
            {layerModalVisible && (
              <GlassPanel
                style={{
                  flexDirection: "row",
                  padding: 3,
                  borderRadius: 22,
                  alignItems: "center",
                  gap: 3,
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
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      mapStyle.key === "osm" ? "#1D1D1F" : "transparent",
                  }}
                >
                  <MaterialIconsRounded
                    name="map"
                    size={18}
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
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      mapStyle.key === "hybrid" ? "#1D1D1F" : "transparent",
                  }}
                >
                  <MaterialIconsRounded
                    name="satellite"
                    size={18}
                    color={
                      mapStyle.key === "hybrid" ? "#FFFFFF" : MAP_UI_THEME.text
                    }
                  />
                </Pressable>
              </GlassPanel>
            )}

            {/* Locate + Layer row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={handleLocate}>
                <GlassPanel
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  intensity={52}
                >
                  <MaterialIconsRounded
                    name="my-location"
                    size={19}
                    color={MAP_UI_THEME.neon}
                  />
                </GlassPanel>
              </Pressable>

              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setLayerModalVisible(!layerModalVisible);
                }}
              >
                <GlassPanel
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  intensity={52}
                >
                  <MaterialIconsRounded
                    name={layerModalVisible ? "close" : "layers"}
                    size={19}
                    color={MAP_UI_THEME.text}
                  />
                </GlassPanel>
              </Pressable>
            </View>

            {/* AI button */}
            <AIEntryButton onPress={() => router.push("/(tabs)/ai")} compact />
          </View>
        </View>
      </View>

      {activePlace && !routeBuilderMode && !isActiveTripMode ? (
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
