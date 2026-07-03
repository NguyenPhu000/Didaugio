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
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import BottomSheet from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  useCreateReview,
  usePlaceDetail,
  usePlaceReviews,
} from "../../src/modules/place/hooks/usePlaceDetail";
import { useUIStore } from "../../src/stores/uiStore";
import {
  useSavePlace,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import {
  OpeningHours,
  SectionCard,
  StatPill,
  AmenityCard,
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
  getCategoryIcon,
  getPlaceLocation,
} from "../../src/modules/explore/utils/exploreHelpers";
import {
  PALETTE,
  formatReviewCount,
} from "../../src/modules/place/constants/placeSheetConstants";
import { TripSelectorSheet } from "../../src/modules/place/components/TripSelectorSheet";
import { ReviewComposerSheetContent } from "../../src/modules/place/components/ReviewComposerSheet";
import {
  AllReviewsSheetContent,
  ReviewCard,
  StarRow,
} from "../../src/modules/place/components/AllReviewsSheet";
import { cn } from "../../src/lib/cn";

const MAIN_REVIEW_LIMIT = 5;

const ICON_BUTTON_SHADOW = TOKENS.shadow.md;
const INTRO_CARD_SHADOW = TOKENS.shadow.lg;
const BOTTOM_BAR_SHADOW = TOKENS.shadow.lg;

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

function getSystemTags(place) {
  const raw =
    place?.tags ||
    place?.tagLinks ||
    place?.systemTags ||
    place?.labels ||
    place?.recommendedTags ||
    [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item?.tag?.name === "string") return item.tag.name;
        if (typeof item?.name === "string") return item.name;
        if (typeof item?.label === "string") return item.label;
        return null;
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

function getCreatorName(place, t) {
  return (
    place?.createdByUser?.profile?.fullName ||
    place?.createdByUser?.fullName ||
    place?.createdByUser?.email ||
    place?.business?.businessName ||
    t("place.detail.system")
  );
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

function getAmenityCards(place, t) {
  const items = [];
  const openLabel = getTodayHoursLabel(place?.openingHours, t);
  const websiteLabel = place?.website
    ? toExternalUrl(place.website)?.replace(/^https?:\/\//, "")
    : null;

  items.push({
    key: "open",
    icon: "schedule",
    label: openLabel,
    tag: t("place.detail.today"),
  });

  if (place?.phone) {
    items.push({
      key: "phone",
      icon: "call",
      label: t("place.detail.quickCall"),
      tag: String(place.phone).replace(/\s+/g, "").slice(0, 14),
    });
  } else {
    items.push({
      key: "map",
      icon: "map",
      label: t("place.detail.easyToFind"),
    });
  }

  if (place?.website) {
    items.push({
      key: "web",
      icon: "language",
      label: t("place.website"),
      tag: websiteLabel?.slice(0, 18),
    });
  } else {
    items.push({
      key: "save",
      icon: "star-outline",
      label: t("place.detail.favorite"),
    });
  }

  return items.slice(0, 3);
}



function PlaceDetailSkeleton() {
  return (
    <View className="flex-1 bg-white">
      <Skeleton width="100%" height={480} borderRadius={0} />
      <View className="px-4 -mt-10">
        <View
          className="bg-white rounded-[32px] px-5 pt-7 pb-[22px] gap-4"
          style={INTRO_CARD_SHADOW}
        >
          <Skeleton width="40%" height={14} borderRadius={999} />
          <Skeleton width="70%" height={28} borderRadius={10} />
          <View className="flex-row justify-center gap-2.5">
            <Skeleton width={100} height={38} borderRadius={999} />
            <Skeleton width={120} height={38} borderRadius={999} />
          </View>
          <View className="flex-row justify-between gap-3 mt-2">
            <Skeleton width={90} height={80} borderRadius={20} />
            <Skeleton width={90} height={80} borderRadius={20} />
            <Skeleton width={90} height={80} borderRadius={20} />
          </View>
        </View>
        <View className="mt-[14px] rounded-[26px] p-[18px] bg-white gap-3">
          <Skeleton width="45%" height={18} borderRadius={8} />
          <Skeleton width="100%" height={60} borderRadius={16} />
          <Skeleton width="100%" height={60} borderRadius={16} />
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
  const imageListRef = useRef(null);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const writeReviewSnapPoints = useMemo(() => ["62%", "92%"], []);
  const allReviewsSnapPoints = useMemo(() => ["70%", "96%"], []);

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

  useEffect(() => {
    setIsSavedLocal(Boolean(place?.isSaved));
  }, [place?.id, place?.isSaved]);

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
    // Optimistic UI update
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
    } catch (error) {
      // Revert lại trạng thái nếu gọi API lỗi
      setIsSavedLocal(currentStatus);
      addToast({
        type: "error",
        message: currentStatus ? t("place.detail.toast.unsaveError") : t("place.detail.toast.saveError"),
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
      await createReviewMutation.mutateAsync(payload);
      writeReviewSheetRef.current?.close();
      Alert.alert(
        t("place.detail.reviewSubmitted"),
        t("place.detail.reviewSubmittedDesc"),
      );
    },
    [createReviewMutation, t],
  );

  const handleOpenAllReviews = useCallback(() => {
    allReviewsSheetRef.current?.expand();
  }, []);

  const handleOpenUrl = useCallback(async (url) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }, []);

  // Derived data via hooks — must be BEFORE early returns (Rules of Hooks)
  const images = useMemo(() => place?.images || [], [place?.images]);
  const fallbackImage = useMemo(
    () =>
      resolveMediaUrl(place?.thumbnailUrl || place?.thumbnail) ||
      getCategoryPlaceholder(place?.category?.name),
    [place?.thumbnailUrl, place?.thumbnail, place?.category?.name],
  );
  const rating = Number(place?.ratingAvg || place?.averageRating || 0);
  const reviewCount = Number(place?.reviewCount || place?._count?.reviews || 0);
  const openState = useMemo(() => getOpenState(place?.openingHours, t), [place?.openingHours, t]);
  const amenityCards = useMemo(() => getAmenityCards(place, t), [place, t]);
  const systemTags = useMemo(() => getSystemTags(place), [place]);
  const location = useMemo(() => getPlaceLocation(place), [place]);
  const categoryName = useMemo(
    () => place?.category?.name || t("place.detail.featuredPlace"),
    [place?.category?.name, t],
  );
  const categoryIcon = getCategoryIcon(categoryName);
  const priceLine = useMemo(() => formatPriceLine(place), [place]);
  const priceRangeLabel = useMemo(() => formatPriceRange(place, t), [place, t]);
  const addressLine = useMemo(() => getAddressLine(place), [place]);
  const creatorName = useMemo(() => getCreatorName(place, t), [place, t]);
  const ownerName = useMemo(
    () =>
      place?.business?.businessName ||
      place?.createdByUser?.profile?.fullName ||
      creatorName,
    [place?.business?.businessName, place?.createdByUser?.profile?.fullName, creatorName],
  );
  const websiteUrl = useMemo(() => toExternalUrl(place?.website), [place?.website]);
  const facebookUrl = useMemo(() => toExternalUrl(place?.facebook), [place?.facebook]);
  const hasContactInfo = Boolean(
    addressLine || place?.phone || place?.email || websiteUrl || facebookUrl,
  );
  const bottomPadding = Math.max(insets.bottom, 18) + 96;
  const subtitle = useMemo(
    () => place?.category?.name || location || t("place.detail.featuredPlace"),
    [place?.category?.name, location, t],
  );

  if (isLoading) {
    return <PlaceDetailSkeleton />;
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
          className="text-xl leading-7 text-center"
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
        {/* Hero Image Gallery */}
        <View className="relative h-[480px] bg-[#E8EDF2]">
          <FlatList
            ref={imageListRef}
            data={
              images.length > 0 ? images.slice(0, 8) : [{ _fallback: true }]
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
                  className="h-[480px]"
                  style={{ width: SCREEN_WIDTH }}
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

          <View
            className="absolute top-0 left-0 right-0 h-[150px]"
            style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
            pointerEvents="none"
          />
          <View
            className="absolute left-0 right-0 bottom-0 h-[240px]"
            style={{ backgroundColor: PALETTE.overlayStrong }}
            pointerEvents="none"
          />

          <View
            className="absolute left-5 right-5 flex-row items-center justify-between"
            style={{ top: insets.top + 10 }}
          >
            <Pressable
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                ...ICON_BUTTON_SHADOW,
              }}
            >
              <MaterialIconsRounded
                name="arrow-back-ios-new"
                size={18}
                color={PALETTE.text}
              />
            </Pressable>

            <View className="flex-row items-center gap-2.5">
              <Pressable
                onPress={handleNavigate}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  ...ICON_BUTTON_SHADOW,
                }}
              >
                <MaterialIconsRounded
                  name="near-me"
                  size={20}
                  color={PALETTE.text}
                />
              </Pressable>
              <Pressable
                onPress={handleAddToTrip}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  ...ICON_BUTTON_SHADOW,
                }}
              >
                <MaterialIconsRounded
                  name="playlist-add"
                  size={20}
                  color={PALETTE.text}
                />
              </Pressable>
            </View>
          </View>

          <View className="absolute left-6 right-6 bottom-[92px]">
            {addressLine ? (
              <View className="flex-row items-center gap-1.5 mb-2.5">
                <MaterialIconsRounded
                  name="home-work"
                  size={14}
                  color="#FFFFFF"
                />
                <Text
                  className="text-sm text-white flex-1"
                  style={{ fontFamily: TOKENS.font.medium }}
                  numberOfLines={2}
                >
                  {addressLine}
                </Text>
              </View>
            ) : null}

            <Text
              className="text-[22px] leading-[31px] tracking-[-0.6px] text-white max-w-[88%]"
              style={{ fontFamily: TOKENS.font.heading }}
              numberOfLines={2}
            >
              {place?.name}
            </Text>

            <Pressable
              onPress={handleOpenAllReviews}
              className="mt-2.5 flex-row items-center gap-0.5 self-start"
            >
              <Text
                className="text-sm text-white"
                style={{ fontFamily: TOKENS.font.medium }}
              >
                {formatReviewCount(reviewCount, t)}
              </Text>
              <MaterialIconsRounded
                name="chevron-right"
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {images.length > 1 ? (
            <View className="absolute bottom-[58px] self-center flex-row gap-2">
              {images.slice(0, 8).map((imageItem, index) => (
                <View
                  key={imageItem?.id || index}
                  className={cn(
                    "rounded-full",
                    index === activeImage
                      ? "w-4 bg-white"
                      : "w-[7px] h-[7px] bg-[rgba(255,255,255,0.45)]"
                  )}
                />
              ))}
            </View>
          ) : null}

        </View>

        <View className="-mt-10 px-4">
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View
              className="bg-white rounded-[32px] px-5 pt-7 pb-[22px]"
              style={INTRO_CARD_SHADOW}
            >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5 flex-1">
                <MaterialIconsRounded
                  name={categoryIcon}
                  size={16}
                  color={PALETTE.textMuted}
                />
                <Text
                  className="text-[13px] tracking-[0.9px]"
                  style={{
                    color: PALETTE.textMuted,
                    fontFamily: TOKENS.font.semibold,
                  }}
                >
                  {subtitle.toUpperCase()}
                </Text>
              </View>
              <Pressable
                onPress={handleSaveToggle}
                className={cn(
                  "w-9 h-9 rounded-full items-center justify-center border",
                  isSavedLocal
                    ? "bg-[rgba(255,159,10,0.08)] border-[rgba(255,159,10,0.2)]"
                    : "bg-[#F5F5F7] border-[rgba(0,0,0,0.06)]"
                )}
              >
                <MaterialIconsRounded
                  name={isSavedLocal ? "bookmark" : "bookmark-border"}
                  size={20}
                  color={isSavedLocal ? "#FF9F0A" : PALETTE.textMuted}
                />
              </Pressable>
            </View>

            <View className="flex-row justify-center flex-wrap gap-2.5 mt-4">
              <StatPill icon="place" label={location || t("place.defaultLocation")} />
              <StatPill
                icon="calendar-today"
                label={getTodayHoursLabel(place?.openingHours, t)}
              />
            </View>

            <View className="flex-row justify-between gap-3 mt-6">
              {amenityCards.map(({ key, ...amenity }) => {
                let onPress = undefined;
                if (key === "phone" && place?.phone) {
                  onPress = () => handleOpenUrl(`tel:${place.phone}`);
                } else if (key === "web" && place?.website) {
                  onPress = () => handleOpenUrl(toExternalUrl(place.website));
                } else if (key === "map") {
                  onPress = handleNavigate;
                } else if (key === "save") {
                  onPress = handleSaveToggle;
                }
                return <AmenityCard key={key} {...amenity} onPress={onPress} />;
              })}
            </View>

            <View className="flex-row items-end gap-3.5 mt-[22px]">
              <View className="flex-1">
                <Text
                  className="text-[13px] mb-0.5"
                  style={{
                    color: PALETTE.textMuted,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {t("place.priceFrom")}
                </Text>
                <View className="flex-row items-end gap-1">
                  <Text
                    className="text-[22px] leading-7"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {priceLine?.main || t("place.detail.contactSection")}
                  </Text>
                  {priceLine?.suffix ? (
                    <Text
                      className="text-sm mb-0.5"
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
            </View>
            </View>
          </Animated.View>

          {rating > 0 || reviewCount > 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <SectionCard title={t("place.detail.topRating")}>
              <View className="flex-row items-center justify-between gap-4">
                <View>
                  <Text
                    className="text-[28px] leading-[34px]"
                    style={{
                      color: PALETTE.text,
                      fontFamily: TOKENS.font.heading,
                    }}
                  >
                    {rating > 0 ? rating.toFixed(1) : t("place.detail.new")}
                  </Text>
                  <Text
                    className="text-[13px] mt-1"
                    style={{
                      color: PALETTE.textMuted,
                      fontFamily: TOKENS.font.medium,
                    }}
                  >
                    {formatReviewCount(reviewCount, t)}
                  </Text>
                </View>

                <View className="items-end gap-2">
                  <View className="flex-row gap-0.5">
                    <StarRow rating={rating} />
                  </View>
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
              </View>
            </SectionCard>
            </Animated.View>
          ) : null}

          {place?.description ? (
            <Animated.View entering={FadeInDown.delay(280).duration(400)}>
              <SectionCard title={t("place.detail.about")}>
                <Text
                  className="text-sm leading-6"
                  style={{
                    color: PALETTE.textMuted,
                    fontFamily: TOKENS.font.body,
                  }}
                >
                  {place.description}
                </Text>
              </SectionCard>
            </Animated.View>
          ) : null}

          {systemTags.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(340).duration(400)}>
              <SectionCard title="Tag">
                <View className="flex-row flex-wrap gap-2">
                  {systemTags.map((tag) => (
                    <View
                      key={tag}
                      className="px-3 py-[7px] rounded-full bg-[#F5F5F7] border border-[rgba(0,0,0,0.06)]"
                    >
                      <Text
                        className="text-xs"
                        style={{
                          color: PALETTE.textMuted,
                          fontFamily: TOKENS.font.medium,
                        }}
                        numberOfLines={1}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            </Animated.View>
          ) : null}

          {hasContactInfo ? (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <SectionCard title={t("place.detail.contactSection")}>
              <View className="gap-2.5">
                {addressLine ? (
                  <DetailRow
                    icon="place"
                    label={t("place.detail.addressLabel")}
                    value={addressLine}
                    onPress={handleNavigate}
                  />
                ) : null}
                {place?.phone ? (
                  <DetailRow
                    icon="call"
                    label={t("place.detail.phoneLabel")}
                    value={place.phone}
                    highlight
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
            </SectionCard>
            </Animated.View>
          ) : null}

          {place?.openingHours?.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(460).duration(400)}>
              <SectionCard title={t("place.detail.openingHoursLabel")}>
                <OpeningHours hours={place.openingHours} t={t} />
              </SectionCard>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(520).duration(400)}>
          <SectionCard
            title={t("place.detail.reviewsSection")}
            actionLabel={
              accessToken ? t("place.writeReview") : undefined
            }
            onActionPress={handleOpenReviewComposer}
          >
            {recentReviews.length === 0 ? (
              <Text
                className="text-sm text-center py-[18px]"
                style={{
                  color: PALETTE.textMuted,
                  fontFamily: TOKENS.font.medium,
                }}
              >
                {t("place.noReviews")}
              </Text>
            ) : (
              <>
                {recentReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} t={t} />
                ))}
                {totalReviews > MAIN_REVIEW_LIMIT ? (
                  <Pressable
                    onPress={handleOpenAllReviews}
                    className="h-12 rounded-[18px] flex-row items-center justify-center gap-1.5 mt-1 border border-[rgba(0,0,0,0.12)] bg-[rgba(0,0,0,0.06)]"
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: PALETTE.primaryDark,
                        fontFamily: TOKENS.font.semibold,
                      }}
                    >
                      {t("place.detail.seeAllReviews", { count: totalReviews })}
                    </Text>
                    <MaterialIconsRounded
                      name="keyboard-arrow-up"
                      size={18}
                      color={PALETTE.primaryDark}
                    />
                  </Pressable>
                ) : null}
              </>
            )}
          </SectionCard>
          </Animated.View>
        </View>
      </ScrollView>

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
          className="flex-1 h-14 rounded-full items-center justify-center"
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

        {(priceLine?.main || priceRangeLabel) ? (
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

      <BottomSheet
        ref={writeReviewSheetRef}
        index={-1}
        snapPoints={writeReviewSnapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <ReviewComposerSheetContent
          placeName={place?.name}
          isSubmitting={createReviewMutation.isPending}
          t={t}
          onClose={() => writeReviewSheetRef.current?.close()}
          onSubmit={handleSubmitReview}
        />
      </BottomSheet>

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
    </View>
  );
}
