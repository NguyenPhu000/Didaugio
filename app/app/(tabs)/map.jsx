/**
 * MapScreen — Main map tab
 * Design: Glassmorphism floating UI over full-screen MapLibre map
 * NativeWind for layout, inline style for rgba glassmorphism values
 */
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useHomeData } from "../../src/modules/map/hooks/useHomeData";
import MapView from "../../src/modules/map/components/MapView";
import {
  CATEGORY_ICON_MAP,
  DEFAULT_CATEGORY_ICON,
} from "../../src/modules/map/config/mapConfig";
import { cn } from "../../src/lib/cn";

// Glass rgba tokens — must stay as inline style values
const GLASS_BG = "rgba(255,255,255,0.72)";
const GLASS_BORDER = "rgba(255,255,255,0.55)";
const PRIMARY = "#0576b3";

// ─── Glass panel (BlurView wrapper) ──────────────────────────────────────────
const GlassPanel = ({ style, className: cls, children, intensity = 40 }) => (
  <BlurView
    intensity={intensity}
    tint="light"
    style={[
      {
        backgroundColor: GLASS_BG,
        borderWidth: 1,
        borderColor: GLASS_BORDER,
        overflow: "hidden",
      },
      style,
    ]}
    className={cls}
  >
    {children}
  </BlurView>
);

