import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StatusBar,
  Text,
  View,
  LayoutAnimation,
  useWindowDimensions,
  Alert,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import safeAsyncStorage from "../../utils/safeAsyncStorage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { usePingEvent, useEventDetail, useCreateMoment } from "../explore/hooks/useEvents";
import { MaterialIconsRounded } from "../../components/primitives/MaterialIconsRounded";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import { useBoundaryData } from "./hooks/useBoundaryData";
import { useFilterState } from "./hooks/useFilterState";
import { useMapLocationTracker } from "./hooks/useMapLocationTracker";
import { useNavigationController } from "./hooks/useNavigationController";
import { CheckInButton } from "./components/CheckInButton";
import MapView from "./components/MapView";
import MapTopControls from "./components/MapTopControls";
import MapFabStack from "./components/MapFabStack";
import MapPlacePreviewCard from "./components/MapPlacePreviewCard";
import MapStatusPill from "./components/MapStatusPill";
import RoutePolyline from "./components/RoutePolyline";
import SnapLine from "./components/SnapLine";
import ArrivalBanner from "./components/navigation/ArrivalBanner";
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
import { useTripDetail, useUpdateTrip } from "../trips/hooks/useTripDetail";
import { sendLocalNotification } from "../../lib/local-notifications";
import FilterPickerModal from "./components/filters/FilterPickerModal";
import { useMapRouting } from "./hooks/useMapRouting";
import { mapRoutingResponse } from "./hooks/routeMapping";
import { calculateRouteApi } from "../../api/routingApi";
import {
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../place/utils/placeDisplay";
import { trackEvent } from "../../lib/analytics";
import { resolveMediaUrl } from "../../lib/media-url";
import { useAuthStore } from "../../stores/authStore";
import { ContextualBoundaryLayer } from "./components/BoundaryLayer";
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
  NAVIGATION_EVENT_DEDUP_MS,
  SCREEN_DIM_ACTIVATE_DISTANCE_M,
  SCREEN_DIM_DEACTIVATE_DISTANCE_M,
  SCREEN_DIM_OVERLAY_OPACITY,
} from "./constants/navigation.constants";
import { MAP_TEXT } from "./constants/mapText.constants";
import { distanceMeters } from "./utils/distance";
import {
  formatRouteDistance,
  formatRouteEta,
} from "./utils/routeFormat";
import {
  getVoiceMutedPreference,
  setVoiceMutedPreference,
  speakNavigationInstruction,
  stopSpeech,
} from "./utils/voiceGuidance";
import { filterVisiblePlaces, getPlaceDistrictMeta } from "./utils/placeFilter";
import {
  buildTripPreviewSegments,
  buildTripPreviewStops,
} from "./utils/tripRoutePreview";

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
  const navigationTickHandlerRef = useRef(null);
  const pingMutationRef = useRef(null);

  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  // Selecting a place only opens its preview. A route starts explicitly from
  // the directions action so marker taps never trigger a routing request.
  const [routingPlace, setRoutingPlace] = useState(null);
  const [topControlsHeight, setTopControlsHeight] = useState(0);

  // States cho Active Trip Mode
  const [nearbyTriggered, setNearbyTriggered] = useState(false);
  const [startNavConfirmVisible, setStartNavConfirmVisible] = useState(false);
  const [tripCompleteVisible, setTripCompleteVisible] = useState(false);
  const [completeIsTripEnd, setCompleteIsTripEnd] = useState(false);
  const [completeDayNumber, setCompleteDayNumber] = useState(1);
  const [isVoiceMuted, setIsVoiceMuted] = useState(true);
  const [previewRouteResults, setPreviewRouteResults] = useState([]);
  const [isPreviewRouteLoading, setIsPreviewRouteLoading] = useState(false);
  const [isPreviewRouteError, setIsPreviewRouteError] = useState(false);

  // Event states
  const [activeEventId, setActiveEventId] = useState(null);
  const [isMomentUploading, setIsMomentUploading] = useState(false);

  // Fetch event detail with auto-polling every 10s for broadcastNotice
  const { data: eventData } = useEventDetail(activeEventId, !!activeEventId, {
    refetchInterval: activeEventId ? 10_000 : false,
  });
  const broadcastNotice = eventData?.broadcastNotice || null;

  const createMomentMutation = useCreateMoment();

  const {
    data: mapPlaces,
    isLoading: isPlacesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useMapPlaces();

  const {
    districts: districtGeo,
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
    handleResetFilters,
  } = useFilterState({
    categories,
    areaOptions,
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

  const handleActiveLocationUpdate = useCallback((location) => {
    navigationTickHandlerRef.current?.(location);
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

  const currentUserAvatarUri = useMemo(
    () =>
      resolveMediaUrl(
        authUser?.profile?.avatar || authUser?.avatar || authUser?.photoURL,
      ),
    [authUser],
  );
  const selectedPlaceId = selectedPlace?.id ?? null;

  const searchState = useMemo(
    () => ({
      open: searchOpen,
      text: searchText,
      inputRef: searchInputRef,
      currentUserAvatarUri,
    }),
    [currentUserAvatarUri, searchOpen, searchText],
  );

  const searchHandlers = useMemo(
    () => ({
      setText: setSearchText,
      open: openSearch,
      close: closeSearch,
      avatarPress: () => router.push("/(tabs)/profile"),
    }),
    [closeSearch, openSearch, router],
  );

  const filterState = useMemo(
    () => ({
      activeFilterGroup,
      activeFilterGroupMeta,
      activeFilterSummaryLabel,
    }),
    [activeFilterGroup, activeFilterGroupMeta, activeFilterSummaryLabel],
  );

  const filterHandlers = useMemo(
    () => ({
      selectFilterGroup: handleSelectFilterGroup,
      openFilterPicker: handleOpenFilterPicker,
    }),
    [handleOpenFilterPicker, handleSelectFilterGroup],
  );

  const handleTopControlsLayout = useCallback((event) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setTopControlsHeight((previous) =>
      previous === nextHeight ? previous : nextHeight,
    );
  }, []);

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

  const {
    currentLocation,
    heading: mapHeading,
    locateNow,
  } = useMapLocationTracker({
    watchEnabled: false,
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
  const rawTripPreviewId = Array.isArray(params.tripPreviewId)
    ? params.tripPreviewId[0]
    : params.tripPreviewId;
  const tripPreviewId =
    rawTripPreviewId && !isActiveTripMode ? String(rawTripPreviewId) : null;
  const isTripPreviewMode = Boolean(tripPreviewId);
  const isNormalMapMode = !isTripPreviewMode && !isActiveTripMode;
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
  const pingEventMutation = usePingEvent();

  useEffect(() => {
    pingMutationRef.current = pingEventMutation;
  }, [pingEventMutation]);

  // Tần suất và khoảng cách GPS động dựa trên nearbyTriggered
  const gpsIntervals = useMemo(() => {
    if (nearbyTriggered) {
      return { timeInterval: 3000, distanceInterval: 5 }; // Boost frequency when NEARBY
    }
    return { timeInterval: 10000, distanceInterval: 15 }; // Default cruising frequency
  }, [nearbyTriggered]);

  // GPS thời gian thực riêng cho active trip. Dừng định vị khi paused.
  const {
    currentLocation: activeTripLocation,
    heading: activeTripHeading,
    locateNow: locateActiveTripNow,
  } = useMapLocationTracker({
    watchEnabled: isActiveTripMode && !activeTrip.isPaused,
    timeInterval: gpsIntervals.timeInterval,
    distanceInterval: gpsIntervals.distanceInterval,
    onLocationUpdate: handleActiveLocationUpdate,
  });
  const userMapLocation = isActiveTripMode ? activeTripLocation : currentLocation;
  const liveUserHeading = isActiveTripMode ? activeTripHeading : mapHeading;
  const userHeading = Number.isFinite(liveUserHeading)
    ? liveUserHeading
    : Number.isFinite(userMapLocation?.heading)
    ? userMapLocation.heading
    : null;
  const shouldShowUserHeadingHat =
    !isTripPreviewMode &&
    userMapLocation &&
    Number.isFinite(userMapLocation.latitude) &&
    Number.isFinite(userMapLocation.longitude);
  const userHeadingOpacity = userHeading === null ? 0.45 : 1;

  const [activeArrivalVisible, setActiveArrivalVisible] = useState(false);
  const followCameraRef = useRef(false);
  const arrivalHandledRef = useRef(null);
  const dimActivatedRef = useRef(false);
  const [isScreenDimmed, setIsScreenDimmed] = useState(false);

  // Xin quyền vị trí (foreground + background) khi vào Active Trip Mode.
  useEffect(() => {
    if (!isActiveTripMode) return;
    let cancelled = false;
    (async () => {
      try {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (fg.status !== "granted") {
          showLocationPermissionAlert();
          return;
        }

        const bg = await Location.requestBackgroundPermissionsAsync();
        if (!cancelled && bg.status !== "granted") {
          showLocationPermissionAlert();
        }
      } catch {
        if (!cancelled) {
          showLocationPermissionAlert();
        }
        // Bỏ qua lỗi xin quyền — chế độ foreground vẫn hoạt động.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActiveTripMode]);

  // 1. Đọc activeEventId từ AsyncStorage khi activeTrip.activeTripId thay đổi
  useEffect(() => {
    const checkActiveEvent = async () => {
      try {
        if (isActiveTripMode && activeTrip.activeTripId) {
          const evId = await safeAsyncStorage.getItem(
            `didaugio:active_event_trip:${activeTrip.activeTripId}`
          );
          setActiveEventId(evId ? parseInt(evId, 10) : null);
        } else {
          setActiveEventId(null);
        }
      } catch (err) {
        console.error("Lỗi đọc activeEventId:", err);
      }
    };
    checkActiveEvent();
  }, [isActiveTripMode, activeTrip.activeTripId]);

  // 3. Định kỳ 3 phút gửi ping vị trí GPS chặng hiện tại lên API
  useEffect(() => {
    if (
      !isActiveTripMode ||
      !activeEventId ||
      !activeTripLocation ||
      activeTrip.isPaused ||
      !activeNextDestination?.placeId
    ) {
      return;
    }

    const sendPing = async () => {
      try {
        await pingMutationRef.current.mutateAsync({
          id: activeEventId,
          payload: {
            latitude: activeTripLocation.latitude,
            longitude: activeTripLocation.longitude,
            placeId: activeNextDestination.placeId,
          },
        });
      } catch (err) {
        console.error("Lỗi ping vị trí lên server:", err);
      }
    };

    sendPing();
    const interval = setInterval(sendPing, 180000); // 3 phút
    return () => clearInterval(interval);
  }, [
    isActiveTripMode,
    activeEventId,
    activeTripLocation,
    activeTripLocation?.latitude,
    activeTripLocation?.longitude,
    activeNextDestination?.placeId,
    activeTrip.isPaused,
  ]);

  // Bật auto-follow + bay camera về vị trí hiện tại khi vào chế độ.
  useEffect(() => {
    if (!isActiveTripMode || activeTrip.isPaused) {
      followCameraRef.current = false;
      return;
    }
    followCameraRef.current = true;
    void locateActiveTripNow();
  }, [isActiveTripMode, activeTrip.isPaused, locateActiveTripNow]);

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
    activeTripLocation,
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
    coordinates: baseActiveRouteCoordinates,
    firstRoute: baseActiveFirstRoute,
    source: baseActiveRouteSource,
    distanceM: baseActiveRouteDistanceM,
    durationS: baseActiveRouteDurationS,
    isFetching: isActiveRouteFetching,
  } = useMapRouting({
    origin: activeRouteOrigin,
    destination: activeTargetPoint,
    mode: activeTravelMode,
    enabled: Boolean(activeRouteOrigin && activeTargetPoint),
    navMode: "navigation",
  });

  const navigationController = useNavigationController({
    enabled: isActiveTripMode && !activeTrip.isPaused,
    routeCoordinates: baseActiveRouteCoordinates,
    firstRoute: baseActiveFirstRoute,
    destination: activeTargetPoint,
    mode: activeTravelMode,
    mapRef,
  });

  useEffect(() => {
    navigationTickHandlerRef.current = navigationController.onLocationUpdate;
    return () => {
      if (navigationTickHandlerRef.current === navigationController.onLocationUpdate) {
        navigationTickHandlerRef.current = null;
      }
    };
  }, [navigationController.onLocationUpdate]);

  const activeNavigationRoute = navigationController.routeOverride;
  const activeRouteCoordinates =
    activeNavigationRoute?.coordinates ?? baseActiveRouteCoordinates;
  const activeFirstRoute =
    activeNavigationRoute?.firstRoute ?? baseActiveFirstRoute;
  const activeRouteSource =
    activeNavigationRoute?.source ?? baseActiveRouteSource;
  const activeRouteDistanceM =
    navigationController.progress?.remainingMeters ??
    activeNavigationRoute?.distanceM ??
    baseActiveRouteDistanceM;
  const activeRouteDurationS =
    navigationController.progress?.etaSeconds ??
    activeNavigationRoute?.durationS ??
    baseActiveRouteDurationS;

  const activeDistanceToTarget = useMemo(() => {
    if (Number.isFinite(navigationController.distanceToDest)) {
      return navigationController.distanceToDest;
    }
    if (!activeTripLocation || !activeTargetPoint) return null;
    return distanceMeters(
      activeTripLocation.latitude,
      activeTripLocation.longitude,
      activeTargetPoint.lat,
      activeTargetPoint.lng,
    );
  }, [activeTripLocation, activeTargetPoint, navigationController.distanceToDest]);

  const activeUpcomingStep = useMemo(() => {
    if (navigationController.upcomingStep) return navigationController.upcomingStep;
    const steps = activeFirstRoute?.legs?.[0]?.steps;
    return pickUpcomingStep(steps, activeTripLocation, distanceMeters, {
      currentHeading: activeTripLocation?.heading,
    });
  }, [activeFirstRoute, activeTripLocation, navigationController.upcomingStep]);

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

  const previewStops = useMemo(
    () => buildTripPreviewStops(previewTrip?.destinations || []),
    [previewTrip?.destinations],
  );

  const previewSegments = useMemo(
    () => buildTripPreviewSegments(previewStops, previewRouteResults),
    [previewRouteResults, previewStops],
  );

  const previewFitCoordinates = useMemo(() => {
    if (previewSegments.length > 0) {
      return previewSegments.flatMap((segment) => segment.coordinates);
    }
    return previewStops.map((stop) => stop.coordinate);
  }, [previewSegments, previewStops]);

  useEffect(() => {
    if (!isTripPreviewMode || previewStops.length < 2) {
      setPreviewRouteResults([]);
      setIsPreviewRouteLoading(false);
      setIsPreviewRouteError(false);
      return;
    }

    let cancelled = false;
    setIsPreviewRouteLoading(true);
    setIsPreviewRouteError(false);

    Promise.all(
      previewStops.slice(0, -1).map(async (from, index) => {
        const to = previewStops[index + 1];
        try {
          const response = await calculateRouteApi({
            origin: {
              lat: from.coordinate.latitude,
              lng: from.coordinate.longitude,
              name: from.name,
            },
            destination: {
              lat: to.coordinate.latitude,
              lng: to.coordinate.longitude,
              name: to.name,
            },
            mode: mapTransportToMode(from.destination?.transportToNext),
            options: {
              alternatives: 1,
              steps: false,
              overview: "full",
              geometries: "polyline6",
              snapToRoad: true,
              simplifyGeometry: true,
            },
          });
          return mapRoutingResponse(response);
        } catch {
          return {
            coordinates: [from.coordinate, to.coordinate],
            distanceM: null,
            source: "fallback",
          };
        }
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const hasFallback = results.some((result) => result.source === "fallback");
        setPreviewRouteResults(results);
        setIsPreviewRouteError(hasFallback);
      })
      .finally(() => {
        if (!cancelled) setIsPreviewRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTripPreviewMode, mapTransportToMode, previewStops]);

  useEffect(() => {
    if (!isTripPreviewMode || previewFitCoordinates.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(previewFitCoordinates, {
        edgePadding: {
          top: (insets.top || 0) + 130,
          right: 48,
          bottom: FLOATING_TAB_CLEARANCE + 150,
          left: 48,
        },
        animated: true,
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [insets.top, isTripPreviewMode, previewFitCoordinates]);

  const activeDistanceToNextTurnLabel = useMemo(
    () => formatRouteDistance(navigationController.distanceToNextTurn),
    [navigationController.distanceToNextTurn],
  );
  const activeTripSpeedKmh =
    navigationController.lastLocation?.speedKmh ??
    activeTripLocation?.speedKmh ??
    (Number.isFinite(activeTripLocation?.speed) ? activeTripLocation.speed * 3.6 : 0);
  const activeMapPadding = useMemo(
    () =>
      isActiveTripMode && !activeTrip.isPaused
        ? { top: 0, right: 0, bottom: viewportHeight * 0.4, left: 0 }
        : undefined,
    [activeTrip.isPaused, isActiveTripMode, viewportHeight],
  );

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

  const handleCancelTripPreview = useCallback(() => {
    setPreviewRouteResults([]);
    router.setParams({ tripPreviewId: undefined });
    router.back();
  }, [router]);

  const handleConfirmTripPreview = useCallback(() => {
    if (!previewTrip?.id || updatePreviewTripMutation.isPending) return;
    if (previewStops.length === 0) {
      Alert.alert(t("common.error"), t("mapScreen.previewNoStops"));
      return;
    }

    updatePreviewTripMutation.mutate(
      { status: "in-progress" },
      {
        onSuccess: async () => {
          await activeTrip.startActiveTrip(previewTrip.id);
          await sendLocalNotification({
            title: t("trip.detail.startNotification"),
            body: t("trip.detail.startNotificationBody", {
              title: previewTrip.title || t("trip.detail.defaultTitle"),
            }),
            data: { tripId: previewTrip.id },
          });
          router.setParams({ tripPreviewId: undefined });
          followCameraRef.current = true;
          await locateActiveTripNow();
        },
        onError: (error) => {
          Alert.alert(
            t("common.error"),
            error?.message || t("trip.detail.startError"),
          );
        },
      },
    );
  }, [
    activeTrip,
    locateActiveTripNow,
    previewStops.length,
    previewTrip,
    router,
    t,
    updatePreviewTripMutation,
  ]);

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

  const routeDestinationFromRoutingPlace = useMemo(() => {
    if (
      !routingPlace ||
      !Number.isFinite(routingPlace.latitude) ||
      !Number.isFinite(routingPlace.longitude)
    ) {
      return null;
    }

    return {
      lat: Number(routingPlace.latitude),
      lng: Number(routingPlace.longitude),
      name: routingPlace.name || MAP_TEXT.common.destinationName,
    };
  }, [routingPlace]);

  const shouldSuppressSingleRoute = isActiveTripMode;

  const routeOrigin = shouldSuppressSingleRoute
    ? null
    : routeOriginFromCurrentLocation;
  const routeDestination = shouldSuppressSingleRoute
    ? null
    : routeDestinationFromRoutingPlace;

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
    if (String(activePlace.id) !== String(routingPlace?.id)) return false;
    return true;
  }, [activePlace, routeEnabled, routingPlace?.id, shouldSuppressSingleRoute]);

  const previewTravelLoading =
    shouldShowPreviewTravelInfo &&
    isRouteFetching &&
    !routeEtaLabel &&
    !routeDistanceLabel;

  const routeStatus = useMemo(() => {
    if (!routeEnabled) return null;

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
    setRoutingPlace(null);
    if (place.longitude && place.latitude) {
      const latOffset = 0.0022;
      mapRef.current?.flyTo([Number(place.longitude), Number(place.latitude) - latOffset], 15);
    }
  }, []);

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
      setRoutingPlace(place);

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
    const startRoute = Array.isArray(params.startRoute)
      ? params.startRoute[0]
      : params.startRoute;
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
    if (lastAppliedFocusRef.current !== key) {
      lastAppliedFocusRef.current = key;
      const latOffset = focusPlaceId ? 0.0022 : 0;
      mapRef.current?.flyTo([lng, lat - latOffset], 15);
    }

    if (!focusPlaceId) return;
    const matchedPlace = (mapPlaces || []).find(
      (place) =>
        String(place.id) === String(focusPlaceId) ||
        String(place.slug) === String(focusPlaceId),
    );
    if (matchedPlace) {
      setSelectedPlace(matchedPlace);
      if (startRoute === "true") {
        setRoutingPlace(matchedPlace);
        router.setParams({ startRoute: undefined });
      }
    }
  }, [activeTrip, params, mapPlaces, router]);

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
          places={isTripPreviewMode ? [] : visiblePlaces}
          selectedPlaceId={activePlace?.id ?? null}
          onSelectPlace={handleSelectPlace}
          onPressMap={handleMapPress}
          tileUrls={mapStyle.urls}
          mapType={mapStyle.mapType || "standard"}
          useNativeCleanStyle={mapStyle.useNativeCleanStyle === true}
          mapPadding={activeMapPadding}
          courseUpEnabled={isActiveTripMode && !activeTrip.isPaused}
          showsUserLocation={!isTripPreviewMode}
          showsUserHeadingIndicator={false}
          showsMyLocationButton={false}
          style={MAP_CANVAS_STYLE}
        >
          <ContextualBoundaryLayer
            geojson={districtGeo}
            activeArea={activeArea}
            allAreasKey={ALL_AREAS_KEY}
          />

          {shouldShowUserHeadingHat ? (
            <Marker
              coordinate={userMapLocation}
              anchor={{ x: 0.5, y: 0.56 }}
              rotation={userHeading ?? 0}
              tracksViewChanges={false}
              zIndex={1205}
            >
              <View className="h-[64px] w-[64px] items-center justify-center">
                <View
                  className="absolute h-[64px] w-[64px] items-center justify-start pt-1"
                  style={{
                    opacity: userHeadingOpacity,
                  }}
                >
                  <MaterialIconsRounded
                    name="navigation"
                    size={44}
                    color="#1A73E8"
                    style={{
                      textShadowColor: "rgba(255,255,255,0.96)",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 3,
                    }}
                  />
                </View>
              </View>
            </Marker>
          ) : null}

          {isTripPreviewMode && previewSegments.length > 0
            ? previewSegments.map((segment) => (
                <RoutePolyline
                  key={segment.id}
                  coordinates={segment.coordinates}
                  source={segment.source}
                  strokeWidth={6}
                  isPrimary
                  dashed={segment.dashed}
                  color={segment.color}
                  strokeOpacity={0.96}
                />
              ))
            : null}

          {isTripPreviewMode && previewSegments.length > 0
            ? previewSegments.map((segment) =>
                segment.labelCoordinate ? (
                  <Marker
                    key={`segment-label-${segment.id}`}
                    coordinate={segment.labelCoordinate}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={false}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 8,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: "rgba(17,24,39,0.9)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.82)",
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: segment.color,
                        }}
                      />
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontFamily: TOKENS.font.semibold,
                        }}
                      >
                        {[segment.label, segment.distanceLabel].filter(Boolean).join(" • ")}
                      </Text>
                    </View>
                  </Marker>
                ) : null,
              )
            : null}

          {isTripPreviewMode && previewStops.length > 0
            ? previewStops.map((stop) => {
                const imageUri = resolveMediaUrl(stop.thumbnail);
                return (
                  <Marker
                    key={`preview-stop-${stop.id}`}
                    coordinate={stop.coordinate}
                    anchor={{ x: 0.5, y: 0.92 }}
                    tracksViewChanges
                  >
                    <View style={{ alignItems: "center" }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          backgroundColor: "#FFFFFF",
                          padding: 3,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.22,
                          shadowRadius: 5,
                          elevation: 5,
                        }}
                      >
                        {imageUri ? (
                          <Image
                            source={{ uri: imageUri }}
                            style={{ width: "100%", height: "100%", borderRadius: 11 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              borderRadius: 11,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#F3F4F6",
                            }}
                          >
                            <MaterialIconsRounded name="place" size={24} color="#6B7280" />
                          </View>
                        )}
                      </View>
                      <View
                        style={{
                          marginTop: -8,
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            previewSegments[stop.sequence - 1]?.color ||
                            previewSegments[stop.sequence - 2]?.color ||
                            "#EF4444",
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 12,
                            fontFamily: TOKENS.font.bold,
                          }}
                        >
                          {stop.sequence}
                        </Text>
                      </View>
                    </View>
                  </Marker>
                );
              })
            : null}

          {!isTripPreviewMode && isActiveTripMode && activeRouteCoordinates.length > 1 ? (
            <RoutePolyline
              coordinates={activeRouteCoordinates}
              source={activeRouteSource || "osrm"}
              strokeWidth={6}
              isPrimary
              dashed={activeRouteSource === "fallback"}
              color="hsl(145, 63%, 38%)"
              strokeOpacity={navigationController.isGpsLost ? 0.4 : 0.95}
            />
          ) : !isTripPreviewMode && routeCoordinates.length > 1 ? (
            <RoutePolyline
              coordinates={routeCoordinates}
              source={routeSource || "osrm"}
              strokeWidth={5}
              isPrimary
              dashed={routeSource === "fallback"}
            />
          ) : null}

          {isActiveTripMode &&
          !navigationController.isGpsLost &&
          navigationController.snappedPoint &&
          Number(navigationController.distanceToRoute) > 8 ? (
            <SnapLine
              from={activeTripLocation}
              to={navigationController.snappedPoint}
            />
          ) : null}

          {isActiveTripMode &&
          navigationController.isGpsLost &&
          navigationController.estimatedPosition ? (
            <Marker
              coordinate={navigationController.estimatedPosition}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    backgroundColor: "#9CA3AF",
                    opacity: 0.3,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    position: "absolute",
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#9CA3AF",
                    borderColor: "#FFFFFF",
                    borderWidth: 1.5,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                  }}
                />
              </View>
            </Marker>
          ) : null}
        </MapView>
      </View>

      <ActiveTripNavBanner
        visible={isActiveTripMode && !activeTrip.isPaused}
        topOffset={(insets.top || 0) + 12}
        instruction={activeInstruction}
        instructionIcon={activeInstructionIcon}
        targetName={activeTargetPoint?.name}
        streetName={activeUpcomingStep?.name}
        etaLabel={activeRouteEtaLabel}
        distanceLabel={activeRouteDistanceLabel}
        distanceToNextTurn={navigationController.distanceToNextTurn}
        distanceToNextTurnLabel={activeDistanceToNextTurnLabel}
        isFetching={isActiveRouteFetching}
        isOffRoute={navigationController.isOffRoute}
        isVoiceMuted={isVoiceMuted}
        travelMode={activeTravelMode}
        onToggleVoice={handleToggleVoice}
        onExit={handleRequestStopActiveTrip}
      />

      {isActiveTripMode && !activeTrip.isPaused ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: (insets.top || 0) + 116,
            zIndex: 82,
            alignItems: "flex-end",
          }}
        >
          <BlurView
            tint="dark"
            intensity={34}
            style={{
              flexDirection: "row",
              gap: 8,
              padding: 6,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: "rgba(17,24,39,0.86)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Pressable
              onPress={handlePauseActiveTrip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: 12,
                borderRadius: 19,
                backgroundColor: "rgba(255,214,10,0.18)",
              }}
            >
              <MaterialIconsRounded name="pause" size={17} color="#FFD60A" />
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.pauseJourney")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRequestStopActiveTrip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: 12,
                borderRadius: 19,
                backgroundColor: "rgba(239,68,68,0.2)",
              }}
            >
              <MaterialIconsRounded name="stop" size={17} color="#FCA5A5" />
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.stopJourney")}
              </Text>
            </Pressable>
          </BlurView>
        </View>
      ) : null}

      <NearbyWarningBanner
        visible={isActiveTripMode && !activeTrip.isPaused && nearbyTriggered}
        topOffset={(insets.top || 0) + 94}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? 0}
      />

      {isActiveTripMode && navigationController.isGpsLost ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: (insets.top || 0) + 94,
            zIndex: 75,
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(30, 41, 59, 0.92)",
              borderWidth: 1,
              borderColor: "rgba(148, 163, 184, 0.24)",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <MaterialIconsRounded name="signal-cellular-off" size={16} color="#94A3B8" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#E2E8F0",
                  fontSize: 13,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {MAP_TEXT.navigation.signalLost}
              </Text>
              {navigationController.estimatedPosition ? (
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 11,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {MAP_TEXT.navigation.signalLostSubtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* Broadcast Notice from Event Organizers */}
      {broadcastNotice ? (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: isActiveTripMode ? (insets.top || 0) + 156 : (insets.top || 0) + 64,
            zIndex: 99,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#DC2626",
              borderWidth: 1,
              borderColor: "#EF4444",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <MaterialIconsRounded name="warning" size={16} color="#FFFFFF" />
            <Text
              style={{
                flex: 1,
                color: "#FFFFFF",
                fontSize: 12,
                fontFamily: TOKENS.font.bold,
              }}
              numberOfLines={2}
            >
              {t("mapScreen.broadcastFrom", { notice: broadcastNotice })}
            </Text>
          </View>
        </View>
      ) : null}

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
                  {t("mapScreen.journeyPaused")}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: TOKENS.font.medium }}>
                  {t("mapScreen.journeyPausedDesc")}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleResumeActiveTrip}
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
                {t("mapScreen.resume")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRequestStopActiveTrip}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(239,68,68,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(252,165,165,0.38)",
              }}
            >
              <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.stopJourney")}
              </Text>
            </Pressable>
          </BlurView>
        </View>
      )}

      {isTripPreviewMode ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: FLOATING_TAB_CLEARANCE + 14,
            zIndex: 88,
          }}
        >
          <BlurView
            tint="light"
            intensity={46}
            style={{
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.94)",
              borderWidth: 1,
              borderColor: "rgba(17,24,39,0.08)",
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(16,185,129,0.12)",
                  }}
                >
                  {isPreviewTripLoading || isPreviewRouteLoading ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <MaterialIconsRounded name="route" size={20} color="#047857" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#111827",
                      fontSize: 16,
                      fontFamily: TOKENS.font.bold,
                    }}
                  >
                    {previewTrip?.title || t("mapScreen.previewTitle")}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 2,
                      color: "#6B7280",
                      fontSize: 12,
                      fontFamily: TOKENS.font.medium,
                    }}
                  >
                    {isPreviewRouteError
                      ? t("mapScreen.previewFallback")
                      : t("mapScreen.previewSummary", {
                          count: previewStops.length,
                          segments: previewSegments.length,
                        })}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={handleCancelTripPreview}
                  style={{
                    height: 46,
                    paddingHorizontal: 16,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F3F4F6",
                  }}
                >
                  <Text style={{ color: "#111827", fontSize: 13, fontFamily: TOKENS.font.semibold }}>
                    {t("common.back")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmTripPreview}
                  disabled={
                    previewStops.length === 0 ||
                    updatePreviewTripMutation.isPending ||
                    isPreviewTripLoading
                  }
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#111827",
                    opacity:
                      previewStops.length === 0 ||
                      updatePreviewTripMutation.isPending ||
                      isPreviewTripLoading
                        ? 0.55
                        : 1,
                  }}
                >
                  {updatePreviewTripMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: TOKENS.font.bold }}>
                      {t("mapScreen.startGuidance")}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      ) : null}

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
        primaryActionText={completeIsTripEnd ? t("mapScreen.complete") : t("mapScreen.paused")}
      />

      <ArrivalBanner
        visible={isActiveTripMode && !activeTrip.isPaused && activeArrivalVisible}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? Number.POSITIVE_INFINITY}
        speedKmh={activeTripSpeedKmh}
        bottomOffset={FLOATING_TAB_CLEARANCE + 18}
        onDismiss={handleDismissActiveArrival}
        onConfirm={handleConfirmActiveArrival}
      />

      <NavigationStatusBanner
        visible={!isTripPreviewMode && routeEnabled && Boolean(routeStatus)}
        routeStatus={routeStatus}
        routeEtaLabel={routeEtaLabel}
        routeDistanceLabel={routeDistanceLabel}
        isRouteFetching={isRouteFetching}
        onRetry={refetchRoute}
        bottomOffset={
          activePlace
            ? FLOATING_TAB_CLEARANCE + 124
            : FLOATING_TAB_CLEARANCE + 82
        }
      />

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 12 }}
        pointerEvents="box-none"
      >
        {!isTripPreviewMode && !isActiveTripMode ? (
          <MapTopControls
            searchState={searchState}
            searchHandlers={searchHandlers}
            filterState={filterState}
            filterHandlers={filterHandlers}
            onLayout={handleTopControlsLayout}
          />
        ) : null}

        <CheckInButton
          activeEventId={activeEventId}
          activeNextDestination={activeNextDestination}
          activeDistanceToTarget={activeDistanceToTarget}
          currentLocation={activeTripLocation}
          isActiveTripMode={isActiveTripMode}
          isTripPaused={activeTrip.isPaused}
          createMomentMutation={createMomentMutation}
          isMomentUploading={isMomentUploading}
          setIsMomentUploading={setIsMomentUploading}
          t={t}
          bottomOffset={FLOATING_TAB_CLEARANCE + 180}
        />

        {/* Floating action buttons — vertical stack */}
        <MapFabStack
          visible={hasMeasuredTopControls}
          topOffset={mapFabTopOffset}
          mapStyle={mapStyle}
          mapStyles={MAP_STYLES}
          layerModalVisible={layerModalVisible}
          setLayerModalVisible={setLayerModalVisible}
          setMapStyle={setMapStyle}
          onLocate={handleLocate}
          t={t}
        />

        {shouldShowMapStatus && isPlacesLoading ? (
          <MapStatusPill
            type="loading"
            message={MAP_TEXT.web.loadingPlaces}
            topOffset={mapStatusTopOffset}
          />
        ) : null}

        {shouldShowMapStatus && error ? (
          <MapStatusPill
            type="error"
            message={MAP_TEXT.web.placesLoadError}
            actionLabel={MAP_TEXT.errors.retry}
            onAction={refetch}
            topOffset={mapStatusTopOffset}
          />
        ) : null}

        {shouldShowMapStatus &&
        !isPlacesLoading &&
        !error &&
        hasActiveFilters &&
        visiblePlaces.length === 0 ? (
          <MapStatusPill
            type="empty"
            message={MAP_TEXT.web.noPlacesForFilters}
            actionLabel={MAP_TEXT.search.cancel}
            onAction={() => {
              setSearchText("");
              handleResetFilters();
            }}
            topOffset={mapStatusTopOffset}
          />
        ) : null}
      </View>

      {activePlace && !isTripPreviewMode && !isActiveTripMode ? (
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
        <MapPlacePreviewCard
            place={activePlace}
            onClose={handleClosePreview}
            onViewDetail={handleOpenPlaceDetail}
            onStartRoute={handleStartRouteFromPreview}
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

      {/* Screen dimming overlay cho đường thẳng dài */}
      {isActiveTripMode && !activeTrip.isPaused && isScreenDimmed ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${SCREEN_DIM_OVERLAY_OPACITY})`,
            zIndex: 4,
          }}
        />
      ) : null}

      <FilterPickerModal
        visible={!isTripPreviewMode && filterPickerVisible}
        activeFilterGroup={filterState.activeFilterGroup}
        activeFilterGroupLabel={activeFilterGroupMeta.label}
        filterGroups={FILTER_GROUP_OPTIONS}
        options={filterPickerOptions}
        onClose={handleCloseFilterPicker}
        onSelectFilterGroup={filterHandlers.selectFilterGroup}
        onSelectOption={handleSelectFilterOption}
      />
    </View>
  );
}
