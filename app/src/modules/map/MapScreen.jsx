import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { Circle, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import { useBoundaryData } from "./hooks/useBoundaryData";
import MapView from "./components/MapView";
import RoutePolyline from "./components/RoutePolyline";
import { useMapRouting, useRoutingLegs } from "./hooks/useMapRouting";
import { AIEntryButton } from "../../components/composed/AIEntryButton";
import {
  PlacePreviewCard,
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../components/composed/PlacePreviewCard";
import { trackEvent } from "../../lib/analytics";
import { DistrictLayer, WardLayer } from "./components/BoundaryLayer";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
  CAN_THO_CENTER,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "./config/mapConfig";
import { TOKENS } from "../../constants/design-tokens";
import { FLOATING_TAB_CLEARANCE } from "../../../app/(tabs)/_layout";

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

const ROUTE_BUILDER_COLORS = [
  "#06B6D4",
  "#14B8A6",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#EF4444",
];
const ROUTE_BUILDER_FIRST_LEG_COLOR = "#2563EB";
const NAVIGATION_EVENT_DEDUP_MS = 1800;
const ROUTE_BUILDER_LONG_PRESS_PICK_RADIUS_M = 140;
const ROUTE_BUILDER_ARRIVAL_RADIUS_M = 28;
const ROUTE_BUILDER_MISSED_APPROACH_RADIUS_M = 45;
const ROUTE_BUILDER_MISSED_DELTA_M = 55;
const ROUTE_BUILDER_MISSED_DISTANCE_M = 90;
const ROUTE_BUILDER_RECOVERY_CLEAR_DISTANCE_M = 35;

const NAV_MENU_ITEMS = [
  { key: "map", label: "Bản đồ", icon: "map", route: "/(tabs)/map" },
  {
    key: "ai",
    label: "AI",
    icon: "auto-awesome",
    route: "/(tabs)/ai",
  },
  { key: "trips", label: "Chuyến đi", icon: "luggage", route: "/(tabs)/trips" },
  {
    key: "explore",
    label: "Khám phá",
    icon: "explore",
    route: "/(tabs)/explore",
  },
  { key: "saved", label: "Đã lưu", icon: "bookmark", route: "/(tabs)/saved" },
  { key: "profile", label: "Hồ sơ", icon: "person", route: "/(tabs)/profile" },
];

const QUICK_FILTER_OPTIONS = [
  {
    key: "topRated",
    label: "Đánh giá cao",
    icon: "star",
  },
  {
    key: "trending",
    label: "Trending",
    icon: "local-fire-department",
  },
  {
    key: "budget",
    label: "Giá rẻ",
    icon: "savings",
  },
  {
    key: "premium",
    label: "Cao cấp",
    icon: "workspace-premium",
  },
  {
    key: "openNow",
    label: "Mở cửa gần nhất",
    icon: "schedule",
  },
];

const FILTER_GROUP_OPTIONS = [
  {
    key: "category",
    label: "Mục",
    icon: "apps",
  },
  {
    key: "area",
    label: "Vùng",
    icon: "place",
  },
  {
    key: "quick",
    label: "Nhanh",
    icon: "tune",
  },
];

const BUDGET_PRICE_RANGES = new Set(["FREE", "BUDGET", "MODERATE"]);
const PREMIUM_PRICE_RANGES = new Set(["EXPENSIVE", "LUXURY"]);
const ALL_AREAS_KEY = "__all_areas__";

const parseTimeToMinutes = (timeText) => {
  if (typeof timeText !== "string") return null;
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

const formatRouteEta = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return null;

  const minutes = Math.max(1, Math.round(total / 60));
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}h ${remain}p` : `${hours}h`;
};

const formatRouteDistance = (meters) => {
  const total = Number(meters);
  if (!Number.isFinite(total) || total <= 0) return null;

  if (total < 1000) return `${Math.round(total)} m`;
  return `${(total / 1000).toFixed(1).replace(/\.0$/, "")} km`;
};

const hasSameStopOrder = (first, second) => {
  if (!Array.isArray(first) || !Array.isArray(second)) return false;
  if (first.length !== second.length) return false;

  for (let index = 0; index < first.length; index += 1) {
    if (String(first[index]?.id) !== String(second[index]?.id)) {
      return false;
    }
  }

  return true;
};

const distanceMeters = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusM = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
};

const isPlaceOpenNow = (place) => {
  const openingHours = Array.isArray(place?.openingHours)
    ? place.openingHours
    : [];

  // API chưa trả openingHours thì không loại bỏ marker hiện có.
  if (openingHours.length === 0) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSchedule = openingHours.find(
    (item) => Number(item?.dayOfWeek) === currentDay,
  );

  if (!currentSchedule) return true;
  if (currentSchedule?.isClosed) return false;

  const openMinutes = parseTimeToMinutes(currentSchedule?.openTime);
  const closeMinutes = parseTimeToMinutes(currentSchedule?.closeTime);

  if (openMinutes == null || closeMinutes == null) return true;

  if (closeMinutes >= openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  // Trường hợp qua đêm: ví dụ 22:00 → 02:00.
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
};

const getPlaceDistrictMeta = (place) => {
  const districtId =
    place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
  const districtName =
    place?.district?.name ?? place?.ward?.district?.name ?? null;

  if (districtId != null) {
    return {
      key: `id:${districtId}`,
      name: districtName || `Khu vực ${districtId}`,
    };
  }

  if (districtName) {
    return {
      key: `name:${districtName.trim().toLowerCase()}`,
      name: districtName,
    };
  }

  return null;
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

const LayerSwitcherModal = ({ visible, onClose, currentStyle, onSelect }) => {
  const options = Object.values(MAP_STYLES);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      >
        <View
          className="rounded-2xl p-4 w-[260px]"
          style={{
            elevation: 10,
            backgroundColor: MAP_UI_THEME.backgroundElevated,
            borderWidth: 1,
            borderColor: MAP_UI_THEME.border,
          }}
        >
          <Text
            className="text-[15px] font-bold text-center mb-4"
            style={{ color: MAP_UI_THEME.text }}
          >
            Chọn kiểu bản đồ
          </Text>
          {options.map((opt) => {
            const active = currentStyle.key === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                className="flex-row items-center gap-3 py-3 px-3 rounded-xl mb-1"
                style={
                  active
                    ? { backgroundColor: "rgba(0,240,255,0.12)" }
                    : undefined
                }
              >
                <MaterialIcons
                  name={
                    opt.key === "satellite"
                      ? "satellite"
                      : opt.key === "osm"
                        ? "map"
                        : "layers"
                  }
                  size={22}
                  color={
                    active ? MAP_UI_THEME.neon : MAP_UI_THEME.textSecondary
                  }
                />
                <Text
                  className="text-[14px] font-medium flex-1"
                  style={{
                    color: active
                      ? MAP_UI_THEME.text
                      : MAP_UI_THEME.textSecondary,
                  }}
                >
                  {opt.label}
                </Text>
                {active ? (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={MAP_UI_THEME.neon}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
};

export default function MapScreen() {
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const isCompactPreviewCard = viewportWidth <= 360 || viewportHeight <= 700;

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastAppliedFocusRef = useRef(null);
  const lastNavigationEventRef = useRef({ signature: null, timestamp: 0 });
  const routeBuilderLegTrackingRef = useRef({
    legIndex: -1,
    minDistance: Number.POSITIVE_INFINITY,
    prevDistance: Number.POSITIVE_INFINITY,
  });

  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState("category");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeArea, setActiveArea] = useState(ALL_AREAS_KEY);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeBuilderMode, setRouteBuilderMode] = useState(false);
  const [routeBuilderDraftStops, setRouteBuilderDraftStops] = useState([]);
  const [routeBuilderConfirmedStops, setRouteBuilderConfirmedStops] = useState(
    [],
  );
  const [routeBuilderCompletedLegs, setRouteBuilderCompletedLegs] = useState(0);
  const [routeBuilderCompletedView, setRouteBuilderCompletedView] =
    useState("dim");
  const [routeBuilderPendingArrival, setRouteBuilderPendingArrival] =
    useState(null);
  const [routeBuilderArrivalAlertVisible, setRouteBuilderArrivalAlertVisible] =
    useState(false);
  const [routeBuilderRecoveryMode, setRouteBuilderRecoveryMode] =
    useState(false);
  const [quickFilters, setQuickFilters] = useState({
    topRated: false,
    trending: false,
    budget: false,
    premium: false,
    openNow: false,
  });

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

  const activeQuickFilterLabels = useMemo(
    () =>
      QUICK_FILTER_OPTIONS.filter(
        (option) => quickFilters[option.key] === true,
      ).map((option) => option.label),
    [quickFilters],
  );

  const activeFilterGroupMeta = useMemo(
    () =>
      FILTER_GROUP_OPTIONS.find((group) => group.key === activeFilterGroup) ||
      FILTER_GROUP_OPTIONS[0],
    [activeFilterGroup],
  );

  const activeFilterSummaryLabel = useMemo(() => {
    if (activeFilterGroup === "category") {
      if (activeCategoryId === null) return "Tất cả danh mục";
      const matchedCategory = categories.find(
        (category) => String(category.id) === String(activeCategoryId),
      );
      return matchedCategory?.name || "Danh mục";
    }

    if (activeFilterGroup === "area") {
      if (activeArea === ALL_AREAS_KEY) return "Tất cả khu vực";
      const matchedArea = areaOptions.find((area) => area.key === activeArea);
      return matchedArea?.name || "Khu vực";
    }

    if (activeQuickFilterLabels.length === 0) return "Chưa áp dụng";
    if (activeQuickFilterLabels.length === 1) return activeQuickFilterLabels[0];
    return `${activeQuickFilterLabels.length} bộ lọc`;
  }, [
    activeArea,
    activeCategoryId,
    activeFilterGroup,
    activeQuickFilterLabels,
    areaOptions,
    categories,
  ]);

  const filterPickerOptions = useMemo(() => {
    if (activeFilterGroup === "category") {
      return [
        {
          key: "category:all",
          value: null,
          label: "Tất cả danh mục",
          icon: "apps",
          active: activeCategoryId === null,
        },
        ...categories.map((category) => ({
          key: `category:${category.id}`,
          value: category.id,
          label: category.name,
          icon:
            CATEGORY_MARKER_STYLES[category.id]?.icon ||
            DEFAULT_CATEGORY_ICON.icon,
          active: String(activeCategoryId ?? "") === String(category.id),
        })),
      ];
    }

    if (activeFilterGroup === "area") {
      return [
        {
          key: "area:all",
          value: ALL_AREAS_KEY,
          label: "Tất cả khu vực",
          icon: "public",
          active: activeArea === ALL_AREAS_KEY,
        },
        ...areaOptions.map((area) => ({
          key: `area:${area.key}`,
          value: area.key,
          label: area.name,
          icon: "place",
          active: area.key === activeArea,
        })),
      ];
    }

    return QUICK_FILTER_OPTIONS.map((option) => ({
      key: `quick:${option.key}`,
      value: option.key,
      label: option.label,
      icon: option.icon,
      active: quickFilters[option.key] === true,
    }));
  }, [
    activeArea,
    activeCategoryId,
    activeFilterGroup,
    areaOptions,
    categories,
    quickFilters,
  ]);

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

  const visiblePlaces = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return allPlaces.filter((place) => {
      if (
        !Number.isFinite(place?.latitude) ||
        !Number.isFinite(place?.longitude)
      ) {
        return false;
      }

      const categoryId = place?.categoryId ?? place?.category?.id;
      if (
        activeCategoryId !== null &&
        String(categoryId ?? "") !== String(activeCategoryId)
      ) {
        return false;
      }

      if (activeArea !== ALL_AREAS_KEY) {
        const district = getPlaceDistrictMeta(place);
        if (!district || district.key !== activeArea) {
          return false;
        }
      }

      if (normalizedSearch) {
        const searchableText = [
          place?.name,
          place?.address,
          place?.category?.name,
          place?.ward?.name,
          place?.district?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedSearch)) {
          return false;
        }
      }

      if (quickFilters.topRated && getPlaceRatingValue(place) < 4.5) {
        return false;
      }

      if (quickFilters.trending && getPlaceReviewCount(place) < 20) {
        return false;
      }

      const priceRangeKey = String(place?.priceRange || "").toUpperCase();
      if (quickFilters.budget && !BUDGET_PRICE_RANGES.has(priceRangeKey)) {
        return false;
      }
      if (quickFilters.premium && !PREMIUM_PRICE_RANGES.has(priceRangeKey)) {
        return false;
      }

      if (quickFilters.openNow && !isPlaceOpenNow(place)) {
        return false;
      }

      return true;
    });
  }, [activeArea, activeCategoryId, allPlaces, quickFilters, searchText]);

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

  const syncBuilderStops = useCallback(
    (stops) => {
      if (!Array.isArray(stops) || stops.length === 0) return [];

      const nextStops = [];
      for (const stop of stops) {
        const latest = allPlaces.find(
          (place) => String(place?.id) === String(stop?.id),
        );
        if (!latest) continue;
        nextStops.push(latest);
      }
      return nextStops;
    },
    [allPlaces],
  );

  useEffect(() => {
    setRouteBuilderDraftStops((prev) => {
      const next = syncBuilderStops(prev);
      return hasSameStopOrder(prev, next) ? prev : next;
    });
  }, [syncBuilderStops]);

  useEffect(() => {
    setRouteBuilderConfirmedStops((prev) => {
      const next = syncBuilderStops(prev);
      return hasSameStopOrder(prev, next) ? prev : next;
    });
  }, [syncBuilderStops]);

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
      name: "Vị trí hiện tại",
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
      name: activePlace.name || "Điểm đến",
    };
  }, [activePlace]);

  const routeBuilderCanStartFromCurrentLocation = Boolean(
    routeOriginFromCurrentLocation,
  );
  const routeBuilderMinimumStops = routeBuilderCanStartFromCurrentLocation
    ? 1
    : 2;

  const routeBuilderCanConfirm =
    routeBuilderDraftStops.length >= routeBuilderMinimumStops;
  const routeBuilderHasConfirmedRoute = routeBuilderConfirmedStops.length > 0;

  const routeBuilderWaypoints = useMemo(() => {
    if (!routeBuilderHasConfirmedRoute) return [];

    const waypoints = [];
    if (
      routeBuilderCanStartFromCurrentLocation &&
      routeOriginFromCurrentLocation
    ) {
      waypoints.push(routeOriginFromCurrentLocation);
    }

    routeBuilderConfirmedStops.forEach((stop, index) => {
      if (
        !Number.isFinite(stop?.latitude) ||
        !Number.isFinite(stop?.longitude)
      ) {
        return;
      }

      waypoints.push({
        lat: Number(stop.latitude),
        lng: Number(stop.longitude),
        name: stop.name || `Điểm dừng ${index + 1}`,
      });
    });

    return waypoints;
  }, [
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderConfirmedStops,
    routeBuilderHasConfirmedRoute,
    routeOriginFromCurrentLocation,
  ]);

  const routeBuilderEnabled =
    routeBuilderMode && routeBuilderWaypoints.length >= 2;

  const routeBuilderIsDirty = useMemo(() => {
    if (!routeBuilderHasConfirmedRoute) return false;
    return !hasSameStopOrder(
      routeBuilderDraftStops,
      routeBuilderConfirmedStops,
    );
  }, [
    routeBuilderConfirmedStops,
    routeBuilderDraftStops,
    routeBuilderHasConfirmedRoute,
  ]);

  const {
    legs: routeBuilderLegs,
    totalDistance: routeBuilderTotalDistance,
    totalDuration: routeBuilderTotalDuration,
    isError: isRouteBuilderError,
    isFetching: isRouteBuilderFetching,
    error: routeBuilderError,
    refetch: refetchRouteBuilder,
  } = useRoutingLegs({
    waypoints: routeBuilderWaypoints,
    mode: "motorcycle",
    enabled: routeBuilderEnabled,
  });

  const routeBuilderDistanceLabel = useMemo(
    () => formatRouteDistance(routeBuilderTotalDistance),
    [routeBuilderTotalDistance],
  );
  const routeBuilderEtaLabel = useMemo(
    () => formatRouteEta(routeBuilderTotalDuration),
    [routeBuilderTotalDuration],
  );

  const routeBuilderLegCount = routeBuilderLegs.length;

  const routeBuilderActiveLegIndex = useMemo(() => {
    if (!routeBuilderEnabled || routeBuilderLegCount === 0) return null;
    return Math.min(routeBuilderCompletedLegs, routeBuilderLegCount - 1);
  }, [routeBuilderCompletedLegs, routeBuilderEnabled, routeBuilderLegCount]);

  const routeBuilderActiveTarget = useMemo(() => {
    if (!routeBuilderEnabled || routeBuilderWaypoints.length < 2) return null;
    const targetIndex = Math.min(
      routeBuilderCompletedLegs + 1,
      routeBuilderWaypoints.length - 1,
    );
    const target = routeBuilderWaypoints[targetIndex];
    if (!target) return null;
    return {
      ...target,
      targetIndex,
      legIndex: routeBuilderActiveLegIndex,
    };
  }, [
    routeBuilderActiveLegIndex,
    routeBuilderCompletedLegs,
    routeBuilderEnabled,
    routeBuilderWaypoints,
  ]);

  const routeBuilderDistanceToActiveTarget = useMemo(() => {
    if (
      !routeBuilderActiveTarget ||
      !currentLocation ||
      !Number.isFinite(routeBuilderActiveTarget.lat) ||
      !Number.isFinite(routeBuilderActiveTarget.lng) ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return distanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      routeBuilderActiveTarget.lat,
      routeBuilderActiveTarget.lng,
    );
  }, [currentLocation, routeBuilderActiveTarget]);

  const routeBuilderDistanceToActiveTargetLabel = useMemo(
    () => formatRouteDistance(routeBuilderDistanceToActiveTarget),
    [routeBuilderDistanceToActiveTarget],
  );

  useEffect(() => {
    setRouteBuilderCompletedLegs((prev) =>
      Math.min(prev, routeBuilderLegCount),
    );
  }, [routeBuilderLegCount]);

  useEffect(() => {
    if (!routeBuilderEnabled) return;
    if (routeBuilderCompletedLegs < routeBuilderLegCount) return;
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, [routeBuilderCompletedLegs, routeBuilderEnabled, routeBuilderLegCount]);

  useEffect(() => {
    if (!routeBuilderPendingArrival) {
      setRouteBuilderArrivalAlertVisible(false);
    }
  }, [routeBuilderPendingArrival]);

  useEffect(() => {
    if (!routeBuilderEnabled) {
      setRouteBuilderPendingArrival(null);
      setRouteBuilderArrivalAlertVisible(false);
      setRouteBuilderRecoveryMode(false);
      routeBuilderLegTrackingRef.current = {
        legIndex: -1,
        minDistance: Number.POSITIVE_INFINITY,
        prevDistance: Number.POSITIVE_INFINITY,
      };
      return;
    }

    const activeLeg = routeBuilderActiveLegIndex;
    if (activeLeg == null) return;

    if (routeBuilderLegTrackingRef.current.legIndex !== activeLeg) {
      routeBuilderLegTrackingRef.current = {
        legIndex: activeLeg,
        minDistance: Number.POSITIVE_INFINITY,
        prevDistance: Number.POSITIVE_INFINITY,
      };
      setRouteBuilderPendingArrival(null);
      setRouteBuilderArrivalAlertVisible(false);
      setRouteBuilderRecoveryMode(false);
    }
  }, [routeBuilderActiveLegIndex, routeBuilderEnabled]);

  useEffect(() => {
    if (!routeBuilderEnabled || routeBuilderDistanceToActiveTarget == null) {
      return;
    }

    const tracking = routeBuilderLegTrackingRef.current;
    tracking.minDistance = Math.min(
      tracking.minDistance,
      routeBuilderDistanceToActiveTarget,
    );

    const activeLeg = routeBuilderActiveLegIndex;
    if (activeLeg == null) {
      tracking.prevDistance = routeBuilderDistanceToActiveTarget;
      return;
    }

    const pendingForCurrentLeg =
      routeBuilderPendingArrival?.legIndex === activeLeg;

    if (
      !pendingForCurrentLeg &&
      routeBuilderDistanceToActiveTarget <= ROUTE_BUILDER_ARRIVAL_RADIUS_M
    ) {
      setRouteBuilderPendingArrival({
        legIndex: activeLeg,
        targetName: routeBuilderActiveTarget?.name || "điểm đến",
      });
      setRouteBuilderArrivalAlertVisible(true);
      setRouteBuilderRecoveryMode(false);
      tracking.prevDistance = routeBuilderDistanceToActiveTarget;
      return;
    }

    const hasMissedTarget =
      !pendingForCurrentLeg &&
      tracking.minDistance <= ROUTE_BUILDER_MISSED_APPROACH_RADIUS_M &&
      routeBuilderDistanceToActiveTarget >= ROUTE_BUILDER_MISSED_DISTANCE_M &&
      routeBuilderDistanceToActiveTarget - tracking.minDistance >=
        ROUTE_BUILDER_MISSED_DELTA_M;

    if (hasMissedTarget) {
      setRouteBuilderRecoveryMode(true);
    }

    if (
      routeBuilderRecoveryMode &&
      routeBuilderDistanceToActiveTarget <=
        ROUTE_BUILDER_RECOVERY_CLEAR_DISTANCE_M
    ) {
      setRouteBuilderRecoveryMode(false);
    }

    tracking.prevDistance = routeBuilderDistanceToActiveTarget;
  }, [
    routeBuilderActiveLegIndex,
    routeBuilderActiveTarget,
    routeBuilderDistanceToActiveTarget,
    routeBuilderEnabled,
    routeBuilderPendingArrival,
    routeBuilderRecoveryMode,
  ]);

  const routeBuilderRecoveryOrigin = useMemo(() => {
    if (
      !routeBuilderEnabled ||
      !routeBuilderRecoveryMode ||
      !currentLocation ||
      !Number.isFinite(currentLocation.latitude) ||
      !Number.isFinite(currentLocation.longitude)
    ) {
      return null;
    }

    return {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      name: "Vị trí hiện tại",
    };
  }, [currentLocation, routeBuilderEnabled, routeBuilderRecoveryMode]);

  const routeBuilderRecoveryDestination = useMemo(() => {
    if (
      !routeBuilderEnabled ||
      !routeBuilderRecoveryMode ||
      !routeBuilderActiveTarget ||
      !Number.isFinite(routeBuilderActiveTarget.lat) ||
      !Number.isFinite(routeBuilderActiveTarget.lng)
    ) {
      return null;
    }

    return {
      lat: routeBuilderActiveTarget.lat,
      lng: routeBuilderActiveTarget.lng,
      name: routeBuilderActiveTarget.name || "Điểm đang thiếu",
    };
  }, [routeBuilderActiveTarget, routeBuilderEnabled, routeBuilderRecoveryMode]);

  const {
    coordinates: routeBuilderRecoveryCoordinates,
    source: routeBuilderRecoverySource,
  } = useMapRouting({
    origin: routeBuilderRecoveryOrigin,
    destination: routeBuilderRecoveryDestination,
    mode: "motorcycle",
    enabled: Boolean(
      routeBuilderRecoveryOrigin && routeBuilderRecoveryDestination,
    ),
  });

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
        title: "Không thể lấy chỉ đường",
        message:
          routeError?.message ||
          "Kết nối định tuyến gặp lỗi. Vui lòng thử lại.",
        canRetry: true,
      };
    }

    if (routeSource === "fallback" || isRouteFallback) {
      return {
        type: "fallback",
        icon: "info-outline",
        title: "Đang dùng tuyến ước tính",
        message:
          "Lộ trình có thể lệch nhẹ, vui lòng kiểm tra thực tế khi di chuyển.",
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

  useEffect(() => {
    let cancelled = false;

    const preloadCurrentLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 5,
        });

        const position =
          lastKnown ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        if (!position?.coords || cancelled) return;

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // Keep silent: route can still be shown after user taps locate.
      }
    };

    preloadCurrentLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!routeBuilderEnabled) return undefined;

    let subscriber = null;
    let active = true;

    const watchLocation = async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!active || permission.status !== "granted") return;

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 12,
            timeInterval: 5000,
          },
          (location) => {
            if (!location?.coords) return;
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );
      } catch {
        // Keep silent: route builder still works with manual locate updates.
      }
    };

    watchLocation();

    return () => {
      active = false;
      subscriber?.remove?.();
    };
  }, [routeBuilderEnabled]);

  const handleLocate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        mapRef.current?.flyTo(
          [location.coords.longitude, location.coords.latitude],
          15,
        );
        return;
      }
    } catch {}
    mapRef.current?.flyTo([CAN_THO_CENTER.lng, CAN_THO_CENTER.lat], 12);
  }, []);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    if (place.longitude && place.latitude) {
      mapRef.current?.flyTo([place.longitude, place.latitude], 15);
    }
  }, []);

  const handleLongPressPlace = useCallback((place) => {
    if (!place?.id) return;

    setRouteBuilderMode(true);
    setRouteBuilderRecoveryMode(false);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setSelectedPlace(place);

    setRouteBuilderDraftStops((prev) => {
      const existed = prev.some(
        (stop) => String(stop?.id) === String(place.id),
      );
      if (existed) return prev;
      return [...prev, place];
    });
  }, []);

  const handleRemoveRouteBuilderStop = useCallback((stopId) => {
    setRouteBuilderDraftStops((prev) =>
      prev.filter((stop) => String(stop?.id) !== String(stopId)),
    );
  }, []);

  const handleClearRouteBuilder = useCallback(() => {
    setRouteBuilderDraftStops([]);
    setRouteBuilderConfirmedStops([]);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, []);

  const handleConfirmRouteBuilder = useCallback(async () => {
    if (!routeBuilderCanConfirm) return;

    if (!routeBuilderCanStartFromCurrentLocation && !currentLocation) {
      await handleLocate();
    }

    setRouteBuilderConfirmedStops(routeBuilderDraftStops);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
    setRouteBuilderMode(true);
  }, [
    currentLocation,
    handleLocate,
    routeBuilderCanConfirm,
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderDraftStops,
  ]);

  const handleExitRouteBuilder = useCallback(() => {
    setRouteBuilderMode(false);
    setRouteBuilderDraftStops([]);
    setRouteBuilderConfirmedStops([]);
    setRouteBuilderCompletedLegs(0);
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, []);

  const handleConfirmArrivedRouteBuilderLeg = useCallback(() => {
    if (!routeBuilderPendingArrival) return;

    setRouteBuilderCompletedLegs((prev) =>
      Math.min(
        Math.max(prev, routeBuilderPendingArrival.legIndex + 1),
        routeBuilderLegCount,
      ),
    );
    setRouteBuilderPendingArrival(null);
    setRouteBuilderArrivalAlertVisible(false);
    setRouteBuilderRecoveryMode(false);
  }, [routeBuilderLegCount, routeBuilderPendingArrival]);

  const handleDismissRouteBuilderArrivalAlert = useCallback(() => {
    setRouteBuilderArrivalAlertVisible(false);
  }, []);

  const handleResetRouteBuilderProgress = useCallback(() => {
    setRouteBuilderCompletedLegs(0);
  }, []);

  const handleToggleCompletedLegView = useCallback(() => {
    setRouteBuilderCompletedView((prev) => (prev === "dim" ? "hide" : "dim"));
  }, []);

  const handleStartRouteFromPreview = useCallback(
    async (place) => {
      if (!place?.id) return;

      const routeMode = "current_location_to_place";
      const eventSignature = `${String(place.id)}:${routeMode}:${routeSource || "unknown"}`;
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
        placeName: place.name || "unknown",
        fromScreen: "map_preview",
        routeMode,
        routeSource: routeSource || "unknown",
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

      visiblePlaces.forEach((place) => {
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
    [handleLongPressPlace, visiblePlaces],
  );

  const handleQuickFilterToggle = useCallback((filterKey) => {
    setQuickFilters((prev) => {
      if (filterKey === "budget") {
        return {
          ...prev,
          budget: !prev.budget,
          premium: false,
        };
      }

      if (filterKey === "premium") {
        return {
          ...prev,
          premium: !prev.premium,
          budget: false,
        };
      }

      return {
        ...prev,
        [filterKey]: !prev[filterKey],
      };
    });
  }, []);

  const handleSelectFilterGroup = useCallback((groupKey) => {
    setActiveFilterGroup(groupKey);
  }, []);

  const handleOpenFilterPicker = useCallback(() => {
    setFilterPickerVisible(true);
  }, []);

  const handleCloseFilterPicker = useCallback(() => {
    setFilterPickerVisible(false);
  }, []);

  const handleSelectFilterOption = useCallback(
    (value) => {
      if (activeFilterGroup === "category") {
        setActiveCategoryId(value);
        setFilterPickerVisible(false);
        return;
      }

      if (activeFilterGroup === "area") {
        setActiveArea(value ?? ALL_AREAS_KEY);
        setFilterPickerVisible(false);
        return;
      }

      if (typeof value === "string" && value.length > 0) {
        handleQuickFilterToggle(value);
      }
      setFilterPickerVisible(false);
    },
    [activeFilterGroup, handleQuickFilterToggle],
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

  const routeBuilderLegVisuals = useMemo(() => {
    if (!routeBuilderEnabled || !Array.isArray(routeBuilderLegs)) return [];

    return routeBuilderLegs.map((leg, index) => {
      const isFirstLegFromCurrent =
        routeBuilderCanStartFromCurrentLocation && index === 0;
      const color = isFirstLegFromCurrent
        ? ROUTE_BUILDER_FIRST_LEG_COLOR
        : ROUTE_BUILDER_COLORS[
            (isFirstLegFromCurrent ? index - 1 : index) %
              ROUTE_BUILDER_COLORS.length
          ];

      const isCompleted = index < routeBuilderCompletedLegs;
      const shouldHide = isCompleted && routeBuilderCompletedView === "hide";
      const source = leg?.source || leg?.route?.source || "osrm";

      return {
        key: `builder-leg-${index}-${leg?.index || "x"}`,
        geometry: leg?.route?.geometry,
        coordinates: leg?.route?.coordinates,
        source,
        dashed: source === "fallback",
        color,
        opacity: isCompleted ? 0.2 : 0.92,
        shouldHide,
      };
    });
  }, [
    routeBuilderCanStartFromCurrentLocation,
    routeBuilderCompletedLegs,
    routeBuilderCompletedView,
    routeBuilderEnabled,
    routeBuilderLegs,
  ]);

  const routeBuilderHasPendingArrival = Boolean(routeBuilderPendingArrival);
  const routeBuilderHasFinished =
    routeBuilderLegCount > 0 &&
    routeBuilderCompletedLegs >= routeBuilderLegCount;

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
              Đang tải bản đồ...
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
              Không tải được dữ liệu
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
              <Text className="text-[14px] font-bold text-white">Thử lại</Text>
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

          {currentLocation ? (
            <>
              <Circle
                center={currentLocation}
                radius={38}
                strokeWidth={1}
                strokeColor="rgba(37, 99, 235, 0.35)"
                fillColor="rgba(59, 130, 246, 0.16)"
              />
              <Marker
                coordinate={currentLocation}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                zIndex={1200}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(59, 130, 246, 0.25)",
                    borderWidth: 1,
                    borderColor: "rgba(37, 99, 235, 0.35)",
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#2563EB",
                      borderWidth: 2,
                      borderColor: "#FFFFFF",
                    }}
                  />
                </View>
              </Marker>
            </>
          ) : null}

          {routeBuilderDraftStops.map((stop, index) => {
            if (
              !Number.isFinite(stop?.latitude) ||
              !Number.isFinite(stop?.longitude)
            ) {
              return null;
            }

            return (
              <Marker
                key={`route-builder-stop-${stop.id}`}
                coordinate={{
                  latitude: Number(stop.latitude),
                  longitude: Number(stop.longitude),
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                zIndex={1400}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(15,23,42,0.92)",
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontFamily: TOKENS.font.semibold,
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>
              </Marker>
            );
          })}

          {routeBuilderEnabled ? (
            routeBuilderRecoveryMode &&
            Array.isArray(routeBuilderRecoveryCoordinates) &&
            routeBuilderRecoveryCoordinates.length > 1 ? (
              <RoutePolyline
                coordinates={routeBuilderRecoveryCoordinates}
                source={routeBuilderRecoverySource || "osrm"}
                strokeWidth={6}
                isPrimary
                dashed={routeBuilderRecoverySource === "fallback"}
                color="#DC2626"
                strokeOpacity={0.95}
              />
            ) : (
              routeBuilderLegVisuals.map((leg) => {
                if (leg.shouldHide) return null;
                return (
                  <RoutePolyline
                    key={leg.key}
                    coordinates={leg.coordinates}
                    geometry={leg.geometry}
                    source={leg.source}
                    strokeWidth={5}
                    isPrimary
                    dashed={leg.dashed}
                    color={leg.color}
                    strokeOpacity={leg.opacity}
                  />
                );
              })
            )
          ) : (
            <RoutePolyline
              coordinates={routeCoordinates}
              source={routeSource || "osrm"}
              strokeWidth={5}
              isPrimary
              dashed={routeSource === "fallback"}
            />
          )}
        </MapView>
      </View>

      {routeBuilderMode ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: FLOATING_TAB_CLEARANCE + 4,
            zIndex: 73,
          }}
        >
          <View
            style={{
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOpacity: 0.1,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View style={{ flex: 1 }}>
                <View className="flex-row items-center gap-1.5">
                  <MaterialIcons name="alt-route" size={16} color="#0F172A" />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: "#0F172A" }}
                  >
                    Route Builder
                  </Text>
                </View>
                <Text
                  className="text-[11px] mt-0.5"
                  style={{ color: "#64748B" }}
                >
                  {routeBuilderHasFinished
                    ? "Tất cả chặng đã hoàn thành"
                    : routeBuilderPendingArrival
                      ? `Đã đến ${routeBuilderPendingArrival.targetName || "điểm đến"} • Chờ xác nhận`
                      : routeBuilderRecoveryMode
                        ? `Bạn đi huốt ${routeBuilderActiveTarget?.name || "điểm đến"} • Đang dẫn quay lại`
                        : routeBuilderDraftStops.length === 0
                          ? "Nhấn giữ marker để thêm điểm dừng"
                          : `${routeBuilderDraftStops.length} điểm dừng • ${routeBuilderCanConfirm ? "Sẵn sàng xác nhận" : `Cần tối thiểu ${routeBuilderMinimumStops} điểm`}`}
                </Text>
              </View>

              <Pressable
                onPress={handleExitRouteBuilder}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <MaterialIcons name="close" size={16} color="#334155" />
              </Pressable>
            </View>

            {routeBuilderDraftStops.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 7,
                  paddingVertical: 7,
                  paddingRight: 6,
                }}
                style={{ marginTop: 4 }}
              >
                {routeBuilderDraftStops.map((stop, index) => (
                  <Pressable
                    key={`builder-stop-chip-${stop.id}`}
                    onPress={() => handleRemoveRouteBuilderStop(stop.id)}
                    className="flex-row items-center"
                    style={{
                      gap: 6,
                      borderRadius: 999,
                      height: 30,
                      paddingHorizontal: 10,
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#0F172A",
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 9,
                          fontFamily: TOKENS.font.semibold,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      className="text-[11px]"
                      style={{ color: "#0F172A", maxWidth: 122 }}
                      numberOfLines={1}
                    >
                      {stop?.name || `Điểm dừng ${index + 1}`}
                    </Text>

                    <MaterialIcons name="close" size={12} color="#64748B" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View
                className="flex-row items-center gap-2 mt-2"
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <MaterialIcons name="touch-app" size={14} color="#64748B" />
                <Text className="text-[11px]" style={{ color: "#64748B" }}>
                  Chưa có điểm dừng. Nhấn giữ marker để thêm vào tuyến.
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-2 mt-2">
              <Pressable
                onPress={handleConfirmRouteBuilder}
                disabled={!routeBuilderCanConfirm}
                className="h-[34px] rounded-full items-center justify-center"
                style={{
                  flex: 1,
                  backgroundColor: routeBuilderCanConfirm
                    ? "#0F172A"
                    : "#94A3B8",
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  {routeBuilderHasConfirmedRoute && routeBuilderIsDirty
                    ? "Cập nhật tuyến"
                    : "Xác nhận tuyến"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClearRouteBuilder}
                className="h-[34px] rounded-full items-center justify-center"
                style={{
                  width: 84,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "#334155" }}
                >
                  Xóa hết
                </Text>
              </Pressable>
            </View>

            {routeBuilderEnabled ? (
              <>
                {routeBuilderPendingArrival ? (
                  <View
                    className="mt-2 flex-row items-center gap-2"
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: "#ECFDF5",
                      borderWidth: 1,
                      borderColor: "#BBF7D0",
                    }}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={15}
                      color="#059669"
                    />
                    <Text
                      className="text-[10.5px]"
                      style={{ color: "#047857", flex: 1 }}
                    >
                      Đã đến{" "}
                      {routeBuilderPendingArrival.targetName || "điểm đến"}. Vui
                      lòng xác nhận trong thông báo.
                    </Text>
                  </View>
                ) : null}

                {routeBuilderRecoveryMode ? (
                  <View
                    className="mt-2 flex-row items-center justify-between gap-2"
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: "#B91C1C" }}
                      >
                        Bạn đã đi huốt điểm đến
                      </Text>
                      <Text
                        className="text-[10px] mt-0.5"
                        style={{ color: "#991B1B" }}
                      >
                        Đang dẫn quay lại{" "}
                        {routeBuilderActiveTarget?.name || "điểm đến"}
                        {routeBuilderDistanceToActiveTargetLabel
                          ? ` (${routeBuilderDistanceToActiveTargetLabel})`
                          : ""}
                        .
                      </Text>
                    </View>
                    <MaterialIcons
                      name="subdirectory-arrow-left"
                      size={18}
                      color="#B91C1C"
                    />
                  </View>
                ) : null}

                <View className="flex-row items-center gap-2 mt-2">
                  <View
                    style={{
                      flex: 1,
                      height: 32,
                      borderRadius: 999,
                      paddingHorizontal: 11,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      backgroundColor: "#F8FAFC",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      className="text-[10.5px]"
                      style={{ color: "#0F172A" }}
                      numberOfLines={1}
                    >
                      Hoàn thành{" "}
                      {Math.min(
                        routeBuilderCompletedLegs,
                        routeBuilderLegCount,
                      )}
                      /{routeBuilderLegCount} chặng
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleConfirmArrivedRouteBuilderLeg}
                    disabled={!routeBuilderHasPendingArrival}
                    className="h-[32px] w-[32px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: routeBuilderHasPendingArrival
                        ? "#0F172A"
                        : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: routeBuilderHasPendingArrival
                        ? "#0F172A"
                        : "#CBD5E1",
                    }}
                  >
                    <MaterialIcons
                      name="check"
                      size={16}
                      color={
                        routeBuilderHasPendingArrival ? "#FFFFFF" : "#94A3B8"
                      }
                    />
                  </Pressable>

                  <Pressable
                    onPress={handleResetRouteBuilderProgress}
                    className="h-[32px] w-[32px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#CBD5E1",
                    }}
                  >
                    <MaterialIcons name="refresh" size={16} color="#334155" />
                  </Pressable>

                  <Pressable
                    onPress={handleToggleCompletedLegView}
                    className="h-[32px] w-[32px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#CBD5E1",
                    }}
                  >
                    <MaterialIcons
                      name={
                        routeBuilderCompletedView === "dim"
                          ? "visibility-off"
                          : "visibility"
                      }
                      size={16}
                      color="#334155"
                    />
                  </Pressable>
                </View>

                {routeBuilderEtaLabel || routeBuilderDistanceLabel ? (
                  <View className="flex-row items-center gap-1.5 mt-2">
                    {routeBuilderEtaLabel ? (
                      <View
                        style={{
                          borderRadius: 999,
                          height: 24,
                          paddingHorizontal: 10,
                          justifyContent: "center",
                          backgroundColor: "#F8FAFC",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <Text
                          className="text-[10px]"
                          style={{ color: "#0F172A" }}
                        >
                          ETA {routeBuilderEtaLabel}
                        </Text>
                      </View>
                    ) : null}
                    {routeBuilderDistanceLabel ? (
                      <View
                        style={{
                          borderRadius: 999,
                          height: 24,
                          paddingHorizontal: 10,
                          justifyContent: "center",
                          backgroundColor: "#F8FAFC",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <Text
                          className="text-[10px]"
                          style={{ color: "#0F172A" }}
                        >
                          {routeBuilderDistanceLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {isRouteBuilderError ? (
                  <View
                    className="mt-2 flex-row items-center justify-between"
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: "#FEF2F2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                    }}
                  >
                    <Text className="text-[11px]" style={{ color: "#B91C1C" }}>
                      Không thể tính tuyến.
                    </Text>
                    <Pressable
                      onPress={() => refetchRouteBuilder()}
                      disabled={isRouteBuilderFetching}
                      className="h-[26px] w-[26px] rounded-full items-center justify-center"
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#FCA5A5",
                      }}
                    >
                      <MaterialIcons name="refresh" size={13} color="#B91C1C" />
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      ) : null}

      <Modal
        visible={routeBuilderMode && routeBuilderArrivalAlertVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDismissRouteBuilderArrivalAlert}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(2,6,23,0.36)" }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleDismissRouteBuilderArrivalAlert}
          />

          <View
            className="w-full rounded-2xl"
            style={{
              maxWidth: 350,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text
              className="text-[15px] font-semibold"
              style={{ color: "#111111" }}
            >
              Đã đến điểm đến
            </Text>
            <Text className="text-[12px] mt-1.5" style={{ color: "#334155" }}>
              Bạn đã đến {routeBuilderPendingArrival?.targetName || "điểm đến"}.
              Xác nhận để hoàn thành chặng này.
            </Text>

            <View className="flex-row items-center gap-2 mt-3">
              <Pressable
                onPress={handleDismissRouteBuilderArrivalAlert}
                className="flex-1 h-[38px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.72)",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: "#475569" }}
                >
                  Hủy
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmArrivedRouteBuilderLeg}
                className="flex-1 h-[38px] rounded-full items-center justify-center"
                style={{ backgroundColor: "#0A84FF" }}
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  Xác nhận
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {routeEnabled && routeStatus ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: routeBuilderMode
              ? FLOATING_TAB_CLEARANCE + 82
              : activePlace
                ? FLOATING_TAB_CLEARANCE + 194
                : FLOATING_TAB_CLEARANCE + 82,
            zIndex: 72,
          }}
        >
          <GlassPanel
            style={{
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 11,
              backgroundColor:
                routeStatus.type === "error"
                  ? "rgba(255,245,245,0.94)"
                  : "rgba(255,255,255,0.94)",
              borderColor:
                routeStatus.type === "error"
                  ? "rgba(251,113,133,0.28)"
                  : "rgba(15,23,42,0.08)",
            }}
            intensity={28}
          >
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2" style={{ flex: 1 }}>
                <MaterialIcons
                  name={routeStatus.icon}
                  size={16}
                  color={routeStatus.type === "error" ? "#E11D48" : "#0EA5E9"}
                />
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: "#0F172A" }}
                >
                  {routeStatus.title}
                </Text>
              </View>

              {routeEtaLabel || routeDistanceLabel ? (
                <View
                  className="flex-row items-center"
                  style={{
                    gap: 6,
                    backgroundColor: "rgba(14,165,233,0.1)",
                    borderColor: "rgba(14,165,233,0.2)",
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    height: 26,
                  }}
                >
                  {routeEtaLabel ? (
                    <Text
                      className="text-[11px]"
                      style={{
                        color: "#0C4A6E",
                        fontFamily: TOKENS.font.semibold,
                      }}
                    >
                      {routeEtaLabel}
                    </Text>
                  ) : null}
                  {routeEtaLabel && routeDistanceLabel ? (
                    <Text className="text-[11px]" style={{ color: "#64748B" }}>
                      •
                    </Text>
                  ) : null}
                  {routeDistanceLabel ? (
                    <Text className="text-[11px]" style={{ color: "#334155" }}>
                      {routeDistanceLabel}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Text className="text-[11px] mt-1" style={{ color: "#475569" }}>
              {routeStatus.message}
            </Text>

            {routeStatus.type !== "error" &&
            (routeEtaLabel || routeDistanceLabel) ? (
              <Text className="text-[10px] mt-1" style={{ color: "#64748B" }}>
                {routeStatus.type === "fallback"
                  ? "Ước tính: thời gian và khoảng cách có thể thay đổi theo giao thông thực tế."
                  : "Đã tối ưu theo thời gian di chuyển hiện tại."}
              </Text>
            ) : null}

            {routeStatus.canRetry ? (
              <Pressable
                onPress={() => refetchRoute()}
                disabled={isRouteFetching}
                className="mt-2 h-[30px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.82)",
                  borderWidth: 1,
                  borderColor: "rgba(15,23,42,0.12)",
                  opacity: isRouteFetching ? 0.7 : 1,
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "#0F172A" }}
                >
                  {isRouteFetching ? "Đang thử lại..." : "Thử lại chỉ đường"}
                </Text>
              </Pressable>
            ) : null}
          </GlassPanel>
        </View>
      ) : null}

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
            accessibilityLabel="Mo menu"
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
                    placeholder="Tìm kiếm địa điểm..."
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
                      Hủy
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

        <View className="mt-3 px-4" pointerEvents="auto">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View
                className="flex-row items-center"
                style={{
                  borderRadius: 999,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "rgba(15,23,42,0.18)",
                  padding: 2,
                }}
              >
                {FILTER_GROUP_OPTIONS.map((group) => {
                  const active = activeFilterGroup === group.key;
                  return (
                    <Pressable
                      key={group.key}
                      onPress={() => handleSelectFilterGroup(group.key)}
                      className="h-[30px] rounded-full flex-row items-center gap-1 px-2.5"
                      style={{
                        backgroundColor: active ? "#111111" : "#FFFFFF",
                        borderWidth: 1,
                        borderColor: active ? "#111111" : "#D1D5DB",
                      }}
                    >
                      <MaterialIcons
                        name={group.icon}
                        size={13}
                        color={active ? "#FFFFFF" : "#111111"}
                      />
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: active ? "#FFFFFF" : "#111111" }}
                      >
                        {group.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={handleOpenFilterPicker}
                className="flex-1 h-[34px] rounded-full flex-row items-center justify-between px-3"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "rgba(15,23,42,0.22)",
                }}
              >
                <View
                  className="flex-row items-center gap-1.5"
                  style={{ flex: 1 }}
                >
                  <MaterialIcons
                    name={activeFilterGroupMeta.icon}
                    size={14}
                    color="#111111"
                  />
                  <Text
                    numberOfLines={1}
                    className="text-[12px] font-semibold"
                    style={{ color: "#111111" }}
                  >
                    {activeFilterSummaryLabel}
                  </Text>
                </View>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={18}
                  color="#111111"
                />
              </Pressable>
            </View>
          </View>
        </View>

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

            <Pressable
              className="w-[44px] h-[44px]"
              onPress={() => setLayerModalVisible(true)}
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
                  name="layers"
                  size={20}
                  color={MAP_UI_THEME.text}
                />
              </GlassPanel>
            </Pressable>
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

      <Modal
        visible={filterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseFilterPicker}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(2,6,23,0.4)" }}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCloseFilterPicker}
          />

          <View
            className="w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: 360,
              maxHeight: 360,
              borderWidth: 1,
              borderColor: "rgba(15,23,42,0.18)",
              backgroundColor: "#FFFFFF",
            }}
          >
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
            >
              <Text
                className="text-[14px] font-semibold"
                style={{ color: "#111111" }}
              >
                Chọn {activeFilterGroupMeta.label.toLowerCase()} để lọc
              </Text>
              <Pressable
                onPress={handleCloseFilterPicker}
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                }}
              >
                <MaterialIcons name="close" size={16} color="#111111" />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              keyboardShouldPersistTaps="handled"
            >
              {filterPickerOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => handleSelectFilterOption(option.value)}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={{
                    backgroundColor: option.active
                      ? "rgba(17,17,17,0.08)"
                      : "transparent",
                  }}
                >
                  <View
                    className="flex-row items-center gap-2"
                    style={{ flex: 1 }}
                  >
                    <MaterialIcons
                      name={option.icon}
                      size={16}
                      color={option.active ? "#111111" : "#4B5563"}
                    />
                    <Text
                      className="text-[13px]"
                      numberOfLines={1}
                      style={{ color: "#111111" }}
                    >
                      {option.label}
                    </Text>
                  </View>

                  {option.active ? (
                    <MaterialIcons name="check" size={18} color="#111111" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LayerSwitcherModal
        visible={layerModalVisible}
        onClose={() => setLayerModalVisible(false)}
        currentStyle={mapStyle}
        onSelect={setMapStyle}
      />
    </View>
  );
}
