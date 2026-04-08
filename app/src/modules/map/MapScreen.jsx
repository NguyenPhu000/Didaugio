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
import * as Location from "expo-location";
import { useHomeData } from "./hooks/useHomeData";
import { useMapPlaces } from "./hooks/useMapPlaces";
import { useBoundaryData } from "./hooks/useBoundaryData";
import MapView from "./components/MapView";
import { AIEntryButton } from "../../components/composed/AIEntryButton";
import {
  PlacePreviewCard,
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../components/composed/PlacePreviewCard";
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

const BUDGET_PRICE_RANGES = new Set(["FREE", "BUDGET", "MODERATE"]);
const PREMIUM_PRICE_RANGES = new Set(["EXPENSIVE", "LUXURY"]);

const parseTimeToMinutes = (timeText) => {
  if (typeof timeText !== "string") return null;
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
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

const CategoryChip = memo(({ category, active, onToggle }) => {
  const meta =
    category.id === null
      ? { ...DEFAULT_CATEGORY_ICON, icon: "apps" }
      : CATEGORY_MARKER_STYLES[category.id] || DEFAULT_CATEGORY_ICON;

  const handlePress = useCallback(() => {
    onToggle(category.id);
  }, [onToggle, category.id]);

  return (
    <Pressable
      onPress={handlePress}
      className="h-[34px] rounded-full flex-row items-center px-3.5 gap-1.5"
      style={{
        backgroundColor: active ? "#0F172A" : "#FFFFFF",
        borderWidth: 1,
        borderColor: active ? "#0F172A" : "#E5E7EB",
        flexShrink: 0,
      }}
    >
      <MaterialIcons
        name={meta.icon}
        size={16}
        color={active ? "#FFFFFF" : "#475569"}
      />
      <Text
        className="text-[12px] font-semibold"
        style={{
          color: active ? "#FFFFFF" : "#0F172A",
          letterSpacing: 0.2,
        }}
      >
        {category.name}
      </Text>
    </Pressable>
  );
});

const QuickFilterChip = memo(({ option, active, onToggle }) => {
  const handlePress = useCallback(() => {
    onToggle(option.key);
  }, [onToggle, option.key]);

  return (
    <Pressable
      onPress={handlePress}
      className="h-[34px] rounded-full flex-row items-center px-3.5 gap-1.5"
      style={{
        backgroundColor: active ? TOKENS.color.primary[500] : "#FFFFFF",
        borderWidth: 1,
        borderColor: active ? TOKENS.color.primary[500] : "#E5E7EB",
        flexShrink: 0,
      }}
    >
      <MaterialIcons
        name={option.icon}
        size={15}
        color={active ? "#FFFFFF" : "#475569"}
      />
      <Text
        className="text-[12px] font-semibold"
        style={{
          color: active ? "#FFFFFF" : "#0F172A",
          letterSpacing: 0.2,
        }}
      >
        {option.label}
      </Text>
    </Pressable>
  );
});

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

  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
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
  }, [activeCategoryId, allPlaces, quickFilters, searchText]);

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

  const handleLocate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
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

  const handleClosePreview = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleMapPress = useCallback((event) => {
    if (event?.nativeEvent?.action === "marker-press") return;
    setSelectedPlace(null);
  }, []);

  const handleCategoryToggle = useCallback((categoryId) => {
    setActiveCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

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
          onPressMap={handleMapPress}
          tileUrls={mapStyle.urls}
          mapType={mapStyle.mapType || "standard"}
          useNativeCleanStyle={mapStyle.useNativeCleanStyle === true}
          style={MAP_CANVAS_STYLE}
        >
          {mapBoundaryOverlays}
        </MapView>
      </View>

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

        {categories.length > 0 ? (
          <View className="mt-3 px-4" pointerEvents="auto">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 10,
                gap: 8,
                paddingRight: 14,
                paddingVertical: 2,
              }}
              style={{
                maxHeight: 40,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <CategoryChip
                category={{ id: null, name: "Tất cả" }}
                active={activeCategoryId === null}
                onToggle={handleCategoryToggle}
              />
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  active={activeCategoryId === category.id}
                  onToggle={handleCategoryToggle}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="mt-2 px-4" pointerEvents="auto">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 10,
              gap: 8,
              paddingRight: 14,
              paddingVertical: 2,
            }}
            style={{
              maxHeight: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_FILTER_OPTIONS.map((option) => (
              <QuickFilterChip
                key={option.key}
                option={option}
                active={quickFilters[option.key] === true}
                onToggle={handleQuickFilterToggle}
              />
            ))}
          </ScrollView>
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

      {activePlace ? (
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
            compact={isCompactPreviewCard}
          />
        </View>
      ) : null}

      <LayerSwitcherModal
        visible={layerModalVisible}
        onClose={() => setLayerModalVisible(false)}
        currentStyle={mapStyle}
        onSelect={setMapStyle}
      />
    </View>
  );
}
