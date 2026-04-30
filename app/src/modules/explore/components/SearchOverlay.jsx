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
import { MaterialIcons } from "@expo/vector-icons";
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
    <Pressable onPress={handlePress} style={styles.resultItem}>
      <View style={styles.resultImageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <MaterialIcons name="place" size={22} color="rgba(255,255,255,0.4)" />
        )}
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {place?.name}
        </Text>
        {location ? (
          <View style={styles.resultLocationRow}>
            <MaterialIcons
              name="place"
              size={12}
              color={APPLE_THEME.focusBlue}
            />
            <Text style={styles.resultLocation} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        {rating > 0 ? (
          <View style={styles.resultRatingRow}>
            <MaterialIcons name="star" size={12} color="#FBBF24" />
            <Text style={styles.resultRating}>{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <MaterialIcons
        name="chevron-right"
        size={20}
        color={APPLE_THEME.textMuted}
      />
    </Pressable>
  );
});

function SearchOverlayInner({ visible, onClose }) {
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
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        {/* Search header */}
        <View style={styles.searchHeader}>
          <View style={styles.searchInputWrap}>
            <MaterialIcons
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
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {text ? (
              <Pressable onPress={() => setText("")} hitSlop={10}>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={APPLE_THEME.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={10}>
            <Text style={styles.cancelBtn}>Đóng</Text>
          </Pressable>
        </View>

        {isActive ? (
          <View style={styles.filterSummaryRow}>
            <Text style={styles.filterSummaryText}>
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
              style={styles.clearFilterBtn}
            >
              <MaterialIcons
                name="refresh"
                size={14}
                color={APPLE_THEME.focusBlue}
              />
              <Text style={styles.clearFilterText}>Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Category chips */}
        {categories.length > 0 ? (
          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>Danh mục</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={[
                  styles.chip,
                  selectedCategory === null ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategory === null ? styles.chipTextActive : null,
                  ]}
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
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active ? styles.chipTextActive : null,
                      ]}
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
          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>Khu vực</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable
                onPress={() => setSelectedDistrict(null)}
                style={[
                  styles.chip,
                  selectedDistrict === null ? styles.chipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDistrict === null ? styles.chipTextActive : null,
                  ]}
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
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active ? styles.chipTextActive : null,
                      ]}
                    >
                      {district.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.filterWrap}>
          <Text style={styles.filterLabel}>Giá</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
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
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterWrap}>
          <Text style={styles.filterLabel}>Đánh giá & sắp xếp</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
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
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
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
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : null,
                    ]}
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
          <View style={styles.emptyState}>
            <ActivityIndicator color={APPLE_THEME.focusBlue} />
          </View>
        ) : !isActive ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="travel-explore"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.emptyTitle}>Tìm điểm đến tiếp theo</Text>
            <Text style={styles.emptyCopy}>
              Nhập tên địa điểm hoặc chọn danh mục để khám phá.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="search-off"
              size={42}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptyCopy}>
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
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  color={APPLE_THEME.focusBlue}
                  style={styles.footerLoader}
                />
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

export const SearchOverlay = memo(SearchOverlayInner);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  searchInput: {
    flex: 1,
    color: APPLE_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    paddingVertical: 0,
  },
  cancelBtn: {
    color: APPLE_THEME.focusBlue,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  filterSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  filterSummaryText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
  },
  clearFilterText: {
    color: APPLE_THEME.focusBlue,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  filterWrap: {
    flexShrink: 0,
    marginBottom: 2,
  },
  filterLabel: {
    paddingHorizontal: 20,
    paddingTop: 6,
    color: APPLE_THEME.textSecondary,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    alignSelf: "center",
    justifyContent: "center",
    height: 36,
    ...Platform.select({
      ios: CHIP_SHADOW,
      android: { elevation: 0 },
    }),
  },
  chipActive: {
    backgroundColor: APPLE_THEME.primary,
    borderColor: APPLE_THEME.primary,
  },
  chipText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  chipTextActive: {
    color: APPLE_THEME.white,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 48,
  },
  emptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 17,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
    marginTop: 4,
  },
  emptyCopy: {
    color: APPLE_THEME.textSecondary,
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 20,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APPLE_THEME.borderSoft,
  },
  resultImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    color: APPLE_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.heading,
  },
  resultLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultLocation: {
    color: APPLE_THEME.textSecondary,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  resultRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultRating: {
    color: APPLE_THEME.text,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
