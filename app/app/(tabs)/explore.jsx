import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import {
  useExplore,
  useCategories,
} from "../../src/modules/explore/hooks/useExplore";
import { useAuthStore } from "../../src/stores/authStore";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import {
  getCategoryIcon,
  getUserName,
  normalizeText,
} from "../../src/modules/explore/utils/exploreHelpers";
import GradientBackground from "../../src/components/ui/GradientBackground";

import { ExploreHeader } from "../../src/modules/explore/components/ExploreHeader";
import { ExploreSearchBar } from "../../src/modules/explore/components/ExploreSearchBar";
import { CategoryPills } from "../../src/modules/explore/components/CategoryPills";
import { FeaturedSection } from "../../src/modules/explore/components/FeaturedSection";
import { ExperienceBentoSection } from "../../src/modules/explore/components/ExperienceBentoSection";
import { PopularSection } from "../../src/modules/explore/components/PopularSection";
import { ExploreSkeleton } from "../../src/modules/explore/components/ExploreSkeleton";
import { SearchOverlay } from "../../src/modules/explore/components/SearchOverlay";

const PAD = 24;
const FEATURED_COUNT = 6;
const TEXT_COLOR = "#191C1E";
const TEXT_MUTED = "#54647A";
const PRIMARY = "#101E2C";
const ALL_CATEGORY_LABEL = "Tất cả";
const HERO_TITLE_PREFIX = "Chào mừng đến với";
const HERO_TITLE_HIGHLIGHT = "Tây Đô";
const HERO_COPY = "Khám phá vẻ đẹp hữu tình của vùng đất Cửu Long.";
const EMPTY_STATE_TITLE = "Chưa có địa điểm nào";
const EMPTY_STATE_COPY = "Hãy quay lại sau hoặc thử đổi danh mục khác.";
const FOOD_HINTS = ["ẩm thực", "food", "restaurant", "ăn", "quán", "bánh"].map(
  (item) => normalizeText(item),
);

const FLOATING_TAB_CLEARANCE = TAB_BAR_HEIGHT + 24;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const isCompactHero = viewportWidth <= 360;

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

  const featuredPlaces = useMemo(
    () => allPlaces.slice(0, FEATURED_COUNT),
    [allPlaces],
  );

  const popularPlaces = useMemo(
    () => allPlaces.slice(FEATURED_COUNT),
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

  const categoryPillData = useMemo(() => {
    const allPill = {
      key: "all",
      categoryId: null,
      label: ALL_CATEGORY_LABEL,
      icon: "explore",
    };
    const pills = categories.map((cat) => ({
      key: `cat-${cat.id}`,
      categoryId: cat.id,
      label: cat.name,
      icon: getCategoryIcon(cat.name),
    }));
    return [allPill, ...pills];
  }, [categories]);

  const greetingName = useMemo(() => getUserName(user), [user]);

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

  const handleSelectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    <GradientBackground
      variant="ocean"
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <StatusBar style="dark" />

      <View pointerEvents="none" style={styles.ambientWrap}>
        <View style={styles.ambientOrbA} />
        <View style={styles.ambientOrbB} />
        <View style={styles.ambientOrbC} />
      </View>

      {isLoading && !isRefetching ? (
        <ExploreSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: FLOATING_TAB_CLEARANCE },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.padH}>
            <ExploreHeader user={user} />
          </View>

          <View style={styles.padH}>
            <View
              style={[
                styles.heroCard,
                isCompactHero ? styles.heroCardCompact : null,
              ]}
            >
              <View style={styles.heroGreetingPill}>
                <Text style={styles.heroGreetingText} numberOfLines={1}>
                  {`Xin chào, ${greetingName}`}
                </Text>
              </View>

              <Text
                style={[
                  styles.heroTitlePrefix,
                  isCompactHero ? styles.heroTitlePrefixCompact : null,
                ]}
              >
                {HERO_TITLE_PREFIX}
              </Text>

              <Text
                style={[
                  styles.heroTitleHighlight,
                  isCompactHero ? styles.heroTitleHighlightCompact : null,
                ]}
              >
                {HERO_TITLE_HIGHLIGHT}
              </Text>

              <Text
                style={[
                  styles.heroCopy,
                  isCompactHero ? styles.heroCopyCompact : null,
                ]}
              >
                {HERO_COPY}
              </Text>
            </View>

            <View style={styles.searchCard}>
              <ExploreSearchBar onPress={handleOpenSearch} />
            </View>
          </View>

          <View style={styles.pillsWrap}>
            <CategoryPills
              categories={categoryPillData}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          </View>

          {featuredPlaces.length > 0 ? (
            <FeaturedSection
              places={featuredPlaces}
              onPressPlace={handlePressPlace}
              onPressViewAll={handleOpenSearch}
            />
          ) : null}

          {culinaryPlaces.length >= 3 ? (
            <ExperienceBentoSection
              places={culinaryPlaces}
              onPressPlace={handlePressPlace}
            />
          ) : null}

          {popularPlaces.length > 0 ? (
            <PopularSection
              places={popularPlaces}
              onPressPlace={handlePressPlace}
              title="Tour gợi ý"
            />
          ) : null}

          {allPlaces.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{EMPTY_STATE_TITLE}</Text>
              <Text style={styles.emptyCopy}>{EMPTY_STATE_COPY}</Text>
            </View>
          ) : null}

          {isFetchingNextPage ? (
            <ActivityIndicator color={PRIMARY} style={styles.loadMore} />
          ) : null}
        </ScrollView>
      )}

      <SearchOverlay visible={searchVisible} onClose={handleCloseSearch} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientOrbA: {
    position: "absolute",
    top: 64,
    left: -78,
    width: 224,
    height: 224,
    borderRadius: 999,
    backgroundColor: "rgba(82,96,112,0.12)",
  },
  ambientOrbB: {
    position: "absolute",
    top: 220,
    right: -84,
    width: 234,
    height: 234,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  ambientOrbC: {
    position: "absolute",
    bottom: 140,
    left: 46,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(208,225,251,0.44)",
  },
  scrollContent: {
    paddingTop: 10,
  },
  padH: {
    paddingHorizontal: PAD,
  },
  heroCard: {
    marginTop: 14,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.42)",
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 5,
  },
  heroCardCompact: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroGreetingPill: {
    alignSelf: "flex-start",
    height: 26,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242,244,246,0.9)",
  },
  heroGreetingText: {
    color: "#3A4858",
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: TOKENS.font.semibold,
  },
  heroTitlePrefix: {
    color: TEXT_COLOR,
    marginTop: 10,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontFamily: TOKENS.font.heading,
  },
  heroTitlePrefixCompact: {
    fontSize: 24,
    lineHeight: 28,
  },
  heroTitleHighlight: {
    marginTop: 1,
    color: PRIMARY,
    fontSize: 42,
    lineHeight: 45,
    letterSpacing: -1,
    fontFamily: TOKENS.font.heading,
  },
  heroTitleHighlightCompact: {
    fontSize: 36,
    lineHeight: 39,
  },
  heroCopy: {
    marginTop: 6,
    color: "#44474C",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: TOKENS.font.body,
    maxWidth: "100%",
  },
  heroCopyCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchCard: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.42)",
    padding: 8,
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  pillsWrap: {
    paddingLeft: PAD,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    color: TEXT_COLOR,
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
  },
  emptyCopy: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    textAlign: "center",
    lineHeight: 22,
  },
  loadMore: {
    paddingVertical: 20,
  },
});
