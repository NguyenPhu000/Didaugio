import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, { useSharedValue } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

import {
  useCategories,
  useExplore,
} from "../../src/modules/explore/hooks/useExplore";
import { useAuthStore } from "../../src/stores/authStore";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import {
  getCategoryIcon,
  normalizeText,
} from "../../src/modules/explore/utils/exploreHelpers";

import { FeaturedSection } from "../../src/modules/explore/components/FeaturedSection";
import { ExperienceBentoSection } from "../../src/modules/explore/components/ExperienceBentoSection";
import { PopularSection } from "../../src/modules/explore/components/PopularSection";
import { ExploreSkeleton } from "../../src/modules/explore/components/ExploreSkeleton";
import { SearchOverlay } from "../../src/modules/explore/components/SearchOverlay";
import { ExploreModernHeader } from "../../src/modules/explore/components/ExploreModernHeader";
import { ExploreQuickActions } from "../../src/modules/explore/components/ExploreQuickActions";
import { CategoryPills } from "../../src/modules/explore/components/CategoryPills";

const FEATURED_COUNT = 6;
const EMPTY_STATE_TITLE = "Chưa có địa điểm nào";
const EMPTY_STATE_COPY = "Hãy quay lại sau hoặc thử đổi danh mục khác.";
const FOOD_HINTS = ["ẩm thực", "food", "restaurant", "ăn", "quán", "bánh"].map(
  (item) => normalizeText(item),
);

