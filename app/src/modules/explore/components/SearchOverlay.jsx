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
import { TOKENS } from "../../../constants/design-tokens";
import { useExplore, useCategories } from "../hooks/useExplore";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, normalizeText } from "../utils/exploreHelpers";

const NAVY = "#0F4C75";
const TEXT_COLOR = "#0F172A";
const TEXT_MUTED = "#64748B";
const TEXT_SOFT = "#94A3B8";
const PRIMARY = "#2563EB";
const CHIP_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
const SEARCH_DEBOUNCE_MS = 300;

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
            <MaterialIcons name="place" size={12} color={PRIMARY} />
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

      <MaterialIcons name="chevron-right" size={20} color={TEXT_SOFT} />
    </Pressable>
  );
});

function SearchOverlayInner({ visible, onClose }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const isActive = debouncedText.length > 0 || selectedCategory !== null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore({
      search: debouncedText,
      categoryId: selectedCategory,
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
              color={text ? NAVY : TEXT_MUTED}
            />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder="Tìm địa điểm, quán ăn, điểm vui chơi..."
              placeholderTextColor={TEXT_SOFT}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {text ? (
              <Pressable onPress={() => setText("")} hitSlop={10}>
                <MaterialIcons name="close" size={18} color={TEXT_MUTED} />
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
              }}
              style={styles.clearFilterBtn}
            >
              <MaterialIcons name="refresh" size={14} color={PRIMARY} />
              <Text style={styles.clearFilterText}>Đặt lại bộ lọc</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Category chips */}
        {categories.length > 0 ? (
          <View style={styles.categoryWrap}>
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

        {/* Results */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={NAVY} />
          </View>
        ) : !isActive ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="travel-explore" size={42} color={TEXT_SOFT} />
            <Text style={styles.emptyTitle}>Tìm điểm đến tiếp theo</Text>
            <Text style={styles.emptyCopy}>
              Nhập tên địa điểm hoặc chọn danh mục để khám phá.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={42} color={TEXT_SOFT} />
            <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.emptyCopy}>
              Thử từ khóa khác hoặc đổi danh mục.
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
                <ActivityIndicator color={NAVY} style={styles.footerLoader} />
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    color: TEXT_COLOR,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    paddingVertical: 0,
  },
  cancelBtn: {
    color: PRIMARY,
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
    color: TEXT_MUTED,
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
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  clearFilterText: {
    color: PRIMARY,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  categoryWrap: {
    maxHeight: 56,
    flexShrink: 0,
    marginBottom: 2,
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
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignSelf: "center",
    justifyContent: "center",
    height: 36,
    ...Platform.select({
      ios: CHIP_SHADOW,
      android: { elevation: 0 },
    }),
  },
  chipActive: {
    backgroundColor: "#0F2942",
    borderColor: "#0F2942",
  },
  chipText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 48,
  },
  emptyTitle: {
    color: TEXT_COLOR,
    fontSize: 17,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
    marginTop: 4,
  },
  emptyCopy: {
    color: TEXT_MUTED,
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
    borderBottomColor: "#F1F5F9",
  },
  resultImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0c4a6e",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    color: TEXT_COLOR,
    fontSize: 14,
    fontFamily: TOKENS.font.heading,
  },
  resultLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultLocation: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  resultRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  resultRating: {
    color: TEXT_COLOR,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
