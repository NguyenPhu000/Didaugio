// MAP: ExploreTabScreen
// ├── UI: @/modules/explore/components/{FeaturedSection, ExperienceBentoSection, CategoryPlacesSection, CategoryPlacesSheet, SearchOverlay}
// └── API: @/modules/explore/hooks/useExplore, @/modules/explore/hooks/useCategories

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { isSentryEnabled } from "../../src/config/sentry";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import { useTranslation } from "react-i18next";
import { RefreshControl } from "react-native-gesture-handler";

import {
  useCategories,
  useExplore,
} from "../../src/modules/explore/hooks/useExplore";
import { useAuthStore } from "../../src/stores/authStore";
import { useUIStore } from "../../src/stores/uiStore";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TAB_SCREEN_PADDING } from "./tabTheme";
import {
  normalizeText,
} from "../../src/modules/explore/utils/exploreHelpers";
import {
  buildExploreContentVisibility,
  resolveExploreSheetCategory,
} from "../../src/modules/explore/utils/exploreViewModel";
import { getCategoryIconName } from "../../src/constants/categoryIcons";

import { FeaturedSection } from "../../src/modules/explore/components/FeaturedSection";
import { CategoryPlacesSection } from "../../src/modules/explore/components/CategoryPlacesSection";
import { CategoryPlacesSheet } from "../../src/modules/explore/components/CategoryPlacesSheet";
import { Skeleton } from "../../src/components/ui/Skeleton";
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
import { resolvePlaceImageUri } from "../../src/lib/media-url";
import { EXPLORE_THEME } from "../../src/modules/explore/components/exploreTheme";

import { useSavePlace, useUnsavePlace, useSavedPlaces } from "../../src/modules/saved/hooks/useSaved";
import { showAppAlert } from "../../src/utils/appAlert";
import { useExploreLocation } from "../../src/modules/explore/hooks/useExploreLocation";
import { ExplorePlaceCardHorizontal } from "../../src/modules/explore/components/ExplorePlaceCardHorizontal";
import { SectionHeading } from "../../src/modules/explore/components/cinematic";

const HERO_SKIP_CATEGORIES = ["ẩm thực", "food", "restaurant", "lưu trú", "hotel", "mua sắm", "shopping"].map(normalizeText);

const FLOATING_TAB_CLEARANCE = TAB_BAR_HEIGHT + 24;

const getPlaceRatingValue = (place) => {
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  return Number.isFinite(rating) ? rating : 0;
};

const getPlaceReviewCount = (place) => {
  const reviewCount = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(reviewCount) ? reviewCount : 0;
};