// ─── Category chip ────────────────────────────────────────────────────────────
const CategoryChip = ({ category, active, onPress }) => {
  const meta = CATEGORY_ICON_MAP[category.name] || DEFAULT_CATEGORY_ICON;

  if (active) {
    return (
      <Pressable
        onPress={onPress}
        className="h-[38px] rounded-[20px] flex-row items-center px-4 gap-1.5 overflow-hidden"
        style={{
          backgroundColor: PRIMARY,
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 4,
          flexShrink: 0,
        }}
      >
        <MaterialIcons name={meta.icon} size={18} color="#fff" />
        <Text
          className="text-[13px] font-semibold text-white"
          style={{ letterSpacing: 0.3 }}
        >
          {category.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <GlassPanel
      style={{
        height: 38,
        borderRadius: 20,
        overflow: "hidden",
        flexShrink: 0,
      }}
      intensity={30}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-4 gap-1.5 h-full active:opacity-80"
      >
        <MaterialIcons name={meta.icon} size={18} color="#737373" />
        <Text className="text-[13px] font-medium" style={{ color: "#3a3a3a" }}>
          {category.name}
        </Text>
      </Pressable>
    </GlassPanel>
  );
};

// ─── Selected place bottom card ───────────────────────────────────────────────
const PlaceCard = ({ place, onClose }) => (
  <GlassPanel
    style={{ borderRadius: 16, overflow: "hidden", padding: 12 }}
    intensity={60}
  >
    <View className="flex-row items-center gap-2.5">
      {place.images?.[0]?.imageData || place.images?.[0]?.url ? (
        <Image
          source={{ uri: place.images[0].imageData || place.images[0].url }}
          className="w-[68px] h-[68px] rounded-[10px]"
          resizeMode="cover"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <View
          className="w-[68px] h-[68px] rounded-[10px] bg-gray-100 items-center justify-center"
          style={{ flexShrink: 0 }}
        >
          <MaterialIcons name="place" size={24} color="#737373" />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>
          {place.name}
        </Text>
        <Text
          className="text-[12px] text-ink-secondary mt-0.5"
          numberOfLines={1}
        >
          {place.address || place.ward?.name || ""}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <MaterialIcons name="star" size={14} color="#FBBF24" />
          <Text className="text-[11px] text-ink-secondary">
            {(place.ratingAvg || place.averageRating || 0).toFixed(1)}
          </Text>
          <View className="w-[3px] h-[3px] rounded-full bg-ink-secondary mx-0.5" />
          <MaterialIcons name="remove-red-eye" size={14} color="#737373" />
          <Text className="text-[11px] text-ink-secondary">
            {place.viewCount || 0}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onClose}
        className="w-8 h-8 rounded-full items-center justify-center self-start"
      >
        <MaterialIcons name="close" size={20} color="#737373" />
      </Pressable>
    </View>
  </GlassPanel>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const router = useRouter();

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, error } = useHomeData({ limit: 50 });

  const categories = data?.data?.categories || [];
  const allPlaces = data?.data?.featuredPlaces || [];

  const visiblePlaces = allPlaces.filter((p) => {
    const matchCat = !activeCategoryId || p.categoryId === activeCategoryId;
    const q = searchText.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleLocate = useCallback(() => {
    mapRef.current?.flyTo([105.7200532, 10.0345852], 12);
  }, []);

  const handleSelectPlace = useCallback((place) => {
    setSelectedPlace(place);
    if (place.longitude && place.latitude) {
      mapRef.current?.flyTo([place.longitude, place.latitude], 15);
    }
  }, []);

  return (
    <View className="flex-1 bg-surface">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* ── Full-screen map backdrop ── */}
      <View className="absolute inset-0">
        {isLoading ? (
          <View
            className="flex-1 items-center justify-center gap-3"
            style={{ backgroundColor: "#eef4f8" }}
          >
            <ActivityIndicator color={PRIMARY} size="large" />
            <Text className="text-[14px] font-medium text-primary">
              Đang tải bản đồ...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3 bg-red-50">
            <MaterialIcons name="wifi-off" size={40} color="#ef4444" />
            <Text className="text-[14px] text-red-500">
              Không tải được dữ liệu
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            places={visiblePlaces}
            selectedPlaceId={selectedPlace?.id ?? null}
            onSelectPlace={handleSelectPlace}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </View>

      {/* ── Floating glassmorphism UI layer ── */}
      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 8 }}
        pointerEvents="box-none"
      >
        {/* Top row: search bar + avatar */}
        <View
          className="flex-row items-center px-4 pb-2 gap-2.5"
          pointerEvents="auto"
        >
          <GlassPanel
            style={{
              flex: 1,
              height: 52,
              borderRadius: 26,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 4,
            }}
            intensity={50}
          >
            <MaterialIcons
              name="search"
              size={22}
              color={PRIMARY}
              style={{ marginLeft: 6 }}
            />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm kiếm địa điểm..."
              placeholderTextColor="#737373"
              style={{
                flex: 1,
                height: 52,
                fontSize: 15,
                fontWeight: "500",
                color: "#111618",
                paddingHorizontal: 8,
              }}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              clearButtonMode="while-editing"
            />
            <Pressable className="w-10 h-10 items-center justify-center">
              <MaterialIcons name="mic" size={20} color="#737373" />
            </Pressable>
          </GlassPanel>

          <Pressable
            className="w-[52px] h-[52px]"
            onPress={() => router.push("/(tabs)/profile")}
          >
            <GlassPanel
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
              intensity={50}
            >
              <MaterialIcons name="person" size={26} color={PRIMARY} />
            </GlassPanel>
          </Pressable>
        </View>

        {/* Category chips row */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 10,
              paddingRight: 20,
            }}
            style={{ maxHeight: 52, paddingVertical: 4 }}
            keyboardShouldPersistTaps="handled"
            pointerEvents="auto"
          >
            <CategoryChip
              category={{ id: null, name: "Tất cả" }}
              active={activeCategoryId === null}
              onPress={() => setActiveCategoryId(null)}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                category={cat}
                active={activeCategoryId === cat.id}
                onPress={() =>
                  setActiveCategoryId(
                    activeCategoryId === cat.id ? null : cat.id,
                  )
                }
              />
            ))}
          </ScrollView>
        )}

        {/* Map interaction area (transparent) */}
        <View className="flex-1" pointerEvents="box-none">
          {selectedPlace && (
            <View
              className="absolute left-4 right-4 bottom-0"
              pointerEvents="auto"
            >
              <PlaceCard
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
              />
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View
          className="flex-row justify-between items-end px-5 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 8 }}
          pointerEvents="box-none"
        >
          {/* Layers toggle */}
          <GlassPanel
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
            }}
            intensity={50}
          >
            <Pressable
              className="w-full h-full items-center justify-center"
              pointerEvents="auto"
            >
              <MaterialIcons name="layers" size={22} color="#111618" />
            </Pressable>
          </GlassPanel>

          {/* Right group: zoom + locate */}
          <View className="gap-3 items-end" pointerEvents="box-none">
            <GlassPanel
              style={{
                borderRadius: 24,
                overflow: "hidden",
                paddingVertical: 4,
                paddingHorizontal: 4,
              }}
              intensity={50}
            >
              <Pressable
                className="w-10 h-10 items-center justify-center"
                pointerEvents="auto"
                onPress={() => mapRef.current?.zoomIn()}
              >
                <MaterialIcons name="add" size={22} color="#737373" />
              </Pressable>
              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(0,0,0,0.12)",
                  width: 24,
                  alignSelf: "center",
                }}
              />
              <Pressable
                className="w-10 h-10 items-center justify-center"
                pointerEvents="auto"
                onPress={() => mapRef.current?.zoomOut()}
              >
                <MaterialIcons name="remove" size={22} color="#737373" />
              </Pressable>
            </GlassPanel>

            <Pressable
              onPress={handleLocate}
              className="w-14 h-14 rounded-full bg-white items-center justify-center active:opacity-85 active:scale-95"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 6,
                borderWidth: 1,
                borderColor: GLASS_BORDER,
              }}
              pointerEvents="auto"
            >
              <MaterialIcons name="my-location" size={26} color={PRIMARY} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
