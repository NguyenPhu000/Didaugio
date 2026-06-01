import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { useExplore, useCategories } from "../hooks/useExplore";
import { useBoundaryData } from "../../map/hooks/useBoundaryData";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, normalizeText } from "../utils/exploreHelpers";

const CHIP_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
const SEARCH_DEBOUNCE_MS = 300;
const PRICE_FILTERS = [
  { label: "Miễn phí", value: "FREE" },
  { label: "Bình dân", value: "BUDGET" },
  { label: "Trung bình", value: "MODERATE" },
  { label: "Cao cấp", value: "EXPENSIVE" },
];
const RATING_FILTERS = [
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4 },
  { label: "3.5+", value: 3.5 },
];
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "newest" },
  { label: "Đánh giá", value: "rating" },
  { label: "Phổ biến", value: "popular" },
];

const buildPlaceSearchIndex = (place) =>
  normalizeText(
    [
      place?.name,
      place?.shortDescription,
      place?.description,
      place?.address,
      place?.district?.name,
      place?.ward?.name,
      place?.category?.name,
    ]
      .filter(Boolean)
      .join(" "),
  );

const pickDistricts = (geojson) => {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  return features
    .map((feature) => ({
      id:
        feature?.properties?.id ??
        feature?.properties?.districtId ??
        feature?.properties?.gid ??
        feature?.id ??
        null,
      name:
        feature?.properties?.name ||
        feature?.properties?.district ||
        feature?.properties?.ten ||
        "Khu vực",
    }))
    .filter((district) => district.id != null && district.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"))
    .slice(0, 12);
};

const SearchResultItem = memo(function SearchResultItem({
  place,
  placeId,
  onPressPlace,
}) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const handlePress = useCallback(() => {
    if (placeId != null) {
      onPressPlace(placeId);
    }
  }, [onPressPlace, placeId]);

  return (
    <Pressable onPress={handlePress} className="flex-row items-center gap-3.5 py-3 border-b border-[#F2F2F7]">
      <View className="w-14 h-14 rounded-[14px] overflow-hidden bg-[#F2F2F7] items-center justify-center relative">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <MaterialIconsRounded name="place" size={22} color="rgba(255,255,255,0.4)" />
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-[#1D1D1F] text-sm font-semibold" numberOfLines={1}>
          {place?.name}
        </Text>
        {location ? (
          <View className="flex-row items-center gap-0.75">
            <MaterialIconsRounded
              name="place"
              size={12}
              color={APPLE_THEME.focusBlue}
            />
            <Text className="text-[#54647A] text-[11px] font-medium" numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        {rating > 0 ? (
          <View className="flex-row items-center gap-0.75">
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text className="text-[#1D1D1F] text-[11px] font-semibold">{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <MaterialIconsRounded
        name="chevron-right"
        size={20}
        color={APPLE_THEME.textMuted}
      />
    </Pressable>
  );
});

export const SearchOverlay = memo(function SearchOverlayInner({ visible, onClose }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedMinRating, setSelectedMinRating] = useState(null);
  const [selectedSortBy, setSelectedSortBy] = useState("newest");
  const { data: categories = [] } = useCategories();
  const { districts } = useBoundaryData();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const districtOptions = useMemo(() => pickDistricts(districts), [districts]);

  const isActive =
    debouncedText.length > 0 ||
    selectedCategory !== null ||
    selectedDistrict !== null ||
    selectedPriceRange !== null ||
    selectedMinRating !== null ||
    selectedSortBy !== "newest";

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore({
      search: debouncedText,
      categoryId: selectedCategory,
      districtId: selectedDistrict,
      priceRange: selectedPriceRange,
      minRating: selectedMinRating,
      sortBy: selectedSortBy,
      enabled: visible && isActive,
    });

  const results = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page?.data || []) ?? [];
    const normalizedQuery = normalizeText(debouncedText);
    const seen = new Set();

    return raw
      .filter((place) => {
        const placeId = place?.id;
        if (placeId == null) return false;
        if (seen.has(placeId)) return false;
        seen.add(placeId);
        return true;
      })
      .filter((place) => {
        if (!normalizedQuery) return true;
        return buildPlaceSearchIndex(place).includes(normalizedQuery);
      });
  }, [data, debouncedText]);

  const handleClose = useCallback(() => {
    setText("");
    setDebouncedText("");
    setSelectedCategory(null);
    setSelectedDistrict(null);
    setSelectedPriceRange(null);
    setSelectedMinRating(null);
    setSelectedSortBy("newest");
    onClose();
  }, [onClose]);

  const handlePressPlace = useCallback(
    (placeId) => {
      handleClose();
      if (placeId) {
        router.push({ pathname: "/place/[id]", params: { id: placeId } });
      }
    },
    [handleClose, router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <SearchResultItem
        place={item}
        placeId={item?.id}
        onPressPlace={handlePressPlace}
      />
    ),
    [handlePressPlace],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
        {/* Search header */}
        <View className="flex-row items-center gap-3.5 px-5 pb-2.5">
          <View className="flex-1 flex-row items-center gap-2.5 h-11 px-3.5 rounded-[14px] bg-[#FFFFFF] border border-[#F2F2F7]">
            <MaterialIconsRounded
              name="search"
              size={20}
              color={text ? APPLE_THEME.text : APPLE_THEME.textMuted}
            />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder="Tìm địa điểm, quán ăn, điểm vui chơi..."
              placeholderTextColor={APPLE_THEME.textMuted}
              className="flex-1 text-[#1D1D1F] text-sm py-0 font-sans"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {text ? (
              <Pressable onPress={() => setText("")} hitSlop={10}>
                <MaterialIconsRounded
                  name="close"
                  size={18}
                  color={APPLE_THEME.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={10}>
            <Text className="text-[#007AFF] text-sm font-semibold">Đóng</Text>
          </Pressable>
        </View>

        {isActive ? (
          <View className="flex-row items-center justify-between px-5 pb-2 gap-2">
            <Text className="text-[#54647A] text-xs font-medium">
              {results.length} kết quả phù hợp
            </Text>
            <Pressable
              onPress={() => {
                setText("");
                setDebouncedText("");
                setSelectedCategory(null);
                setSelectedDistrict(null);
                setSelectedPriceRange(null);
                setSelectedMinRating(null);
                setSelectedSortBy("newest");
              }}
              className="flex-row items-center gap-1 px-2.5 h-7 rounded-full bg-black/[0.04] border border-[#F2F2F7]"
            >
              <MaterialIconsRounded
                name="refresh"
                size={14}
                color={APPLE_THEME.focusBlue}
              />
              <Text className="text-[#007AFF] text-[11px] font-semibold">Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Category chips */}
        {categories.length > 0 ? (
          <View className="shrink-0 mb-0.5">
            <Text className="px-5 pt-1.5 text-[#54647A] text-[11px] font-semibold uppercase tracking-[0.4px]">Danh mục</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                  selectedCategory === null ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === null ? "text-white" : "text-[#54647A]"
                  }`}
                >
                  Tất cả
                </Text>
              </Pressable>

              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(active ? null : cat.id)}
                    className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                      active ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-[#54647A]"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {districtOptions.length > 0 ? (
          <View className="shrink-0 mb-0.5">
            <Text className="px-5 pt-1.5 text-[#54647A] text-[11px] font-semibold uppercase tracking-[0.4px]">Khu vực</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => setSelectedDistrict(null)}
                className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                  selectedDistrict === null ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedDistrict === null ? "text-white" : "text-[#54647A]"
                  }`}
                >
                  Tất cả
                </Text>
              </Pressable>

              {districtOptions.map((district) => {
                const id = Number(district.id);
                if (!Number.isInteger(id) || id <= 0) return null;
                const active = selectedDistrict === id;
                return (
                  <Pressable
                    key={String(district.id)}
                    onPress={() => setSelectedDistrict(active ? null : id)}
                    className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                      active ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-[#54647A]"
                      }`}
                    >
                      {district.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View className="shrink-0 mb-0.5">
          <Text className="px-5 pt-1.5 text-[#54647A] text-[11px] font-semibold uppercase tracking-[0.4px]">Giá</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            {PRICE_FILTERS.map((item) => {
              const active = selectedPriceRange === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    setSelectedPriceRange(active ? null : item.value)
                  }
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-[#54647A]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="shrink-0 mb-0.5">
          <Text className="px-5 pt-1.5 text-[#54647A] text-[11px] font-semibold uppercase tracking-[0.4px]">Đánh giá & sắp xếp</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            {RATING_FILTERS.map((item) => {
              const active = selectedMinRating === item.value;
              return (
                <Pressable
                  key={String(item.value)}
                  onPress={() =>
                    setSelectedMinRating(active ? null : item.value)
                  }
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-[#54647A]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
            {SORT_OPTIONS.map((item) => {
              const active = selectedSortBy === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setSelectedSortBy(item.value)}
                  className={`px-4 py-2 rounded-full border self-center justify-center h-9 ${
                    active ? "bg-[#007AFF] border-[#007AFF]" : "bg-white border-[#E5E5EA]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-white" : "text-[#54647A]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <ActivityIndicator color={APPLE_THEME.focusBlue} />
          </View>
        ) : !isActive ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <MaterialIconsRounded
              name="travel-explore"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text className="text-[#1D1D1F] text-[17px] font-bold text-center mt-1">Tìm điểm đến tiếp theo</Text>
            <Text className="text-[#54647A] text-sm text-center leading-5">
              Nhập tên địa điểm hoặc chọn danh mục để khám phá.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2.5 px-12">
            <MaterialIconsRounded
              name="search-off"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text className="text-[#1D1D1F] text-[17px] font-bold text-center mt-1">Không tìm thấy kết quả</Text>
            <Text className="text-[#54647A] text-sm text-center leading-5">
              Thử từ khóa khác hoặc đổi bộ lọc.
            </Text>
          </View>
        ) : (
          <FlashList
            data={results}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={84}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  color={APPLE_THEME.focusBlue}
                  className="py-5"
                />
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
});
