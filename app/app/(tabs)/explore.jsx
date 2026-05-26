import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
    if (selectedCategory == null) return null;
    const matched = categories.find(
      (category) => String(category?.id) === String(selectedCategory),
    );
    return matched?.name || null;
  }, [categories, selectedCategory]);

  const featuredPlaces = useMemo(
    () => allPlaces.slice(0, FEATURED_COUNT),
    [allPlaces],
  );

  const popularPlaces = useMemo(
    () => allPlaces.slice(selectedCategory == null ? FEATURED_COUNT : 0),
    [allPlaces, selectedCategory],
  );

  const culinaryPlaces = useMemo(() => {
    const matched = allPlaces.filter((place) => {
      const textToCheck = `${place?.category?.name || ""} ${place?.name || ""} ${place?.shortDescription || ""}`;
      const content = normalizeText(textToCheck);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const showEmpty = allPlaces.length === 0 && !isLoading;

  /* — Section stagger entrance — */
  const sectionOpacity = useSharedValue(0);

  useEffect(() => {
    if (!isLoading) {
      sectionOpacity.value = 0;
      sectionOpacity.value = withDelay(
        100,
        withTiming(1, { duration: 320 }),
      );
    }
  }, [selectedCategory, isLoading, sectionOpacity]);

  const sectionFadeStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
  }));

  /* — Empty state icon animation — */
  const emptyScale = useSharedValue(0.85);
  const emptyOpacity = useSharedValue(0);

  useEffect(() => {
    if (showEmpty) {
      emptyScale.value = withSpring(1, TOKENS.spring.gentle);
      emptyOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
    } else {
      emptyScale.value = 0.85;
      emptyOpacity.value = 0;
    }
  }, [showEmpty, emptyScale, emptyOpacity]);

  const emptyAnimStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ scale: emptyScale.value }],
  }));

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
            scrollY={scrollY}
          />

          {/* Category Pills */}
          {categoryTabs.length > 1 ? (
            <CategoryPills
              categories={categoryTabs}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          ) : null}

          {/* Inline filter indicator — only when a category is selected */}
          {selectedCategoryName ? (
            <View style={styles.filterIndicator}>
              <View style={styles.filterDot} />
              <Text style={styles.filterText}>
                {selectedCategoryName} · {allPlaces.length} kết quả
              </Text>
              <Pressable
                onPress={() => handleSelectCategory(null)}
                hitSlop={8}
                style={styles.filterClear}
              >
                <MaterialIcons name="close" size={14} color={APPLE_THEME.textMuted} />
              </Pressable>
            </View>
          ) : null}

          {/* Crossfade wrapper for content sections */}
          <Animated.View
            style={sectionFadeStyle}
          >
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
          </Animated.View>

          {/* Empty state — animated */}
          {showEmpty ? (
            <Animated.View style={[styles.emptyState, emptyAnimStyle]}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons
                  name="explore-off"
                  size={40}
                  color={APPLE_THEME.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedCategory == null
                  ? "Chưa có địa điểm nào"
                  : "Không tìm thấy kết quả"}
              </Text>
              <Text style={styles.emptyCopy}>
                {selectedCategory == null
                  ? "Hãy quay lại sau hoặc thử đổi danh mục khác."
                  : "Thử danh mục khác hoặc tìm kiếm theo tên."}
              </Text>
              {selectedCategory != null ? (
                <Pressable
                  onPress={() => handleSelectCategory(null)}
                  style={styles.emptyAction}
                >
                  <Text style={styles.emptyActionText}>Xem tất cả</Text>
                </Pressable>
              ) : null}
            </Animated.View>
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
  /* — Inline filter indicator — */
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(0,113,227,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,113,227,0.12)",
    gap: 8,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APPLE_THEME.focusBlue,
  },
  filterText: {
    flex: 1,
    color: APPLE_THEME.focusBlue,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  filterClear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  /* — Empty state — */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: APPLE_THEME.text,
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyCopy: {
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAction: {
    marginTop: 4,
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primary,
  },
  emptyActionText: {
    color: APPLE_THEME.white,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  loadMore: {
    paddingVertical: 20,
  },
});
