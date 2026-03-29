import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
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
import { DistrictLayer, WardLayer } from "./components/BoundaryLayer";
import {
  CATEGORY_MARKER_STYLES,
  DEFAULT_CATEGORY_ICON,
  CAN_THO_CENTER,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "./config/mapConfig";
import { COLORS } from "../../constants/colors";
import { usePlaceDetail } from "../place/hooks/usePlaceDetail";
import { FLOATING_TAB_CLEARANCE } from "../../../app/(tabs)/_layout";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_SNAP_MINI = 330;
const SHEET_TOP_RESTING_GAP = 176;
const SHEET_HEADER_GESTURE_HEIGHT = 108;

const MAP_UI_THEME = {
  background: "#05070B",
  backgroundElevated: "#111111",
  backgroundSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  neon: "#00F0FF",
  whitePill: "rgba(255,255,255,0.94)",
  whitePillBorder: "rgba(255,255,255,0.18)",
  mapOverlay: "rgba(4,6,12,0.18)",
  heroGradient: "rgba(0,0,0,0.72)",
};

const PRICE_LABELS = {
  FREE: { label: "Miễn phí", color: COLORS.success },
  BUDGET: { label: "Bình dân", color: COLORS.info },
  MODERATE: { label: "Trung bình", color: COLORS.warning },
  EXPENSIVE: { label: "Cao cấp", color: "#f97316" },
  LUXURY: { label: "Sang trọng", color: "#8b5cf6" },
};

const NAV_MENU_ITEMS = [
  { key: "map", label: "Bản đồ", icon: "map", route: "/(tabs)/map" },
  {
    key: "explore",
    label: "Khám phá",
    icon: "explore",
    route: "/(tabs)/explore",
  },
  { key: "trips", label: "Chuyến đi", icon: "luggage", route: "/(tabs)/trips" },
  { key: "ai", label: "AI", icon: "auto-awesome", route: "/(tabs)/ai" },
  { key: "saved", label: "Đã lưu", icon: "bookmark", route: "/(tabs)/saved" },
  { key: "profile", label: "Hồ sơ", icon: "person", route: "/(tabs)/profile" },
];

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

const InfoChip = ({ icon, label, tone = "dark" }) => (
  <View
    className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
    style={{
      backgroundColor:
        tone === "light" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    }}
  >
    <MaterialIcons
      name={icon}
      size={12}
      color={tone === "light" ? MAP_UI_THEME.text : MAP_UI_THEME.textSecondary}
    />
    <Text
      className="text-[11px] font-semibold uppercase"
      style={{
        color:
          tone === "light" ? MAP_UI_THEME.text : MAP_UI_THEME.textSecondary,
        letterSpacing: 0.6,
      }}
    >
      {label}
    </Text>
  </View>
);

const SheetAction = ({ label, primary = false, onPress, icon }) => (
  <Pressable
    onPress={onPress}
    className="flex-1 rounded-full flex-row items-center justify-center gap-2 py-3"
    style={{
      backgroundColor: primary
        ? "rgba(255,255,255,0.1)"
        : "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: primary ? "rgba(0,240,255,0.24)" : "rgba(255,255,255,0.08)",
    }}
  >
    <MaterialIcons
      name={icon}
      size={16}
      color={primary ? MAP_UI_THEME.neon : MAP_UI_THEME.textSecondary}
    />
    <Text
      className="text-[13px] font-semibold"
      style={{
        color: primary ? MAP_UI_THEME.text : MAP_UI_THEME.textSecondary,
        letterSpacing: 0.4,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

// ─── Full place detail content (no external sheet lib dependency) ────────────
const PlaceSheetContent = memo(({ place, bottomInset = 0 }) => {
  const router = useRouter();
  const { data: detail, isLoading } = usePlaceDetail(place?.id);
  const dp = detail || place;

  if (!dp) return null;

  const imgUri =
    dp.images?.[0]?.secureUrl ||
    dp.images?.[0]?.imageData ||
    dp.images?.[0]?.url ||
    dp.thumbnail;

  const ratingAvg = Number(dp.ratingAvg || dp.averageRating || 0).toFixed(1);
  const reviewCount = dp.reviewCount || dp._count?.reviews || 0;
  const price = PRICE_LABELS[dp.priceRange];
  const chips = [dp.category?.name, price?.label, dp.district?.name].filter(Boolean);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomInset + 48 }}
    >
      {/* Hero image */}
      <View
        style={{
          height: 200,
          marginHorizontal: 16,
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#1f2937",
        }}
      >
        {imgUri ? (
          <Image
            source={{ uri: imgUri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : null}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.38)",
          }}
        />
        <View style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <Text
            numberOfLines={2}
            style={{ color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: -0.5 }}
          >
            {dp.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 3 }}
          >
            {dp.address || dp.district?.name || "Cần Thơ"}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
        {/* Rating + chips */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(251,191,36,0.15)",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text style={{ color: "#fbbf24", fontWeight: "700", fontSize: 13 }}>
              {ratingAvg}
            </Text>
            {reviewCount > 0 ? (
              <Text style={{ color: "#a3a3a3", fontSize: 11 }}>({reviewCount})</Text>
            ) : null}
          </View>
          {chips.map((chip) => (
            <View
              key={chip}
              style={{
                backgroundColor: "rgba(255,255,255,0.09)",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Text style={{ color: "#e5e7eb", fontSize: 12, fontWeight: "600" }}>{chip}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.push(`/place/${dp.id}`)}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: MAP_UI_THEME.neon,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <MaterialIcons name="arrow-outward" size={16} color="#05070B" />
            <Text style={{ color: "#05070B", fontWeight: "700", fontSize: 14 }}>
              Xem chi tiết
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/booking/${dp.id}`)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons name="confirmation-number" size={18} color="#e5e7eb" />
          </Pressable>
          <Pressable
            style={{
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons name="directions" size={18} color="#e5e7eb" />
          </Pressable>
        </View>

        {/* Description */}
        {dp.description ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Mô tả</Text>
            <Text style={{ color: "#a3a3a3", lineHeight: 22, fontSize: 14 }}>
              {dp.description}
            </Text>
          </View>
        ) : isLoading ? (
          <View style={{ height: 80, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" }} />
        ) : null}

        {/* Tags */}
        {dp.tags?.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Đặc điểm</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {dp.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: "rgba(0,240,255,0.09)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: "rgba(0,240,255,0.2)",
                  }}
                >
                  <Text style={{ color: MAP_UI_THEME.neon, fontSize: 12, fontWeight: "600" }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
});

// ─── Custom snap-to-position bottom sheet (no reanimated dependency) ─────────
// Positioning: bottom=0, translateY controls visibility
//   closed → translateY = sheetHeight        (off screen below)
//   mini   → translateY = sheetHeight - snapMini  (snapMini px visible)
//   full   → translateY = 0                  (full sheet visible)
const MapPlaceSheet = ({
  visible,
  place,
  onRequestClose,
  onHidden,
  snapMini,
  snapFull,
  bottomInset = 0,
}) => {
  const sheetHeight = snapFull + bottomInset;
  const visibleMiniHeight = snapMini + bottomInset;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const currentSnap = useRef("closed");

  const snapTo = useCallback(
    (target, onDone) => {
      const toValue =
        target === "mini"
          ? sheetHeight - visibleMiniHeight
          : target === "full"
            ? 0
            : sheetHeight;
      currentSnap.current = target;
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start(onDone);
    },
    [translateY, sheetHeight, visibleMiniHeight],
  );

  useEffect(() => {
    if (!place) return undefined;

    if (visible) {
      snapTo("mini");
      return undefined;
    }

    snapTo("closed", onHidden);
    return undefined;
  }, [onHidden, place, snapTo, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dy) > 3 && Math.abs(gs.dy) > Math.abs(gs.dx),
        onPanResponderMove: (_, gs) => {
          const base =
            currentSnap.current === "full" ? 0 : sheetHeight - visibleMiniHeight;
          translateY.setValue(Math.max(0, base + gs.dy));
        },
        onPanResponderRelease: (_, gs) => {
          const isFull = currentSnap.current === "full";
          if (!isFull && (gs.dy < -40 || gs.vy < -0.35)) {
            snapTo("full");
          } else if (gs.dy > 56 || gs.vy > 0.45) {
            if (isFull) {
              snapTo("mini");
            } else {
              onRequestClose?.();
            }
          } else {
            snapTo(isFull ? "full" : "mini");
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onRequestClose, sheetHeight, visibleMiniHeight],
  );

  if (!place) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: sheetHeight,
        transform: [{ translateY }],
        backgroundColor: MAP_UI_THEME.backgroundElevated,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        overflow: "hidden",
        zIndex: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 20,
      }}
    >
      {/* Drag handle — only this area triggers pan gesture */}
      <View
        {...panResponder.panHandlers}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          paddingTop: 12,
          paddingBottom: 12,
          alignItems: "center",
          justifyContent: "center",
          minHeight: SHEET_HEADER_GESTURE_HEIGHT,
        }}
      >
        <View
          style={{
            width: 48,
            height: 5,
            borderRadius: 99,
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        />
      </View>

      <View style={{ flex: 1, paddingTop: 40 }}>
        <PlaceSheetContent place={place} bottomInset={bottomInset} />
      </View>
    </Animated.View>
  );
};

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
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const lastAppliedFocusRef = useRef("");
  const lastPlaceRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetMounted, setIsSheetMounted] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);
  const [navMenuVisible, setNavMenuVisible] = useState(false);

  const {
    data: homeData,
    isLoading: homeLoading,
    error: homeError,
    refetch: refetchHome,
  } = useHomeData({ limit: 1 });
  const {
    data: mapPlaces,
    isLoading: placesLoading,
    error: placesError,
    refetch: refetchPlaces,
  } = useMapPlaces();
  const { districts: districtGeo, wards: wardGeo } = useBoundaryData();

  const isLoading = homeLoading || placesLoading;
  const error = homeError || placesError;
  const refetch = useCallback(() => {
    refetchHome();
    refetchPlaces();
  }, [refetchHome, refetchPlaces]);

  const categories = useMemo(
    () => homeData?.data?.categories || [],
    [homeData],
  );
  const sheetSnapExpanded = useMemo(() => {
    const targetTop = (insets.top || 0) + SHEET_TOP_RESTING_GAP;
    return Math.max(
      SHEET_SNAP_MINI + 96,
      SCREEN_HEIGHT - targetTop - FLOATING_TAB_CLEARANCE,
    );
  }, [insets.top]);
  const allPlaces = useMemo(
    () =>
      (mapPlaces || []).map((place) => ({
        ...place,
        markerStyle:
          CATEGORY_MARKER_STYLES[place.categoryId] || DEFAULT_CATEGORY_ICON,
      })),
    [mapPlaces],
  );

  const visiblePlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      const matchesCategory =
        !activeCategoryId || place.categoryId === activeCategoryId;
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        place.name?.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, allPlaces, searchText]);

  const selectedPlaceId = selectedPlace?.id ?? null;

  const activePlace = useMemo(
    () =>
      visiblePlaces.find((p) => p.id === selectedPlaceId) ||
      (isSheetVisible ? selectedPlace : null),
    [isSheetVisible, visiblePlaces, selectedPlaceId, selectedPlace],
  );

  // Keep last selected place so sheet content stays during close animation
  if (activePlace) lastPlaceRef.current = activePlace;

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
    setIsSheetMounted(true);
    setIsSheetVisible(true);
    if (place.longitude && place.latitude) {
      mapRef.current?.flyTo([place.longitude, place.latitude], 15);
    }
  }, []);

  const handleRequestCloseSheet = useCallback(() => {
    setIsSheetVisible(false);
    setSelectedPlace(null);
  }, []);

  const handleSheetHidden = useCallback(() => {
    setIsSheetMounted(false);
  }, []);

  const handleCategoryToggle = useCallback((categoryId) => {
    setActiveCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const handleNavigateTab = useCallback(
    (route) => {
      setNavMenuVisible(false);
      if (route === "/(tabs)/map") return;
      router.push(route);
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
      setIsSheetMounted(true);
      setIsSheetVisible(true);
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
        ) : error ? (
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
        ) : (
          <MapView
            ref={mapRef}
            places={visiblePlaces}
            selectedPlaceId={activePlace?.id ?? null}
            onSelectPlace={handleSelectPlace}
            tileUrls={mapStyle.urls}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            {districtGeo ? <DistrictLayer geojson={districtGeo} /> : null}
            {wardGeo ? <WardLayer geojson={wardGeo} /> : null}
          </MapView>
        )}

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: MAP_UI_THEME.mapOverlay,
          }}
        />
      </View>

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 12 }}
        pointerEvents="box-none"
      >
        {navMenuVisible ? (
          <Pressable
            pointerEvents="auto"
            onPress={() => setNavMenuVisible(false)}
            style={{ position: "absolute", inset: 0 }}
          />
        ) : null}

        <View className="flex-row items-start px-4 gap-3" pointerEvents="auto">
          <Pressable
            className="w-[44px] h-[44px]"
            onPress={() => setNavMenuVisible((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={navMenuVisible ? "Đóng menu" : "Mở menu"}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
              }}
            >
              <MaterialIcons
                name={navMenuVisible ? "close" : "menu"}
                size={24}
                color="#FFFFFF"
              />
            </View>
          </Pressable>

          <GlassPanel
            style={{
              flex: 1,
              height: 48,
              borderRadius: 26,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 4,
            }}
            intensity={50}
          >
            <MaterialIcons
              name="search"
              size={20}
              color={MAP_UI_THEME.textSecondary}
              style={{ marginLeft: 6 }}
            />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm kiếm địa điểm..."
              placeholderTextColor={MAP_UI_THEME.textSecondary}
              style={{
                flex: 1,
                height: 48,
                fontSize: 14,
                fontWeight: "600",
                color: MAP_UI_THEME.text,
                paddingHorizontal: 8,
              }}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 ? (
              <Pressable
                onPress={() => setSearchText("")}
                className="w-10 h-10 items-center justify-center"
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={MAP_UI_THEME.textSecondary}
                />
              </Pressable>
            ) : null}
          </GlassPanel>

          <View className="items-end gap-2">
            <Pressable
              className="w-[48px] h-[48px]"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <GlassPanel
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                intensity={50}
              >
                <MaterialIcons
                  name="person"
                  size={22}
                  color={MAP_UI_THEME.text}
                />
              </GlassPanel>
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

        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: [{ translateY: -54 }],
            zIndex: 55,
          }}
        >
          <View className="items-end gap-3" pointerEvents="auto">
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

        {navMenuVisible ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: (insets.top || 0) + 62,
              left: 16,
              zIndex: 60,
            }}
          >
            <GlassPanel
              style={{
                width: 220,
                borderRadius: 22,
                paddingVertical: 8,
                paddingHorizontal: 8,
              }}
              intensity={58}
            >
              {NAV_MENU_ITEMS.map((item) => {
                const isActive = item.key === "map";
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleNavigateTab(item.route)}
                    className="h-[44px] flex-row items-center gap-3 px-3 rounded-[14px]"
                    style={({ pressed }) => ({
                      backgroundColor: isActive
                        ? "rgba(0,240,255,0.16)"
                        : pressed
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive
                        ? "rgba(0,240,255,0.24)"
                        : "transparent",
                    })}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={19}
                      color={
                        isActive
                          ? MAP_UI_THEME.neon
                          : MAP_UI_THEME.textSecondary
                      }
                    />
                    <Text
                      className="text-[13px] font-semibold"
                      style={{
                        color: isActive
                          ? MAP_UI_THEME.text
                          : MAP_UI_THEME.textSecondary,
                        letterSpacing: 0.3,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassPanel>
          </View>
        ) : null}

      </View>

      {/* Custom bottom sheet — mini (330px) → full (90%) */}
      {isSheetMounted ? (
        <Pressable
          onPress={handleRequestCloseSheet}
          style={[StyleSheet.absoluteFillObject, { zIndex: 30 }]}
        />
      ) : null}

      {isSheetMounted ? (
        <MapPlaceSheet
          visible={isSheetVisible}
          place={lastPlaceRef.current}
          onRequestClose={handleRequestCloseSheet}
          onHidden={handleSheetHidden}
          snapMini={SHEET_SNAP_MINI}
          snapFull={sheetSnapExpanded}
          bottomInset={FLOATING_TAB_CLEARANCE}
        />
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
