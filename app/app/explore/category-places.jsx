import { memo, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import {
  resolvePlaceImageUri,
  getOptimizedCloudinaryUrl,
} from "../../src/lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
} from "../../src/modules/explore/utils/exploreHelpers";

const GRID_GAP = 16;
const GRID_PADDING = 20;

const useCardWidth = () => {
  const { width: screenWidth } = useWindowDimensions();
  return useMemo(() => {
    const totalGap = GRID_GAP;
    const totalPadding = GRID_PADDING * 2;
    return Math.floor((screenWidth - totalPadding - totalGap) / 2);
  }, [screenWidth]);
};

const GridPlaceCard = memo(function GridPlaceCard({
  place,
  onPress,
  cardWidth,
}) {
  const rawImageUri = resolvePlaceImageUri(place);
  const imageUri = rawImageUri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(rawImageUri, 400)
    : rawImageUri;
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const imageHeight = cardWidth * 1.1;

  return (
    <Pressable
      haptic="light"
      onPress={onPress}
      style={[styles.cardContainer, { width: cardWidth }]}
    >
      <View style={[styles.imageWrapper, { height: imageHeight }]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIconsRounded
              name="image-not-supported"
              size={28}
              color={APPLE_THEME.textMuted}
            />
          </View>
        )}

        {hasRating ? (
          <View style={styles.ratingBadge}>
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.placeTitle} numberOfLines={2}>
          {place?.name}
        </Text>

        {location ? (
          <View style={styles.locationRow}>
            <MaterialIconsRounded
              name="location-on"
              size={12}
              color={APPLE_THEME.textMuted}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

function CategoryPlacesGridScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const cardWidth = useCardWidth();

  const categoryId = id ? Number(id) : null;
  const categoryName = name || t("explore.category");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore({ categoryId });

  const allPlaces = useMemo(
    () => data?.pages.flatMap((page) => page?.data || []) ?? [],
    [data],
  );

  const handlePressPlace = useCallback(
    (place) => {
      if (place?.id) {
        router.push({ pathname: "/place/[id]", params: { id: place.id } });
      }
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <GridPlaceCard
        place={item}
        cardWidth={cardWidth}
        onPress={() => handlePressPlace(item)}
      />
    ),
    [cardWidth, handlePressPlace],
  );

  const keyExtractor = useCallback(
    (item, index) => (item?.id != null ? String(item.id) : `grid-${index}`),
    [],
  );

  return (
    <ExploreListScaffold title={categoryName} subtitle="">
      <FlashList
        data={allPlaces}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        estimatedItemSize={280}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP + 8 }} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIconsRounded
                  name="explore-off"
                  size={32}
                  color={APPLE_THEME.textMuted}
                />
              </View>
              <Text style={styles.emptyText}>
                {t("explore.empty.noResults") || "Chưa có địa điểm nào"}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>
                {t("common.loading") || "Đang tải thêm..."}
              </Text>
            </View>
          ) : null
        }
      />
    </ExploreListScaffold>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 24,
    paddingBottom: 60,
  },
  cardContainer: {
    marginBottom: 8,
  },
  imageWrapper: {
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  ratingBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    color: APPLE_THEME.text,
    fontSize: 11,
    fontFamily: TOKENS.font.bold,
  },
  infoContainer: {
    marginTop: 12,
    gap: 4,
    paddingHorizontal: 2,
  },
  placeTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: TOKENS.font.bold,
    color: APPLE_THEME.text,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: APPLE_THEME.textMuted,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APPLE_THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    color: APPLE_THEME.text,
  },
  loadingFooter: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
    color: APPLE_THEME.textMuted,
  },
});

export default memo(CategoryPlacesGridScreen);