function ExplorePrimaryLoading() {
  return (
    <View style={styles.primaryLoading}>
      <View style={styles.primaryLoadingHeading}>
        <Skeleton width={150} height={24} borderRadius={8} />
        <Skeleton width={52} height={20} borderRadius={999} />
      </View>

      <View style={styles.primaryLoadingCards}>
        <Skeleton width={290} height={360} borderRadius={20} />
        <Skeleton width={180} height={360} borderRadius={20} />
      </View>

      <View style={styles.primaryLoadingHeading}>
        <Skeleton width={138} height={22} borderRadius={8} />
        <Skeleton width={64} height={18} borderRadius={999} />
      </View>

      <View style={styles.primaryLoadingCards}>
        <Skeleton width={216} height={288} borderRadius={18} />
        <Skeleton width={160} height={288} borderRadius={18} />
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const { currentLocation } = useExploreLocation();

  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSheetCategory, setActiveSheetCategory] = useState(null);
  const { data: categories = [] } = useCategories();

  const {
    data: exploreData,
    isLoading,
    isError: isExploreError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore({ categoryId: selectedCategory });

  const { data: events = [], refetch: refetchEvents } = useEvents();

  const {
    data: cmsData,
    isRefetching: isCmsRefetching,
    refetch: refetchCms,
  } = useExploreCms();
  const {
    banners = [],
    featuredPlaces = [],
    sampleTrips = [],
    announcement = null,
  } = cmsData ?? {};

  const [featuredEventsReferenceTime] = useState(Date.now);
  const featuredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    const now = featuredEventsReferenceTime;
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
  }, [events, featuredEventsReferenceTime]);

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
      showAppAlert({
        title: t("explore.toast.loginToSave"),
        message: t("explore.toast.loginToSaveDesc"),
        type: "confirm",
        buttons: [
          { text: t("common.later"), style: "cancel" },
          { text: t("common.login"), onPress: () => router.push("/(auth)/login") },
        ],
      });
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

  const heroPlace = useMemo(() => {
    const featuredCandidates = Array.isArray(featuredPlaces) ? featuredPlaces : [];
    const candidates = [...featuredCandidates, ...allPlaces].filter((place) => resolvePlaceImageUri(place));
    return candidates.find((place) => {
      const category = normalizeText(place?.category?.name || "");
      return !HERO_SKIP_CATEGORIES.some((hint) => category.includes(hint));
    }) || candidates[0] || null;
  }, [featuredPlaces, allPlaces]);

  const categoryTabs = useMemo(() => {
    const normalizedCategories = Array.isArray(categories) ? categories : [];
    return [
      { key: "all", categoryId: null, label: t("explore.categories.all"), icon: "compass-outline" },
      ...normalizedCategories
        .filter((category) => category?.id != null && category?.name)
        .map((category) => ({
          key: String(category.id),
          categoryId: category.id,
          label: category.name,
          icon: getCategoryIconName(category),
        })),
    ];
  }, [categories, t]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory == null) return null;
    const matched = categories.find((category) => String(category?.id) === String(selectedCategory));
    return matched?.name || null;
  }, [categories, selectedCategory]);

  const fullPlacesByCategory = useMemo(() => {
    if (selectedCategory != null) return new Map();

    const categoryMap = new Map();
    for (const place of allPlaces) {
      const catId = place?.category?.id;
      const catName = place?.category?.name;
      if (catId != null && catName) {
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: catId,
            name: catName,
            icon: getCategoryIconName(place.category),
            places: [],
          });
        }
        categoryMap.get(catId).places.push(place);
      }
    }
    return categoryMap;
  }, [allPlaces, selectedCategory]);

  const placesByCategory = useMemo(() => {
    return Array.from(fullPlacesByCategory.values())
      .sort((a, b) => b.places.length - a.places.length)
      .slice(0, 3)
      .map((cat) => ({ ...cat, places: cat.places.slice(0, 8) }));
  }, [fullPlacesByCategory]);

  const handleViewCategoryPlaces = useCallback(
    (category) => {
      setActiveSheetCategory(
        resolveExploreSheetCategory({
          category,
          fullPlacesByCategory,
          allPlaces,
          selectedCategoryName,
        }),
      );
    },
    [fullPlacesByCategory, allPlaces, selectedCategoryName],
  );

  const curatedSections = useMemo(() => {
    if (selectedCategory != null) return [];

    const topRatedPlaces = [...allPlaces]
      .filter((place) => getPlaceRatingValue(place) >= 4.3)
      .sort((a, b) => {
        const ratingDiff = getPlaceRatingValue(b) - getPlaceRatingValue(a);
        if (ratingDiff !== 0) return ratingDiff;
        return getPlaceReviewCount(b) - getPlaceReviewCount(a);
      })
      .slice(0, 8);

    return [
      {
        id: "top-rated",
        title: t("explore.sections.topRated"),
        icon: "star-outline",
        places: topRatedPlaces,
      },
    ].filter((section) => section.places.length >= 3);
  }, [allPlaces, selectedCategory, t]);

  const handlePressPlace = useCallback(
    (place) => {
      if (place?.id) router.push({ pathname: "/place/[id]", params: { id: place.id } });
    },
    [router],
  );

  const handleOpenSearch = useCallback(() => setSearchVisible(true), []);
  const handleCloseSearch = useCallback(() => setSearchVisible(false), []);

  const handleRefresh = useCallback(() => {
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

  const isPrimaryLoading = isLoading && allPlaces.length === 0;
  const showExploreError = isExploreError && allPlaces.length === 0 && !isPrimaryLoading;
  const showEmpty = allPlaces.length === 0 && !isPrimaryLoading && !showExploreError;
  const showEmptyState = showExploreError || showEmpty;

  const exploreReadySpanRef = useRef(null);

  useEffect(() => {
    if (!isSentryEnabled) return undefined;

    const span = Sentry.startInactiveSpan({
      name: "Explore Time to Content",
      op: "ui.load",
    });
    exploreReadySpanRef.current = span;

    return () => {
      if (exploreReadySpanRef.current !== span) return;
      span.end();
      exploreReadySpanRef.current = null;
    };
  }, []);

  useEffect(() => {
    const span = exploreReadySpanRef.current;
    if (!span || isPrimaryLoading) return;

    span.setAttribute(
      "content_state",
      showExploreError ? "error" : showEmpty ? "empty" : "content",
    );
    span.setAttribute("place_count", allPlaces.length);
    span.end();
    exploreReadySpanRef.current = null;
  }, [allPlaces.length, isPrimaryLoading, showEmpty, showExploreError]);

  const { showGlobalContent, showFilteredContent } =
    buildExploreContentVisibility(selectedCategory);

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
    emptyOpacity.value = showEmptyState ? withTiming(1, { duration: 250 }) : 0;
  }, [showEmptyState, emptyOpacity]);

  const emptyAnimStyle = useAnimatedStyle(() => ({ opacity: emptyOpacity.value }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: FLOATING_TAB_CLEARANCE }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isCmsRefetching}
              onRefresh={handleRefresh}
              tintColor={EXPLORE_THEME.river}
              colors={[EXPLORE_THEME.river]}
            />
          }
          onScroll={handleScrollEvent}
          scrollEventThrottle={16}
        >
          <ExploreModernHeader
            heroPlace={heroPlace}
            onPressHero={() => handlePressPlace(heroPlace)}
            onPressMap={() => router.push("/(tabs)/map")}
            onPressSearch={handleOpenSearch}
          />

          {categoryTabs.length > 1 ? (
            <CategoryPills
              categories={categoryTabs}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          ) : null}

          {showGlobalContent && Array.isArray(featuredPlaces) && featuredPlaces.length > 0 ? (
            <FeaturedSection
              places={featuredPlaces}
              onPressPlace={handlePressPlace}
              onSavePlace={handleSavePlace}
              savedPlaceIds={savedPlaceIds}
              userLocation={currentLocation}
            />
          ) : null}

          <View>
            {isPrimaryLoading ? (
              <ExplorePrimaryLoading />
            ) : (
              <>
                {curatedSections.map((section) => (
                  <CategoryPlacesSection
                    key={section.id}
                    categoryName={section.title}
                    categoryId={section.id}
                    places={section.places}
                    onPressPlace={handlePressPlace}
                    onSavePlace={handleSavePlace}
                    savedPlaceIds={savedPlaceIds}
                    userLocation={currentLocation}
                    onPressViewAll={() => handleViewCategoryPlaces(section)}
                  />
                ))}

                {selectedCategory === null && placesByCategory.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    {placesByCategory.map((category) => (
                      <CategoryPlacesSection
                        key={category.id}
                        categoryName={category.name}
                        categoryId={category.id}
                        places={category.places}
                        onPressPlace={handlePressPlace}
                        onSavePlace={handleSavePlace}
                        savedPlaceIds={savedPlaceIds}
                        userLocation={currentLocation}
                        onPressViewAll={() => handleViewCategoryPlaces(category)}
                      />
                    ))}
                  </View>
                ) : null}

                {/* Danh sách địa điểm đầy đủ thông tin khi người dùng lọc theo danh mục */}
                {showFilteredContent && allPlaces.length > 0 ? (
                  <View style={{ marginTop: 22 }}>
                    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                      <SectionHeading
                        title={selectedCategoryName || t("explore.sheet.allPlaces", "Danh sách địa điểm")}
                        right={
                          <Text style={{ fontSize: 12.5, color: EXPLORE_THEME.muted, fontFamily: EXPLORE_THEME.font.medium }}>
                            {allPlaces.length} địa điểm
                          </Text>
                        }
                      />
                    </View>
                    {allPlaces.map((place, idx) => (
                      <ExplorePlaceCardHorizontal
                        key={place?.id != null ? `filtered-${place.id}` : `filtered-${idx}`}
                        place={place}
                        index={idx}
                        userLocation={currentLocation}
                        onPress={() => handlePressPlace(place)}
                        onSave={handleSavePlace}
                        isSaved={savedPlaceIds?.has?.(Number(place?.id)) || false}
                      />
                    ))}
                  </View>
                ) : null}

                {/* Gợi ý điểm đến tiêu biểu đầy đủ thông tin trên trang chủ Explore */}
                {showGlobalContent && allPlaces.length > 0 ? (
                  <View style={{ marginTop: 24 }}>
                    <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                      <SectionHeading
                        title={t("explore.sections.recommendedForYou", "Gợi ý dành cho bạn")}
                      />
                    </View>
                    {allPlaces.slice(0, 6).map((place, idx) => (
                      <ExplorePlaceCardHorizontal
                        key={place?.id != null ? `rec-${place.id}` : `rec-${idx}`}
                        place={place}
                        index={idx}
                        userLocation={currentLocation}
                        onPress={() => handlePressPlace(place)}
                        onSave={handleSavePlace}
                        isSaved={savedPlaceIds?.has?.(Number(place?.id)) || false}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}

            <AnnouncementBanner announcement={announcement} />

            {showGlobalContent && banners.length > 0 ? (
              <CmsBannerCarousel banners={banners} onPressBanner={handlePressBanner} />
            ) : null}

            {showGlobalContent && featuredEvents.length > 0 ? (
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

            {showGlobalContent ? (
              <SampleTripSection
                sampleTrips={sampleTrips}
                onPressTrip={handlePressTrip}
                onPressViewAll={() => router.push("/(tabs)/trips")}
              />
            ) : null}

            {showGlobalContent && regularEvents.length > 0 ? (
              <EventSection events={regularEvents} onPressEvent={handlePressEvent} />
            ) : null}
          </View>

          {showExploreError ? (
            <Animated.View style={[styles.emptyContainer, emptyAnimStyle]}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIconsRounded name="cloud-off" size={32} color={EXPLORE_THEME.muted} />
              </View>
              <Text style={styles.emptyTitle}>{t("explore.error.title")}</Text>
              <Text style={styles.emptyDesc}>{t("explore.error.description")}</Text>
              <Pressable
                haptic="none"
                onPress={refetch}
                style={styles.emptyActionBtn}
                accessibilityRole="button"
                accessibilityLabel={t("explore.error.retry")}
              >
                <Text style={styles.emptyActionText}>{t("explore.error.retry")}</Text>
              </Pressable>
            </Animated.View>
          ) : showEmpty ? (
            <Animated.View style={[styles.emptyContainer, emptyAnimStyle]}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIconsRounded name="explore-off" size={32} color={EXPLORE_THEME.muted} />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedCategory == null ? t("explore.empty.noPlaces") : t("explore.empty.noResults")}
              </Text>
              <Text style={styles.emptyDesc}>
                {selectedCategory == null ? t("explore.empty.noPlacesDesc") : t("explore.empty.noResultsDesc")}
              </Text>
              {selectedCategory != null ? (
                <Pressable haptic="none" onPress={() => handleSelectCategory(null)} style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionText}>{t("common.viewAll")}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}

          {isFetchingNextPage ? (
            <View style={styles.loadingMoreWrapper}>
              <ActivityIndicator color={EXPLORE_THEME.river} />
            </View>
          ) : null}
      </Animated.ScrollView>

      <SearchOverlay visible={searchVisible} onClose={handleCloseSearch} />

      <CategoryPlacesSheet
        visible={!!activeSheetCategory}
        category={activeSheetCategory}
        places={activeSheetCategory?.places || []}
        onClose={() => setActiveSheetCategory(null)}
        onPressPlace={handlePressPlace}
        onSavePlace={handleSavePlace}
        savedPlaceIds={savedPlaceIds}
        userLocation={currentLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EXPLORE_THEME.background,
  },
  scrollContent: {
    paddingTop: 4,
  },
  primaryLoading: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 16,
  },
  primaryLoadingHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryLoadingCards: {
    flexDirection: "row",
    gap: 12,
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
    backgroundColor: EXPLORE_THEME.sand,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: EXPLORE_THEME.font.bold,
    color: EXPLORE_THEME.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: EXPLORE_THEME.font.medium,
    color: EXPLORE_THEME.muted,
    textAlign: "center",
  },
  emptyActionBtn: {
    marginTop: 12,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: EXPLORE_THEME.river,
  },
  emptyActionText: {
    color: EXPLORE_THEME.surface,
    fontSize: 14,
    fontFamily: EXPLORE_THEME.font.semibold,
  },
  loadingMoreWrapper: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
