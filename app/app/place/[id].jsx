  import { useCallback, useEffect, useMemo, useRef, useState } from "react";
  import {
    Alert,
    FlatList,
    Linking,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
  } from "react-native";
  import Animated, { FadeInDown } from "react-native-reanimated";
  import { useLocalSearchParams, useRouter } from "expo-router";
  import { Image } from "expo-image";
  import { MaterialCommunityIcons } from "@expo/vector-icons";
  import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
  import BottomSheet from "@gorhom/bottom-sheet";
  import { useSafeAreaInsets } from "react-native-safe-area-context";
  import { BlurView } from "expo-blur";
  import * as Speech from "expo-speech";
  import {
    useCreateReview,
    usePlaceDetail,
    useMyPlaceReview,
    usePlaceReviews,
  } from "../../src/modules/place/hooks/usePlaceDetail";
  import { useUIStore } from "../../src/stores/uiStore";
  import {
    useSavePlace,
    useUnsavePlace,
  } from "../../src/modules/saved/hooks/useSaved";
  import {
    OpeningHours,
    DetailRow,
  } from "../../src/modules/place/components/PlaceDetailComponents";
  import { useAuthStore } from "../../src/stores/authStore";
  import { TOKENS } from "../../src/constants/design-tokens";
  import { Skeleton } from "../../src/components/ui/Skeleton";
  import {
    resolveMediaUrl,
    getCategoryPlaceholder,
  } from "../../src/lib/media-url";
  import { useTranslation } from "react-i18next";
  import {
    formatPriceLine,
    getPlaceLocation,
  } from "../../src/modules/explore/utils/exploreHelpers";
  import { getCategoryIconName } from "../../src/constants/categoryIcons";
  import {
    PALETTE,
    formatReviewCount,
  } from "../../src/modules/place/constants/placeSheetConstants";
  import { TripSelectorSheet } from "../../src/modules/place/components/TripSelectorSheet";
  import { ReviewComposerSheetContent } from "../../src/modules/place/components/ReviewComposerSheet";
  import {
    AllReviewsSheetContent,
    ReviewCard,
  } from "../../src/modules/place/components/AllReviewsSheet";
  import { cn } from "../../src/lib/cn";
  import SpokenGuideSection from "../../src/modules/place/components/SpokenGuideSection";
  import {
    getSpeechText,
    shouldShowBookingCta,
  } from "../../src/modules/place/utils/spokenGuide";
  import { getReviewSubmissionError } from "../../src/modules/place/utils/reviewSubmissionError";

  const MAIN_REVIEW_LIMIT = 2;
  const MAX_GALLERY_IMAGES = 8;
  // A compact editorial crop keeps the place recognizable while exposing the
  // identity and first action above the fold on normal phone screens.
  const HERO_ASPECT = 0.68;
  const HERO_MIN = 300;
  const HERO_MAX = 360;

  const ICON_BUTTON_SHADOW = TOKENS.shadow.md;
  const BOTTOM_BAR_SHADOW = TOKENS.shadow.lg;
  const INTRO_SPEECH_KEY = "intro";

  const SHEET_BACKGROUND = {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: PALETTE.border,
  };

  const SHEET_INDICATOR = {
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    width: 36,
  };

  function getAddressLine(place) {
    return [place?.address, place?.ward?.name, place?.district?.name]
      .filter(Boolean)
      .join(", ");
  }

  function getTodayHours(hours) {
    const today = new Date().getDay();
    return hours?.find((item) => item.dayOfWeek === today);
  }

  function getTodayHoursLabel(hours, t) {
    const todayHours = getTodayHours(hours);
    if (!todayHours) return t("place.detail.updatedLater");
    if (todayHours.isClosed) return t("place.detail.closedToday");
    if (todayHours.openTime && todayHours.closeTime) {
      return `${todayHours.openTime} - ${todayHours.closeTime}`;
    }
    return t("place.detail.updatedLater");
  }

  function getOpenState(hours, t) {
    const todayHours = getTodayHours(hours);
    if (!todayHours) {
      return {
        label: t("place.detail.pendingUpdate"),
        color: PALETTE.warning,
        icon: "schedule",
      };
    }
    if (todayHours.isClosed) {
      return {
        label: t("place.detail.closedToday"),
        color: "#EF4444",
        icon: "do-not-disturb-on",
      };
    }
    return {
      label: t("place.detail.openToday"),
      color: PALETTE.success,
      icon: "schedule",
    };
  }

  const PRICE_RANGE_I18N_KEYS = {
    FREE: "place.priceRange.free",
    BUDGET: "place.priceRange.budget",
    MODERATE: "place.priceRange.moderate",
    EXPENSIVE: "place.priceRange.expensive",
    LUXURY: "place.priceRange.luxury",
  };

  function formatPriceRange(place, t) {
    if (place?.priceRange && PRICE_RANGE_I18N_KEYS[place.priceRange]) {
      return t(PRICE_RANGE_I18N_KEYS[place.priceRange]);
    }
    if (place?.priceRange) return String(place.priceRange);
    return t("place.detail.updatedLater");
  }

  function toExternalUrl(value) {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  }

  function PlaceDetailSkeleton({ heroHeight }) {
    return (
      <View className="flex-1 bg-white">
        <Skeleton width="100%" height={heroHeight} borderRadius={0} />
        <View className="px-5 pt-5 gap-4">
          <View className="gap-2">
            <Skeleton width="30%" height={12} borderRadius={999} />
            <Skeleton width="85%" height={28} borderRadius={10} />
            <Skeleton width="60%" height={14} borderRadius={999} />
          </View>
          <View className="flex-row gap-3">
            <Skeleton width="30%" height={40} borderRadius={16} />
            <Skeleton width="30%" height={40} borderRadius={16} />
            <Skeleton width="30%" height={40} borderRadius={16} />
          </View>
          <View className="h-px bg-slate-100 mt-1" />
          <View className="gap-3">
            <Skeleton width="40%" height={18} borderRadius={8} />
            <Skeleton width="100%" height={80} borderRadius={18} />
          </View>
        </View>
      </View>
    );
  }

  export default function PlaceDetailScreen() {
    const { id } = useLocalSearchParams();
    const placeIdentifier = useMemo(() => {
      const raw = Array.isArray(id) ? id[0] : id;
      return String(raw ?? "").trim();
    }, [id]);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const accessToken = useAuthStore((state) => state.accessToken);
    const bottomSheetRef = useRef(null);
    const writeReviewSheetRef = useRef(null);
    const allReviewsSheetRef = useRef(null);
    const hoursSheetRef = useRef(null);
    const imageListRef = useRef(null);
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const writeReviewSnapPoints = useMemo(() => ["62%", "92%"], []);
    const allReviewsSnapPoints = useMemo(() => ["70%", "96%"], []);

    const heroHeight = useMemo(() => {
      const raw = Math.round(SCREEN_WIDTH * HERO_ASPECT);
      return Math.max(HERO_MIN, Math.min(raw, HERO_MAX));
    }, [SCREEN_WIDTH]);

    const {
      data: place,
      isLoading,
      isError,
      error,
    } = usePlaceDetail(placeIdentifier);
    const resolvedPlaceId = useMemo(() => {
      const parsed = Number(place?.id);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [place?.id]);
    const { data: reviewData } = usePlaceReviews(resolvedPlaceId, { limit: 50 });
    const { data: myReview } = useMyPlaceReview(resolvedPlaceId, Boolean(accessToken));
    const reviews = reviewData?.reviews || [];
    const totalReviews = Number(reviewData?.pagination?.total || reviews.length);
    const recentReviews = reviews.slice(0, MAIN_REVIEW_LIMIT);

    const addToast = useUIStore((s) => s.addToast);
    const saveMutation = useSavePlace();
    const unsaveMutation = useUnsavePlace();
    const createReviewMutation = useCreateReview(resolvedPlaceId);
    const [activeImage, setActiveImage] = useState(0);
    const [isSavedLocal, setIsSavedLocal] = useState(false);
    const [tripSheetKey, setTripSheetKey] = useState(0);
    const [activeSpeechKey, setActiveSpeechKey] = useState(null);

    useEffect(() => {
      setIsSavedLocal(Boolean(place?.isSaved));
    }, [place?.id, place?.isSaved]);

    // Task 3 Step 1: Speech lifecycle cleanup
    const stopSpeech = useCallback(() => {
      Speech.stop();
      setActiveSpeechKey(null);
    }, []);

    useEffect(() => stopSpeech, [stopSpeech]);

    const handleSpeakGuide = useCallback(
      (key, text) => {
        if (!text) return;
        if (activeSpeechKey === key) {
          stopSpeech();
          return;
        }
        Speech.stop();
        setActiveSpeechKey(key);
        Speech.speak(text, {
          language: place?.spokenGuide?.locale || "vi-VN",
          rate: 0.9,
          onDone: () => setActiveSpeechKey(null),
          onStopped: () => setActiveSpeechKey(null),
          onError: () => setActiveSpeechKey(null),
        });
      },
      [activeSpeechKey, place?.spokenGuide?.locale, stopSpeech],
    );

    const handleImageScroll = useCallback(
      (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImage(index);
      },
      [SCREEN_WIDTH],
    );

    const handleSaveToggle = useCallback(async () => {
      if (!accessToken) {
        Alert.alert(
          t("common.loginRequired"),
          t("place.detail.loginToSave"),
          [
            { text: t("common.later"), style: "cancel" },
            {
              text: t("common.login"),
              onPress: () => router.push("/(auth)/login"),
            },
          ],
        );
        return;
      }

      if (!place?.id) return;

      const currentStatus = isSavedLocal;
      setIsSavedLocal(!currentStatus);

      try {
        if (currentStatus) {
          await unsaveMutation.mutateAsync(place.id);
          addToast({
            type: "success",
            message: t("place.detail.toast.unsaved"),
          });
        } else {
          await saveMutation.mutateAsync({ placeId: place.id });
          addToast({
            type: "success",
            message: t("place.detail.toast.saved"),
          });
        }
      } catch (_error) {
        setIsSavedLocal(currentStatus);
        addToast({
          type: "error",
          message: currentStatus
            ? t("place.detail.toast.unsaveError")
            : t("place.detail.toast.saveError"),
        });
      }
    }, [accessToken, place, isSavedLocal, unsaveMutation, saveMutation, addToast, router, t]);

    const handleNavigate = useCallback(() => {
      if (place?.latitude && place?.longitude) {
        router.push({
          pathname: "/(tabs)/map",
          params: {
            focusLat: String(place.latitude),
            focusLng: String(place.longitude),
            focusPlaceId: String(place.id || ""),
            startRoute: "true",
          },
        });
        return;
      }

      if (place?.address) {
        router.push({
          pathname: "/(tabs)/map",
          params: { search: String(place.name || place.address) },
        });
      }
    }, [place, router]);

    const handleAddToTrip = useCallback(() => {
      if (!place?.id) return;

      if (!accessToken) {
        Alert.alert(
          t("common.loginRequired"),
          t("place.detail.loginToAddToTrip"),
          [
            { text: t("common.later"), style: "cancel" },
            {
              text: t("common.login"),
              onPress: () => router.push("/(auth)/login"),
            },
          ],
        );
        return;
      }
      setTripSheetKey((prev) => prev + 1);
      bottomSheetRef.current?.expand();
    }, [accessToken, place?.id, router, t]);

    const handleGetTicket = useCallback(() => {
      if (!accessToken) {
        Alert.alert(
          t("common.loginRequired"),
          t("place.detail.loginToBook"),
          [
            { text: t("common.later"), style: "cancel" },
            {
              text: t("common.login"),
              onPress: () => router.push("/(auth)/login"),
            },
          ],
        );
        return;
      }

      if (!place?.id) return;
      router.push(`/booking/${place.id}`);
    }, [accessToken, place?.id, router, t]);

    const handleOpenReviewComposer = useCallback(() => {
      if (!accessToken) {
        Alert.alert(
          t("common.loginRequired"),
          t("place.detail.loginToWriteReview"),
          [
            { text: t("common.later"), style: "cancel" },
            {
              text: t("common.login"),
              onPress: () => router.push("/(auth)/login"),
            },
          ],
        );
        return;
      }
      writeReviewSheetRef.current?.expand();
    }, [accessToken, router, t]);

    const handleSubmitReview = useCallback(
      async (payload) => {
        try {
          await createReviewMutation.mutateAsync(payload);
          writeReviewSheetRef.current?.close();
          Alert.alert(
            t("place.detail.reviewSubmitted"),
            t("place.detail.reviewSubmittedDesc"),
          );
        } catch (error) {
          const submissionError = getReviewSubmissionError(error);
          Alert.alert(
            submissionError.kind === "cooldown"
              ? t("place.detail.reviewCooldownTitle")
              : t("common.error"),
            submissionError.kind === "cooldown"
              ? t("place.detail.reviewCooldownMessage")
              : submissionError.message || t("place.detail.reviewSubmitError"),
          );
        }
      },
      [createReviewMutation, t],
    );

    const handleOpenAllReviews = useCallback(() => {
      allReviewsSheetRef.current?.expand();
    }, []);

    const handleOpenHours = useCallback(() => {
      hoursSheetRef.current?.expand();
    }, []);

    const handleOpenUrl = useCallback(async (url) => {
      if (!url) return;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    }, []);

    // Derived data — must be BEFORE early returns (Rules of Hooks)
    const images = useMemo(() => place?.images || [], [place?.images]);
    const galleryImages = useMemo(
      () => images.slice(0, MAX_GALLERY_IMAGES),
      [images],
    );
    const fallbackImage = useMemo(
      () =>
        resolveMediaUrl(place?.thumbnailUrl || place?.thumbnail) ||
        getCategoryPlaceholder(place?.category?.name),
      [place?.thumbnailUrl, place?.thumbnail, place?.category?.name],
    );
    const rating = Number(place?.ratingAvg || place?.averageRating || 0);
    const reviewCount = Number(place?.reviewCount || place?._count?.reviews || 0);
    const openState = useMemo(
      () => getOpenState(place?.openingHours, t),
      [place?.openingHours, t],
    );
    const location = useMemo(() => getPlaceLocation(place), [place]);
    const categoryName = useMemo(
      () => place?.category?.name || t("place.detail.featuredPlace"),
      [place?.category?.name, t],
    );
    const categoryIcon = getCategoryIconName(place?.category);
    const priceLine = useMemo(() => formatPriceLine(place), [place]);
    const priceRangeLabel = useMemo(() => formatPriceRange(place, t), [place, t]);
    const addressLine = useMemo(() => getAddressLine(place), [place]);
    const websiteUrl = useMemo(
      () => toExternalUrl(place?.website),
      [place?.website],
    );
    const facebookUrl = useMemo(
      () => toExternalUrl(place?.facebook),
      [place?.facebook],
    );
    const hasContactInfo = Boolean(
      addressLine || place?.phone || place?.email || websiteUrl || facebookUrl,
    );
    const spokenIntroText = useMemo(
      () => getSpeechText(place?.spokenGuide),
      [place?.spokenGuide],
    );
    const showBookingCta = shouldShowBookingCta(place);
    const bottomPadding = showBookingCta
      ? Math.max(insets.bottom, 18) + 96
      : Math.max(insets.bottom, 18) + 24;

    if (isLoading) {
      return <PlaceDetailSkeleton heroHeight={heroHeight} />;
    }

    if (isError || !place) {
      return (
        <View className="flex-1 items-center justify-center px-8 gap-3.5 bg-white">
          <View className="w-[88px] h-[88px] rounded-[28px] items-center justify-center bg-[#FDECEC]">
            <MaterialIconsRounded
              name="error-outline"
              size={40}
              color="#EF4444"
            />
          </View>
          <Text
            className="text-xl leading-7 text-center  "
            style={{ color: PALETTE.text, fontFamily: TOKENS.font.heading }}
          >
            {error?.message || t("place.notFound")}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 bg-white">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        >
          {/* ───── Task 2 Step 1: 16:10 Hero Gallery ───── */}
          <View
            className="relative bg-[#E8EDF2]"
            style={{ height: heroHeight }}
          >
            <FlatList
              ref={imageListRef}
              data={
                galleryImages.length > 0
                  ? galleryImages
                  : [{ _fallback: true }]
              }
              keyExtractor={(item, index) => String(item?.id || index)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              removeClippedSubviews
              maxToRenderPerBatch={3}
              windowSize={3}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => {
                const uri = item?._fallback
                  ? fallbackImage
                  : resolveMediaUrl(
                      item?.secureUrl ||
                        item?.thumbnailUrl ||
                        item?.imageData ||
                        item?.url ||
                        fallbackImage,
                    );
                return uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: SCREEN_WIDTH, height: heroHeight }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View
                    className="h-full items-center justify-center bg-[#E8EDF2]"
                    style={{ width: SCREEN_WIDTH }}
                  >
                    <MaterialIconsRounded
                      name="travel-explore"
                      size={54}
                      color="#FFFFFF"
                    />
                  </View>
                );
              }}
            />

            {/* ───── Task 2 Step 2: BlurView Controls ───── */}
            <View
              className="absolute left-4 right-4 flex-row items-center justify-between"
              style={{ top: insets.top + 10 }}
            >
              <BlurView
                intensity={45}
                tint="light"
                className="h-11 w-11 overflow-hidden rounded-full items-center justify-center"
                style={[ICON_BUTTON_SHADOW, { backgroundColor: "rgba(255,255,255,0.48)", borderWidth: 1, borderColor: "rgba(255,255,255,0.62)" }]}
              >
                <Pressable
                  onPress={() => router.back()}
                  className="h-full w-full items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={t("common.back")}
                >
                  <MaterialIconsRounded
                    name="arrow-back-ios-new"
                    size={17}
                    color={PALETTE.text}
                  />
                </Pressable>
              </BlurView>

              <BlurView
                intensity={45}
                tint="light"
                className="h-11 w-11 overflow-hidden rounded-full items-center justify-center"
                style={[ICON_BUTTON_SHADOW, { backgroundColor: "rgba(255,255,255,0.48)", borderWidth: 1, borderColor: "rgba(255,255,255,0.62)" }]}
              >
                <Pressable
                  onPress={handleAddToTrip}
                  className="h-full w-full items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  accessibilityLabel={t("place.addLeg")}
                >
                  <MaterialIconsRounded
                    name="playlist-add"
                    size={19}
                    color={PALETTE.text}
                  />
                </Pressable>
              </BlurView>
            </View>

            {/* Keeps gallery progress legible regardless of photo brightness. */}
            <View
              className="absolute left-0 right-0 bottom-0 h-20"
              style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
              pointerEvents="none"
            />

            {/* Image Position Indicator */}
            {galleryImages.length > 1 ? (
              <View className="absolute bottom-8 self-center flex-row gap-1.5">
                {galleryImages.map((imageItem, index) => (
                  <View
                    key={imageItem?.id || index}
                    className={cn(
                      "h-[5px] rounded-full",
                      index === activeImage
                        ? "w-4 bg-white"
                        : "w-[5px] bg-white/50",
                    )}
                  />
                ))}
              </View>
            ) : null}
          </View>

          {/* ───── Task 2 Step 3: Flat Information Below Gallery ───── */}
          <View
            className="relative z-10 -mt-7 rounded-t-[32px] bg-white px-5 pt-6 pb-3"
            style={{ borderCurve: "continuous" }}
          >
            {/* Category label */}
            <View className="flex-row items-center gap-1 mb-1">
              <MaterialCommunityIcons
                name={categoryIcon}
                size={14}
                color={PALETTE.accent}
              />
              <Text
                className="text-[11px] tracking-[0.8px] uppercase"
                style={{
                  color: PALETTE.accent,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {categoryName}
              </Text>
            </View>

            {/* Place name */}
            <Text
              className="text-[30px] leading-[35px] tracking-[-0.6px]"
              style={{
                color: PALETTE.text,
                fontFamily: TOKENS.font.heading,
              }}
            >
              {place?.name}
            </Text>

            {/* Rating · Location · Open State */}
            <View className="flex-row items-center flex-wrap gap-x-2.5 gap-y-1 mt-2">
              {rating > 0 ? (
                <Pressable
                  onPress={handleOpenAllReviews}
                  className="flex-row items-center gap-0.5"
                >
                  <MaterialIconsRounded name="star" size={14} color="#FF9F0A" />
                  <Text
                    className="text-[13px]"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.semibold,
                    }}
                  >
                    {rating.toFixed(1)}
                  </Text>
                  <Text
                    className="text-[13px]"
                    style={{
                      color: PALETTE.textMuted,
                      fontFamily: TOKENS.font.medium,
                    }}
                  >
                    ({formatReviewCount(reviewCount, t)})
                  </Text>
                </Pressable>
              ) : (
                <Text
                  className="text-[13px]"
                  style={{
                    color: PALETTE.textMuted,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("place.detail.new")}
                </Text>
              )}

              <Text
                className="text-[10px]"
                style={{ color: PALETTE.textSoft }}
              >
                ·
              </Text>

              <Text
                className="text-[13px]"
                style={{
                  color: PALETTE.textMuted,
                  fontFamily: TOKENS.font.medium,
                }}
              >
                {location || t("place.defaultLocation")}
              </Text>

              <Text
                className="text-[10px]"
                style={{ color: PALETTE.textSoft }}
              >
                ·
              </Text>

              <Text
                className="text-[13px]"
                style={{
                  color: openState.color,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {openState.label}
              </Text>
            </View>

            {/* One primary action, with compact supporting actions. */}
            <View className="flex-row items-center gap-2.5 mt-5">
              <Pressable
                onPress={handleNavigate}
                className="flex-1 h-12 flex-row items-center justify-center gap-2 rounded-[16px] active:opacity-75"
                style={{
                  backgroundColor: PALETTE.primary,
                  borderCurve: "continuous",
                }}
              >
                <MaterialIconsRounded name="near-me" size={17} color="#FFFFFF" />
                <Text
                  className="text-[13px]"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: TOKENS.font.semibold,
                  }}
                >
                  {t("place.directions")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveToggle}
                className="h-12 w-12 items-center justify-center rounded-[16px] bg-[#F5F5F7] active:opacity-75"
                style={{ borderCurve: "continuous" }}
                accessibilityRole="button"
                accessibilityLabel={isSavedLocal ? t("place.saved") : t("place.save")}
              >
                <MaterialIconsRounded
                  name={isSavedLocal ? "bookmark" : "bookmark-border"}
                  size={16}
                  color={isSavedLocal ? "#FF9F0A" : PALETTE.text}
                />
              </Pressable>

              {place?.phone ? (
                <Pressable
                  onPress={() => handleOpenUrl(`tel:${place.phone}`)}
                  className="h-12 w-12 items-center justify-center rounded-[16px] bg-[#F5F5F7] active:opacity-75"
                  style={{ borderCurve: "continuous" }}
                  accessibilityRole="button"
                  accessibilityLabel={t("place.detail.quickCall")}
                >
                  <MaterialIconsRounded
                    name="call"
                    size={16}
                    color={PALETTE.text}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* ───── Content Sections ───── */}
          <View className="px-5 pt-5 pb-7 gap-8">

            {/* ───── Task 2 Step 4: Reviews BEFORE Description ───── */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-[17px]"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {t("place.detail.reviewsSection")}
                  </Text>
                  {accessToken ? (
                    <Pressable onPress={handleOpenReviewComposer} hitSlop={8}>
                      <Text
                        className="text-[13px]"
                        style={{
                          color: PALETTE.primary,
                          fontFamily: TOKENS.font.semibold,
                        }}
                      >
                        {t("place.writeReview")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {recentReviews.length === 0 ? (
                  <Text
                    className="text-sm py-2"
                    style={{
                      color: PALETTE.textMuted,
                      fontFamily: TOKENS.font.medium,
                    }}
                  >
                    {t("place.noReviews")}
                  </Text>
                ) : (
                  <View className="gap-3">
                    {recentReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} t={t} />
                    ))}
                    {totalReviews > MAIN_REVIEW_LIMIT ? (
                      <Pressable
                        onPress={handleOpenAllReviews}
                        className="h-11 rounded-[14px] flex-row items-center justify-center gap-1.5 bg-[#F5F5F7] active:opacity-75"
                        style={{ borderCurve: "continuous" }}
                      >
                        <Text
                          className="text-[13px]"
                          style={{
                            color: PALETTE.text,
                            fontFamily: TOKENS.font.semibold,
                          }}
                        >
                          {t("place.detail.seeAllReviews", {
                            count: totalReviews,
                          })}
                        </Text>
                        <MaterialIconsRounded
                          name="chevron-right"
                          size={16}
                          color={PALETTE.textMuted}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            </Animated.View>

            {/* About + Intro Audio */}
            {place?.description ? (
              <Animated.View entering={FadeInDown.delay(160).duration(400)}>
                <View className="gap-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-[17px]"
                      style={{
                        color: PALETTE.text,
                        fontFamily: TOKENS.font.heading,
                      }}
                    >
                      {t("place.detail.about")}
                    </Text>
                    {spokenIntroText ? (
                      <Pressable
                        onPress={() =>
                          handleSpeakGuide(INTRO_SPEECH_KEY, spokenIntroText)
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: activeSpeechKey === INTRO_SPEECH_KEY,
                        }}
                        className={cn(
                          "h-9 w-9 items-center justify-center rounded-full active:scale-95",
                          activeSpeechKey === INTRO_SPEECH_KEY
                            ? "bg-[#087E8B]"
                            : "bg-[#ECF8FA]",
                        )}
                      >
                        <MaterialIconsRounded
                          name={
                            activeSpeechKey === INTRO_SPEECH_KEY
                              ? "stop"
                              : "volume-up"
                          }
                          size={17}
                          color={
                            activeSpeechKey === INTRO_SPEECH_KEY
                              ? "#FFFFFF"
                              : "#087E8B"
                          }
                        />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text
                    className="text-[14px] leading-[22px]"
                    style={{
                      color: PALETTE.textMuted,
                      fontFamily: TOKENS.font.body,
                    }}
                  >
                    {place.description}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Spoken Guide FAQ */}
            {place?.spokenGuide ? (
              <Animated.View entering={FadeInDown.delay(220).duration(400)}>
                <SpokenGuideSection
                  activeSpeechKey={activeSpeechKey}
                  guide={place.spokenGuide}
                  onSpeak={handleSpeakGuide}
                />
              </Animated.View>
            ) : null}

            {/* ───── Task 3 Step 2: Consolidated Practical Info ───── */}
            {hasContactInfo || place?.openingHours?.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <View className="gap-3">
                  <Text
                    className="text-[17px]"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {t("place.detail.practicalInfo")}
                  </Text>
                  <View className="gap-2">
                    {addressLine ? (
                      <DetailRow
                        icon="place"
                        label={t("place.detail.addressLabel")}
                        value={addressLine}
                        onPress={handleNavigate}
                      />
                    ) : null}

                    {/* Task 3 Step 3: Today hours row opens sheet */}
                    {place?.openingHours?.length > 0 ? (
                      <DetailRow
                        icon="schedule"
                        label={t("place.detail.openingHoursLabel")}
                        value={`${openState.label} · ${getTodayHoursLabel(
                          place.openingHours,
                          t,
                        )}`}
                        highlight
                        onPress={handleOpenHours}
                      />
                    ) : null}

                    {place?.phone ? (
                      <DetailRow
                        icon="call"
                        label={t("place.detail.phoneLabel")}
                        value={place.phone}
                        onPress={() => handleOpenUrl(`tel:${place.phone}`)}
                      />
                    ) : null}
                    {place?.email ? (
                      <DetailRow
                        icon="mail"
                        label={t("place.detail.emailLabel")}
                        value={place.email}
                        onPress={() => handleOpenUrl(`mailto:${place.email}`)}
                      />
                    ) : null}
                    {websiteUrl ? (
                      <DetailRow
                        icon="language"
                        label={t("place.website")}
                        value={websiteUrl.replace(/^https?:\/\//, "")}
                        onPress={() => handleOpenUrl(websiteUrl)}
                      />
                    ) : null}
                    {facebookUrl ? (
                      <DetailRow
                        icon="facebook"
                        label={t("place.detail.facebookLabel")}
                        value={facebookUrl.replace(
                          /^https?:\/\/(www\.)?facebook\.com\//,
                          "fb/",
                        )}
                        onPress={() => handleOpenUrl(facebookUrl)}
                      />
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        {/* ───── Task 3 Step 4: CTA Split ───── */}
        {showBookingCta ? (
          <BlurView
            intensity={85}
            tint="light"
            className="absolute left-[14px] right-[14px] bottom-[14px] flex-row items-center gap-2.5 px-3 pt-3 rounded-[28px] overflow-hidden border border-[rgba(255,255,255,0.4)]"
            style={{
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: "rgba(255,255,255,0.75)",
              ...BOTTOM_BAR_SHADOW,
            }}
          >
            <Pressable
              onPress={handleGetTicket}
              className="flex-1 h-14 rounded-full items-center justify-center active:opacity-90"
              style={{ backgroundColor: PALETTE.primary }}
            >
              <Text
                className="text-[15px] text-white"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {accessToken
                  ? t("place.bookNow")
                  : t("place.detail.loginToBookButton")}
              </Text>
            </Pressable>

            {priceLine?.main || priceRangeLabel ? (
              <View className="items-end pl-2.5">
                <Text
                  className="text-[11px]"
                  style={{
                    color: PALETTE.textMuted,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("place.priceFrom")}
                </Text>
                <View className="flex-row items-end gap-[3px]">
                  <Text
                    className="text-[17px] mt-px"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {priceLine?.main || priceRangeLabel}
                  </Text>
                  {priceLine?.suffix ? (
                    <Text
                      className="text-xs mb-0.5"
                      style={{
                        color: PALETTE.textMuted,
                        fontFamily: TOKENS.font.medium,
                      }}
                    >
                      {priceLine.suffix}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </BlurView>
        ) : null}

        {/* Sheet: Add to Trip */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={["55%", "80%"]}
          enablePanDownToClose
          onChange={(index) => {
            if (index === -1) {
              setTripSheetKey((prev) => prev + 1);
            }
          }}
          backgroundStyle={SHEET_BACKGROUND}
          handleIndicatorStyle={SHEET_INDICATOR}
        >
          <View className="flex-1">
            <TripSelectorSheet
              key={tripSheetKey}
              placeId={resolvedPlaceId}
              placeName={place?.name}
              t={t}
              onClose={() => bottomSheetRef.current?.close()}
              onStepChange={(step) => {
                if (step === 2) bottomSheetRef.current?.snapToIndex(1);
              }}
            />
          </View>
        </BottomSheet>

        {/* Sheet: Write Review */}
        <BottomSheet
          ref={writeReviewSheetRef}
          index={-1}
          snapPoints={writeReviewSnapPoints}
          enablePanDownToClose
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
        >
          <ReviewComposerSheetContent
            key={myReview?.id || "new"}
            initialReview={myReview}
            placeName={place?.name}
            isSubmitting={createReviewMutation.isPending}
            t={t}
            onClose={() => writeReviewSheetRef.current?.close()}
            onSubmit={handleSubmitReview}
          />
        </BottomSheet>

        {/* Sheet: All Reviews */}
        <BottomSheet
          ref={allReviewsSheetRef}
          index={-1}
          snapPoints={allReviewsSnapPoints}
          enablePanDownToClose
        >
          <AllReviewsSheetContent
            reviews={reviews}
            totalCount={totalReviews}
            t={t}
            onClose={() => allReviewsSheetRef.current?.close()}
          />
        </BottomSheet>

        {/* ───── Task 3 Step 3: Weekly Hours Sheet ───── */}
        <BottomSheet
          ref={hoursSheetRef}
          index={-1}
          snapPoints={["48%"]}
          enablePanDownToClose
          backgroundStyle={SHEET_BACKGROUND}
          handleIndicatorStyle={SHEET_INDICATOR}
        >
          <View className="flex-1 px-5 pt-3">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="gap-0.5">
                <Text
                  className="text-[18px]"
                  style={{
                    color: PALETTE.text,
                    fontFamily: TOKENS.font.heading,
                  }}
                >
                  {t("place.detail.openingHoursLabel")}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{
                    color: openState.color,
                    fontFamily: TOKENS.font.semibold,
                  }}
                >
                  {openState.label}
                </Text>
              </View>
              <Pressable
                onPress={() => hoursSheetRef.current?.close()}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
                className="h-9 w-9 items-center justify-center rounded-full bg-[#F5F5F7] active:scale-95"
              >
                <MaterialIconsRounded
                  name="close"
                  size={18}
                  color={PALETTE.textMuted}
                />
              </Pressable>
            </View>
            <OpeningHours hours={place?.openingHours} t={t} />
          </View>
        </BottomSheet>
      </View>
    );
  }
