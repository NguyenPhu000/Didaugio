import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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

import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { useAuthStore } from "../../src/stores/authStore";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TAB_SCREEN_PADDING } from "./tabTheme";
import { normalizeText } from "../../src/modules/explore/utils/exploreHelpers";

import { FeaturedSection } from "../../src/modules/explore/components/FeaturedSection";
import { ExperienceBentoSection } from "../../src/modules/explore/components/ExperienceBentoSection";
import { PopularSection } from "../../src/modules/explore/components/PopularSection";
import { ExploreSkeleton } from "../../src/modules/explore/components/ExploreSkeleton";
import { SearchOverlay } from "../../src/modules/explore/components/SearchOverlay";
import { ExploreModernHeader } from "../../src/modules/explore/components/ExploreModernHeader";
import { ExploreQuickActions } from "../../src/modules/explore/components/ExploreQuickActions";

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
  const scrollY = useSharedValue(0);

  const {
    data: exploreData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore({});

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
          scrollEventThrottle={8}
        >
          {/* Header */}
          <ExploreModernHeader
            user={user}
            onPressSearch={handleOpenSearch}
          />

          {/* Quick Actions */}
          <ExploreQuickActions />

          {/* Featured carousel */}
          {featuredPlaces.length > 0 ? (
            <FeaturedSection
              places={featuredPlaces}
              onPressPlace={handlePressPlace}
              onPressViewAll={() =>
                router.push({
                  pathname: "/explore/category/[id]",
                  params: { id: "all" },
                })
              }
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
              title="Tour gợi ý"
            />
          ) : null}

          {/* Empty state */}
          {allPlaces.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{EMPTY_STATE_TITLE}</Text>
              <Text style={styles.emptyCopy}>{EMPTY_STATE_COPY}</Text>
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