const FLOATING_TAB_CLEARANCE = TAB_BAR_HEIGHT + 24;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const scrollY = useSharedValue(0);
  const { data: categories = [] } = useCategories();

  const {
    data: exploreData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore({ categoryId: selectedCategory });

  const allPlaces = useMemo(
    () => exploreData?.pages.flatMap((page) => page?.data || []) ?? [],
    [exploreData],
  );

  const categoryTabs = useMemo(() => {
    const normalizedCategories = Array.isArray(categories) ? categories : [];
    return [
      {
        key: "all",
        categoryId: null,
        label: "Tất cả",
        icon: "travel-explore",
      },
      ...normalizedCategories
        .filter((category) => category?.id != null && category?.name)
        .map((category) => ({
          key: String(category.id),
          categoryId: category.id,
          label: category.name,
          icon: getCategoryIcon(category.name),
        })),
    ];
  }, [categories]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory == null) return "Tất cả trải nghiệm";
    const matched = categories.find(
      (category) => String(category?.id) === String(selectedCategory),
    );
    return matched?.name || "Danh mục đã chọn";
  }, [categories, selectedCategory]);

  const featuredPlaces = useMemo(
    () => allPlaces.slice(0, FEATURED_COUNT),
    [allPlaces],
  );

  const popularPlaces = useMemo(
    () => allPlaces.slice(selectedCategory == null ? FEATURED_COUNT : 0),
    [allPlaces, selectedCategory],
  );

  const categoryHeroCopy = useMemo(
    () =>
      selectedCategory == null
        ? "Gợi ý địa điểm nổi bật, ẩm thực và hoạt động phù hợp cho chuyến đi của bạn."
        : `Đang lọc các địa điểm thuộc ${selectedCategoryName}. Chạm vào thẻ để xem chi tiết, ảnh và chỉ đường.`,
    [selectedCategory, selectedCategoryName],
  );

  const resultSummary = useMemo(
    () =>
      allPlaces.length > 0
        ? `${allPlaces.length} địa điểm phù hợp`
        : "Chưa có địa điểm phù hợp",
    [allPlaces],
  );

  const culinaryPlaces = useMemo(() => {
    const matched = allPlaces.filter((place) => {
      const content = normalizeText(
        [
          place?.category?.name,
          place?.name,
          place?.shortDescription,
          place?.description,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return FOOD_HINTS.some((keyword) => content.includes(keyword));
    });

    const source = matched.length >= 3 ? matched : allPlaces;
    return source.slice(0, 3);
  }, [allPlaces]);

  const handlePressPlace = useCallback(
    (place) => {
      const id = place?.id;
      if (id) {
        router.push({ pathname: "/place/[id]", params: { id } });
      }
    },
    [router],
  );

  const handleOpenSearch = useCallback(() => {
    setSearchVisible(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchVisible(false);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId ?? null);
  }, []);

  const handleScroll = useCallback(
    (event) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);

      if (distanceFromBottom <= 240) {
        handleEndReached();
      }
    },
    [handleEndReached],
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, backgroundColor: APPLE_THEME.background },
      ]}
    >
      <StatusBar style="dark" />

      {isLoading && !isRefetching ? (
        <ExploreSkeleton />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: FLOATING_TAB_CLEARANCE },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={APPLE_THEME.focusBlue}
              colors={[APPLE_THEME.focusBlue]}
            />
          }
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
            handleScroll(e);
          }}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <ExploreModernHeader
            user={user}
            onPressSearch={handleOpenSearch}
          />

          {categoryTabs.length > 1 ? (
            <CategoryPills
              categories={categoryTabs}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          ) : null}

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons
                name="explore"
                size={20}
                color={APPLE_THEME.white}
              />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryEyebrow}>{selectedCategoryName}</Text>
              <Text style={styles.summaryTitle}>{resultSummary}</Text>
              <Text style={styles.summaryCopy}>{categoryHeroCopy}</Text>
            </View>
            {selectedCategory != null ? (
              <Pressable
                onPress={() => handleSelectCategory(null)}
                style={styles.clearCategoryButton}
              >
                <Text style={styles.clearCategoryText}>Xóa lọc</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Quick Actions */}
          <ExploreQuickActions
            categories={categories}
            onSelectCategory={handleSelectCategory}
            onOpenSearch={handleOpenSearch}
          />

          {/* Featured carousel */}
          {featuredPlaces.length > 0 ? (
            <FeaturedSection
              places={featuredPlaces}
              onPressPlace={handlePressPlace}
              onPressViewAll={() => handleSelectCategory(null)}
            />
          ) : null}

          {/* Bento culinary */}
          {culinaryPlaces.length >= 3 ? (
            <ExperienceBentoSection
              places={culinaryPlaces}
              onPressPlace={handlePressPlace}
            />
          ) : null}

          {/* Popular list */}
          {popularPlaces.length > 0 ? (
            <PopularSection
              places={popularPlaces}
              onPressPlace={handlePressPlace}
              title={
                selectedCategory == null
                  ? "Địa điểm nên thử"
                  : `Địa điểm ${selectedCategoryName}`
              }
            />
          ) : null}

          {/* Empty state */}
          {allPlaces.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{EMPTY_STATE_TITLE}</Text>
              <Text style={styles.emptyCopy}>
                {selectedCategory == null
                  ? EMPTY_STATE_COPY
                  : "Danh mục này chưa có địa điểm phù hợp. Hãy thử danh mục khác hoặc tìm kiếm theo tên."}
              </Text>
            </View>
          ) : null}

          {/* Loading more */}
          {isFetchingNextPage ? (
            <ActivityIndicator
              color={APPLE_THEME.focusBlue}
              style={styles.loadMore}
            />
          ) : null}
        </Animated.ScrollView>
      )}

      <SearchOverlay visible={searchVisible} onClose={handleCloseSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  summaryCard: {
    marginTop: 12,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 24,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      ios: TOKENS.shadow.sm,
      android: { elevation: 2 },
    }),
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primary,
  },
  summaryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  summaryEyebrow: {
    color: APPLE_THEME.focusBlue,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  summaryTitle: {
    marginTop: 2,
    color: APPLE_THEME.text,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  summaryCopy: {
    marginTop: 4,
    color: APPLE_THEME.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: TOKENS.font.medium,
  },
  clearCategoryButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.borderSoft,
  },
  clearCategoryText: {
    color: APPLE_THEME.text,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
  },
  emptyCopy: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 22,
  },
  loadMore: {
    paddingVertical: 20,
  },
});
