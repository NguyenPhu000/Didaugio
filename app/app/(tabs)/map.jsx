import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
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
import * as Location from "expo-location";
import { useHomeData } from "../../src/modules/map/hooks/useHomeData";
import { useBoundaryData } from "../../src/modules/map/hooks/useBoundaryData";
import MapView from "../../src/modules/map/components/MapView";
import { DistrictLayer, WardLayer } from "../../src/modules/map/components/BoundaryLayer";
import {
  CATEGORY_ICON_MAP,
  DEFAULT_CATEGORY_ICON,
  CAN_THO_CENTER,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
} from "../../src/modules/map/config/mapConfig";
import { COLORS } from "../../src/constants/colors";

const PRICE_LABELS = {
  FREE: { label: "Miễn phí", color: COLORS.success },
  BUDGET: { label: "Bình dân", color: COLORS.info },
  MODERATE: { label: "Trung bình", color: COLORS.warning },
  EXPENSIVE: { label: "Cao cấp", color: "#f97316" },
  LUXURY: { label: "Sang trọng", color: "#8b5cf6" },
};

const GlassPanel = ({ style, className: cls, children, intensity = 40 }) => (
  <BlurView
    intensity={intensity}
    tint="light"
    style={[
      {
        backgroundColor: COLORS.glassBg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        overflow: "hidden",
      },
      style,
    ]}
    className={cls}
  >
    {children}
  </BlurView>
);

