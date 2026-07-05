import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native-gesture-handler";

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
import { CategoryPlacesSection } from "../../src/modules/explore/components/CategoryPlacesSection";
import { ExploreSkeleton } from "../../src/modules/explore/components/ExploreSkeleton";
import { SearchOverlay } from "../../src/modules/explore/components/SearchOverlay";
import { ExploreModernHeader } from "../../src/modules/explore/components/ExploreModernHeader";
import { CategoryPills } from "../../src/modules/explore/components/CategoryPills";
import { useEvents } from "../../src/modules/explore/hooks/useEvents";
import { EventSection } from "../../src/modules/explore/components/EventSection";
import { FeaturedEventCampaignCard } from "../../src/modules/explore/components/FeaturedEventCampaignCard";

import { useExploreCms } from "../../src/modules/explore/hooks/useExploreCms";
import { CmsBannerCarousel } from "../../src/modules/explore/components/CmsBannerCarousel";
import { SampleTripSection } from "../../src/modules/explore/components/SampleTripSection";
import { AnnouncementBanner } from "../../src/modules/explore/components/AnnouncementBanner";

import { BlurCarousel } from "../../src/components/reacticx/blur-carousel";

import { useSavePlace, useUnsavePlace, useSavedPlaces } from "../../src/modules/saved/hooks/useSaved";

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

  const { data: events = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useEvents();

  const {
    data: cmsData,
    isLoading: isLoadingCms,
    isRefetching: isCmsRefetching,
    refetch: refetchCms,
  } = useExploreCms();
  const {
    banners = [],
    featuredPlaces = [],
    sampleTrips = [],
    announcement = null,
  } = cmsData ?? {};

  const featuredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    const now = Date.now();
    return events
      .filter((e) => e?.isFeaturedBanner)
      .sort((a, b) => {
        // Ưu tiên sự kiện đang diễn ra lên đầu
        const aOngoing = new Date(a.startDate).getTime() <= now && now <= new Date(a.endDate).getTime();
        const bOngoing = new Date(b.startDate).getTime() <= now && now <= new Date(b.endDate).getTime();
        if (aOngoing && !bOngoing) return -1;
        if (!aOngoing && bOngoing) return 1;
        // Sau đó theo startDate tăng dần
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }, [events]);

  const regularEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.filter((e) => !e?.isFeaturedBanner);
  }, [events]);

  const handlePressEvent = useCallback((eventItem) => {
    if (eventItem?.id) {
      router.push({ pathname: "/event/[id]", params: { id: eventItem.id } });
    }
  }, [router]);

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
        useUIStore.getState().addToast({ type: "success", message: t("explore.toast.unsaved") });
      } else {
        await saveMutation.mutateAsync({ placeId });
        useUIStore.getState().addToast({ type: "success", message: t("explore.toast.saved") });
      }
    } catch {
      useUIStore.getState().addToast({
        type: "error",
        message: isCurrentlySaved ? t("explore.toast.unsaveFailed") : t("explore.toast.saveFailed"),
      });
    }
  }, [isLoggedIn, savedPlaceIds, saveMutation, unsaveMutation, router, t]);

  const allPlaces = useMemo(
    () => exploreData?.pages.flatMap((page) => page?.data || []) ?? [],
    [exploreData],
  );

  const categoryTabs = useMemo(() => {
    const normalizedCategories = Array.isArray(categories) ? categories : [];
    return [
      { key: "all", categoryId: null, label: t("explore.categories.all"), icon: "travel-explore" },
      ...normalizedCategories
        .filter((category) => category?.id != null && category?.name)
        .map((category) => ({
          key: String(category.id),
          categoryId: category.id,
          label: category.name,
          icon: getCategoryIcon(category.name),
        })),
    ];
  }, [categories, t]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory == null) return null;
    const matched = categories.find((category) => String(category?.id) === String(selectedCategory));
    return matched?.name || null;
  }, [categories, selectedCategory]);

  const popularPlaces = allPlaces;

  const placesByCategory = useMemo(() => {
    if (selectedCategory != null) return [];

    const categoryMap = new Map();
    for (const place of allPlaces) {
      const catId = place?.category?.id;
      const catName = place?.category?.name;
      if (catId != null && catName) {
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { id: catId, name: catName, icon: getCategoryIcon(catName), places: [] });
        }
        categoryMap.get(catId).places.push(place);
      }
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => b.places.length - a.places.length)
      .map((cat) => ({ ...cat, places: cat.places.slice(0, 8) }));
  }, [allPlaces, selectedCategory]);

  const handleViewCategoryPlaces = useCallback(
    (category) => {
      router.push({ pathname: "/explore/category-places", params: { id: category.id, name: category.name } });
    },
    [router],
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
      if (place?.id) router.push({ pathname: "/place/[id]", params: { id: place.id } });
    },
    [router],
  );

  const handleOpenSearch = useCallback(() => setSearchVisible(true), []);
  const handleCloseSearch = useCallback(() => setSearchVisible(false), []);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
    refetchEvents();
    refetchCms();
  }, [refetch, refetchEvents, refetchCms]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId ?? null);
  }, []);

  const handleScroll = useCallback(
    (event) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (contentSize.height - (layoutMeasurement.height + contentOffset.y) <= 240) {
        handleEndReached();
      }
    },
    [handleEndReached],
  );

  const handleScrollEvent = useCallback((e) => {
    handleScroll(e);
  }, [handleScroll]);

  const handlePressTrip = useCallback((trip) => {
    if (trip?.id) router.push({ pathname: "/trip/[id]", params: { id: trip.id } });
  }, [router]);

  const handlePressBanner = useCallback((banner) => {
    const linkType = banner?.linkType;
    const linkValue = banner?.linkValue;
    if (!linkType || linkType === "none" || !linkValue) return;

    if (linkType === "place") {
      router.push({ pathname: "/place/[id]", params: { id: linkValue } });
      return;
    }
    if (linkType === "event") {
      router.push({ pathname: "/event/[id]", params: { id: linkValue } });
      return;
    }
    if (linkType === "trip") {
      router.push({ pathname: "/trip/[id]", params: { id: linkValue } });
      return;
    }
    if (linkType === "url") {
      Linking.openURL(String(linkValue)).catch(() => {
        useUIStore.getState().addToast({ type: "error", message: t("common.operationFailed") });
      });
    }
  }, [router, t]);

  const isInitialLoading = isLoading || isLoadingEvents || isLoadingCms;
  const showEmpty = allPlaces.length === 0 && !isInitialLoading;

  const { width: screenWidth } = useWindowDimensions();

  const renderEventBanner = useCallback(
    ({ item: event }) => {
      return (
        <FeaturedEventCampaignCard
          event={event}
          width="100%"
          onPress={handlePressEvent}
        />
      );
    },
    [handlePressEvent],
  );

  const emptyOpacity = useSharedValue(0);

  useEffect(() => {
    emptyOpacity.value = showEmpty ? withTiming(1, { duration: 250 }) : 0;
  }, [showEmpty, emptyOpacity]);

  const emptyAnimStyle = useAnimatedStyle(() => ({ opacity: emptyOpacity.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {isInitialLoading && !isRefetching ? (
        <ExploreSkeleton />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: FLOATING_TAB_CLEARANCE }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isCmsRefetching}
              onRefresh={handleRefresh}
              tintColor={APPLE_THEME.focusBlue}
              colors={[APPLE_THEME.focusBlue]}
            />
          }
          onScroll={handleScrollEvent}
          scrollEventThrottle={16}
        >
          <ExploreModernHeader user={user} onPressSearch={handleOpenSearch} />

          {categoryTabs.length > 1 ? (
            <CategoryPills
              categories={categoryTabs}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          ) : null}

          <AnnouncementBanner announcement={announcement} />

          {selectedCategory === null ? (
            <CmsBannerCarousel banners={banners} onPressBanner={handlePressBanner} />
          ) : null}

          {selectedCategory === null && featuredEvents.length > 0 ? (
            <View style={{ marginTop: 12, marginBottom: 4 }}>
              <BlurCarousel
                data={featuredEvents}
                renderItem={renderEventBanner}
                itemWidth={screenWidth - 32}
                horizontalSpacing={16}
                spacing={6}
              />
            </View>
          ) : null}

          {selectedCategoryName ? (
            <View style={styles.filterPill}>
              <View style={styles.filterDot} />
              <Text style={styles.filterText}>
                {selectedCategoryName} · {t("explore.results", { count: allPlaces.length })}
              </Text>
              <Pressable
                haptic="light"
                onPress={() => handleSelectCategory(null)}
                hitSlop={8}
                style={styles.filterCloseBtn}
              >
                <MaterialIconsRounded name="close" size={14} color={APPLE_THEME.text} />
              </Pressable>
            </View>
          ) : null}

          <View>
            {featuredPlaces.length > 0 ? (
              <FeaturedSection
                places={featuredPlaces}
                onPressPlace={handlePressPlace}
                onSavePlace={handleSavePlace}
                savedPlaceIds={savedPlaceIds}
              />
            ) : null}

            <SampleTripSection sampleTrips={sampleTrips} onPressTrip={handlePressTrip} />

            {selectedCategory === null && regularEvents.length > 0 ? (
              <EventSection events={regularEvents} onPressEvent={handlePressEvent} />
            ) : null}

            {culinaryPlaces.length >= 3 ? (
              <ExperienceBentoSection places={culinaryPlaces} onPressPlace={handlePressPlace} />
            ) : null}

            {selectedCategory === null && placesByCategory.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                {placesByCategory.map((category) => (
                  <CategoryPlacesSection
                    key={category.id}
                    categoryName={category.name}
                    categoryId={category.id}
                    places={category.places}
                    icon={category.icon}
                    onPressPlace={handlePressPlace}
                    onPressViewAll={() => handleViewCategoryPlaces(category)}
                  />
                ))}
              </View>
            ) : null}

            {selectedCategory != null && popularPlaces.length > 0 ? (
              <CategoryPlacesSection
                categoryName={selectedCategoryName}
                categoryId={selectedCategory}
                places={popularPlaces.slice(0, 8)}
                onPressPlace={handlePressPlace}
                onPressViewAll={() =>
                  handleViewCategoryPlaces({ id: selectedCategory, name: selectedCategoryName })
                }
              />
            ) : null}
          </View>

          {showEmpty ? (
            <Animated.View style={[styles.emptyContainer, emptyAnimStyle]}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIconsRounded name="explore-off" size={32} color={APPLE_THEME.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedCategory == null ? t("explore.empty.noPlaces") : t("explore.empty.noResults")}
              </Text>
              <Text style={styles.emptyDesc}>
                {selectedCategory == null ? t("explore.empty.noPlacesDesc") : t("explore.empty.noResultsDesc")}
              </Text>
              {selectedCategory != null ? (
                <Pressable haptic="light" onPress={() => handleSelectCategory(null)} style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionText}>{t("common.viewAll")}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}

          {isFetchingNextPage ? (
            <View style={styles.loadingMoreWrapper}>
              <ActivityIndicator color={APPLE_THEME.focusBlue} />
            </View>
          ) : null}
        </Animated.ScrollView>
      )}

      <SearchOverlay visible={searchVisible} onClose={handleCloseSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPLE_THEME.background,
  },
  scrollContent: {
    paddingTop: 4,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 999,
    backgroundColor: APPLE_THEME.surfaceMuted,
    gap: 10,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APPLE_THEME.focusBlue,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: APPLE_THEME.text,
    letterSpacing: -0.2,
  },
  filterCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceMuted,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.bold,
    color: APPLE_THEME.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: TOKENS.font.medium,
    color: APPLE_THEME.textMuted,
    textAlign: "center",
  },
  emptyActionBtn: {
    marginTop: 12,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.text,
  },
  emptyActionText: {
    color: APPLE_THEME.white,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  loadingMoreWrapper: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
