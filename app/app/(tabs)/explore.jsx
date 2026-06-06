import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

import {
  useCategories,
  useExplore,
} from "../../src/modules/explore/hooks/useExplore";
import { useAuthStore } from "../../src/stores/authStore";
import { useUIStore } from "../../src/stores/uiStore";
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

// Event components
import { useEvents } from "../../src/modules/explore/hooks/useEvents";
import { EventBannerCarousel } from "../../src/modules/explore/components/EventBannerCarousel";
import { EventSection } from "../../src/modules/explore/components/EventSection";

// Save/favorite hooks
import { useSavePlace, useUnsavePlace, useSavedPlaces } from "../../src/modules/saved/hooks/useSaved";


const FEATURED_COUNT = 6;
const FOOD_HINTS = ["ẩm thực", "food", "restaurant", "ăn", "quán", "bánh"].map(
  (item) => normalizeText(item),
);

const FLOATING_TAB_CLEARANCE = TAB_BAR_HEIGHT + 84;

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);

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

  const { data: events = [], refetch: refetchEvents } = useEvents();

  const featuredEvents = useMemo(() => {
    return Array.isArray(events) ? events.filter((e) => e?.isFeaturedBanner) : [];
  }, [events]);

  const regularEvents = useMemo(() => {
    return Array.isArray(events) ? events.filter((e) => !e?.isFeaturedBanner) : [];
  }, [events]);

  const handlePressEvent = useCallback((eventItem) => {
    if (eventItem?.id) {
      router.push({ pathname: "/event/[id]", params: { id: eventItem.id } });
    }
  }, [router]);

  // Save/favorite functionality
  const isLoggedIn = !!user && !isGuest;
  const { data: savedPlaces = [] } = useSavedPlaces(isLoggedIn);
  const saveMutation = useSavePlace();
  const unsaveMutation = useUnsavePlace();

  const savedPlaceIds = useMemo(() => {
    const ids = new Set();
    for (const item of savedPlaces) {
      const placeId = item?.placeId ?? item?.place?.id ?? item?.id;
      if (placeId != null) ids.add(Number(placeId));
    }
    return ids;
  }, [savedPlaces]);

  const handleSavePlace = useCallback(async (place) => {
    if (!isLoggedIn) {
      Alert.alert(t("explore.toast.loginToSave"), t("explore.toast.loginToSaveDesc"), [
        { text: t("common.later"), style: "cancel" },
        { text: t("common.login"), onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    if (!place?.id) return;
    const placeId = Number(place.id);
    const isCurrentlySaved = savedPlaceIds.has(placeId);

    try {
      if (isCurrentlySaved) {
        await unsaveMutation.mutateAsync(placeId);
        useUIStore.getState().addToast({
          type: "success",
          message: t("explore.toast.unsaved"),
        });
      } else {
        await saveMutation.mutateAsync({ placeId });
        useUIStore.getState().addToast({
          type: "success",
          message: t("explore.toast.saved"),
        });
      }
    } catch {
      useUIStore.getState().addToast({
        type: "error",
        message: isCurrentlySaved ? t("explore.toast.unsaveFailed") : t("explore.toast.saveFailed"),
      });
    }
  }, [isLoggedIn, savedPlaceIds, saveMutation, unsaveMutation, router]);

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
        label: t("explore.categories.all"),
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
    refetchEvents();
  }, [refetch, refetchEvents]);

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

  // Removed laggy section transition animation for instant rendering performance

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
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: APPLE_THEME.background }}
    >
      <StatusBar style="dark" />

      {isLoading && !isRefetching ? (
        <ExploreSkeleton />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: FLOATING_TAB_CLEARANCE }}
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

          {/* Event Banner Carousel */}
          {selectedCategory === null && featuredEvents.length > 0 ? (
            <EventBannerCarousel
              events={featuredEvents}
              onPressEvent={handlePressEvent}
            />
          ) : null}

          {/* Inline filter indicator — only when a category is selected */}
          {selectedCategoryName ? (
            <View className="flex-row items-center mx-5 mt-2.5 px-3.5 h-9 rounded-full bg-[#0071E3]/[0.06] border border-[#0071E3]/[0.12] gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
              <Text className="flex-1 text-[#0071E3] text-[13px] font-semibold">
                {selectedCategoryName} · {t("explore.results", { count: allPlaces.length })}
              </Text>
              <Pressable
                onPress={() => handleSelectCategory(null)}
                hitSlop={8}
                className="w-5.5 h-5.5 rounded-full items-center justify-center bg-black/[0.06]"
              >
                <MaterialIconsRounded name="close" size={14} color={APPLE_THEME.textMuted} />
              </Pressable>
            </View>
          ) : null}

          {/* Wrapper for content sections */}
          <View>
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
                onSavePlace={handleSavePlace}
                savedPlaceIds={savedPlaceIds}
              />
            ) : null}

            {/* Event Section */}
            {selectedCategory === null && regularEvents.length > 0 ? (
              <EventSection
                events={regularEvents}
                onPressEvent={handlePressEvent}
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
                    ? t("explore.recommended")
                    : t("explore.placesInCategory", { category: selectedCategoryName })
                }
              />
            ) : null}
          </View>

          {/* Empty state — animated */}
          {showEmpty ? (
            <Animated.View style={emptyAnimStyle} className="items-center justify-center py-15 px-10 gap-3">
              <View className="w-18 h-18 rounded-full bg-black/[0.04] items-center justify-center mb-1">
                <MaterialIconsRounded
                  name="explore-off"
                  size={40}
                  color={APPLE_THEME.textMuted}
                />
              </View>
              <Text className="text-[#1D1D1F] text-[18px] font-semibold tracking-tight text-center">
                {selectedCategory == null
                  ? t("explore.empty.noPlaces")
                  : t("explore.empty.noResults")}
              </Text>
              <Text className="text-black/48 text-[14px] text-center leading-[22px]">
                {selectedCategory == null
                  ? t("explore.empty.noPlacesDesc")
                  : t("explore.empty.noResultsDesc")}
              </Text>
              {selectedCategory != null ? (
                <Pressable
                  onPress={() => handleSelectCategory(null)}
                  className="mt-1 h-9 px-5 rounded-full items-center justify-center bg-[#1D1D1F]"
                >
                  <Text className="text-white text-[14px] font-semibold">{t("common.viewAll")}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Loading more */}
          {isFetchingNextPage ? (
            <ActivityIndicator
              color={APPLE_THEME.focusBlue}
              className="py-5"
            />
          ) : null}
        </Animated.ScrollView>
      )}

      <SearchOverlay visible={searchVisible} onClose={handleCloseSearch} />
    </View>
  );
}