const CategoryChip = ({ category, active, onPress }) => {
  const meta = CATEGORY_ICON_MAP[category.name] || DEFAULT_CATEGORY_ICON;

  if (active) {
    return (
      <Pressable
        onPress={onPress}
        className="h-[38px] rounded-[20px] flex-row items-center px-4 gap-1.5 overflow-hidden"
        style={{
          backgroundColor: COLORS.primary,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 4,
          flexShrink: 0,
        }}
      >
        <MaterialIcons name={meta.icon} size={18} color={COLORS.textInverse} />
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
      style={{ height: 38, borderRadius: 20, overflow: "hidden", flexShrink: 0 }}
      intensity={30}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-4 gap-1.5 h-full active:opacity-80"
      >
        <MaterialIcons name={meta.icon} size={18} color={COLORS.textSecondary} />
        <Text className="text-[13px] font-medium" style={{ color: COLORS.text }}>
          {category.name}
        </Text>
      </Pressable>
    </GlassPanel>
  );
};

const PlaceCard = ({ place, onClose, onViewDetail }) => {
  const price = PRICE_LABELS[place.priceRange];
  const imgUri = place.images?.[0]?.imageData || place.images?.[0]?.url;
  const catMeta = CATEGORY_ICON_MAP[place.category?.name] || DEFAULT_CATEGORY_ICON;

  return (
    <GlassPanel
      style={{ borderRadius: 16, overflow: "hidden", padding: 12 }}
      intensity={60}
    >
      <View className="flex-row items-center gap-2.5">
        {imgUri ? (
          <Image
            source={{ uri: imgUri }}
            className="w-[68px] h-[68px] rounded-[10px]"
            resizeMode="cover"
            style={{ flexShrink: 0 }}
          />
        ) : (
          <View
            className="w-[68px] h-[68px] rounded-[10px] bg-gray-100 items-center justify-center"
            style={{ flexShrink: 0 }}
          >
            <MaterialIcons name="place" size={24} color={COLORS.textSecondary} />
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
          <View className="flex-row items-center gap-1 mt-1 flex-wrap">
            <MaterialIcons name="star" size={14} color={COLORS.starFill} />
            <Text className="text-[11px] text-ink-secondary">
              {(place.ratingAvg || place.averageRating || 0).toFixed(1)}
            </Text>
            <View className="w-[3px] h-[3px] rounded-full bg-ink-secondary mx-0.5" />
            <MaterialIcons name={catMeta.icon} size={13} color={catMeta.color} />
            {price && (
              <>
                <View className="w-[3px] h-[3px] rounded-full bg-ink-secondary mx-0.5" />
                <Text style={{ color: price.color, fontSize: 10, fontWeight: "700" }}>
                  {price.label}
                </Text>
              </>
            )}
          </View>
        </View>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-full items-center justify-center self-start"
        >
          <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>
      {onViewDetail && (
        <Pressable
          onPress={() => onViewDetail(place)}
          className="mt-3 rounded-xl items-center justify-center py-2.5 active:opacity-80"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-[13px] font-bold text-white">Xem chi tiết</Text>
        </Pressable>
      )}
    </GlassPanel>
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
          className="bg-white rounded-2xl p-4 w-[260px]"
          style={{ elevation: 10 }}
        >
          <Text className="text-[15px] font-bold text-center mb-4" style={{ color: COLORS.text }}>
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
                className="flex-row items-center gap-3 py-3 px-3 rounded-xl mb-1 active:opacity-80"
                style={active ? { backgroundColor: COLORS.primaryLight } : {}}
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
                  color={active ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  className="text-[14px] font-medium flex-1"
                  style={{ color: active ? COLORS.primary : COLORS.text }}
                >
                  {opt.label}
                </Text>
                {active && (
                  <MaterialIcons name="check" size={20} color={COLORS.primary} />
                )}
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
  const router = useRouter();

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_STYLE);

  const { data, isLoading, error, refetch } = useHomeData({ limit: 50 });
  const { districts: districtGeo, wards: wardGeo } = useBoundaryData();

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

  const handleLocate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        mapRef.current?.flyTo(
          [loc.coords.longitude, loc.coords.latitude],
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

  const handleViewDetail = useCallback(
    (place) => {
      setSelectedPlace(null);
      router.push(`/place/${place.slug || place.id}`);
    },
    [router],
  );

  return (
    <View className="flex-1 bg-surface">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View className="absolute inset-0">
        {isLoading ? (
          <View
            className="flex-1 items-center justify-center gap-3"
            style={{ backgroundColor: COLORS.background }}
          >
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text className="text-[14px] font-medium" style={{ color: COLORS.primary }}>
              Đang tải bản đồ...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3" style={{ backgroundColor: COLORS.background }}>
            <MaterialIcons name="wifi-off" size={40} color={COLORS.error} />
            <Text className="text-[14px]" style={{ color: COLORS.error }}>
              Không tải được dữ liệu
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 px-5 py-2.5 rounded-xl active:opacity-80"
              style={{ backgroundColor: COLORS.primary }}
            >
              <MaterialIcons name="refresh" size={18} color={COLORS.textInverse} />
              <Text className="text-[14px] font-bold text-white">Thử lại</Text>
            </Pressable>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            places={visiblePlaces}
            selectedPlaceId={selectedPlace?.id ?? null}
            onSelectPlace={handleSelectPlace}
            tileUrl={mapStyle.url}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            {districtGeo && <DistrictLayer geojson={districtGeo} />}
            {wardGeo && <WardLayer geojson={wardGeo} />}
          </MapView>
        )}
      </View>

      <View
        className="flex-1 flex-col"
        style={{ paddingTop: (insets.top || 0) + 8 }}
        pointerEvents="box-none"
      >
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
              color={COLORS.primary}
              style={{ marginLeft: 6 }}
            />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm kiếm địa điểm..."
              placeholderTextColor={COLORS.textSecondary}
              style={{
                flex: 1,
                height: 52,
                fontSize: 15,
                fontWeight: "500",
                color: COLORS.text,
                paddingHorizontal: 8,
              }}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <Pressable
                onPress={() => setSearchText("")}
                className="w-10 h-10 items-center justify-center"
              >
                <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
              </Pressable>
            )}
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
              <MaterialIcons name="person" size={26} color={COLORS.primary} />
            </GlassPanel>
          </Pressable>
        </View>

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

        <View className="flex-1" pointerEvents="box-none">
          {selectedPlace && (
            <View
              className="absolute left-4 right-4 bottom-0"
              pointerEvents="auto"
            >
              <PlaceCard
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
                onViewDetail={handleViewDetail}
              />
            </View>
          )}
        </View>

        <View
          className="flex-row justify-between items-end px-5 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 8 }}
          pointerEvents="box-none"
        >
          <GlassPanel
            style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden" }}
            intensity={50}
          >
            <Pressable
              className="w-full h-full items-center justify-center"
              pointerEvents="auto"
              onPress={() => setLayerModalVisible(true)}
            >
              <MaterialIcons name="layers" size={22} color={COLORS.text} />
            </Pressable>
          </GlassPanel>

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
                <MaterialIcons name="add" size={22} color={COLORS.textSecondary} />
              </Pressable>
              <View
                style={{
                  height: 1,
                  backgroundColor: COLORS.glassOverlay,
                  width: 24,
                  alignSelf: "center",
                }}
              />
              <Pressable
                className="w-10 h-10 items-center justify-center"
                pointerEvents="auto"
                onPress={() => mapRef.current?.zoomOut()}
              >
                <MaterialIcons name="remove" size={22} color={COLORS.textSecondary} />
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
                borderColor: COLORS.glassBorder,
              }}
              pointerEvents="auto"
            >
              <MaterialIcons name="my-location" size={26} color={COLORS.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <LayerSwitcherModal
        visible={layerModalVisible}
        onClose={() => setLayerModalVisible(false)}
        currentStyle={mapStyle}
        onSelect={setMapStyle}
      />
    </View>
  );
}
