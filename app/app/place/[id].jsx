import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Bookmark } from "lucide-react-native";
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
  FactCard,
  AmenityCard,
  DetailRow,
} from "../../src/modules/place/components/PlaceDetailComponents";
import { useAuthStore } from "../../src/stores/authStore";
import { GLASS_THEME, TOKENS } from "../../src/constants/design-tokens";
import {
  resolveMediaUrl,
  getCategoryPlaceholder,
} from "../../src/lib/media-url";
import { useI18n } from "../../src/hooks/useI18n";
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

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const PRICE_RANGE_LABELS = {
  FREE: "Miễn phí",
  BUDGET: "Bình dân",
  MODERATE: "Trung bình",
  EXPENSIVE: "Cao cấp",
  LUXURY: "Sang trọng",
};
const MAIN_REVIEW_LIMIT = 5;

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
  if (!todayHours) return t("Cập nhật sau", "Updated later");
  if (todayHours.isClosed) return t("Đóng cửa hôm nay", "Closed today");
  if (todayHours.openTime && todayHours.closeTime) {
    return `${todayHours.openTime} - ${todayHours.closeTime}`;
  }
  return t("Cập nhật sau", "Updated later");
}

function getOpenState(hours, t) {
  const todayHours = getTodayHours(hours);
  if (!todayHours) {
    return {
      label: t("Chờ cập nhật", "Pending update"),
      color: PALETTE.warning,
      icon: "schedule",
    };
  }
  if (todayHours.isClosed) {
    return {
      label: t("Hôm nay đóng cửa", "Closed today"),
      color: "#EF4444",
      icon: "do-not-disturb-on",
    };
  }
  return {
    label: t("Mở cửa hôm nay", "Open today"),
    color: PALETTE.success,
    icon: "schedule",
  };
}

function getFactCards(place, t) {
  const cards = [];
  const todayHours = getTodayHoursLabel(place?.openingHours, t);
  const location = getPlaceLocation(place);

  if (location) {
    cards.push({
      key: "location",
      icon: "place",
      label: t("Khu vực", "Area"),
      value: location,
    });
  }
  cards.push({
    key: "hours",
    icon: "calendar-today",
    label: t("Hôm nay", "Today"),
    value: todayHours,
  });
  if (place?.phone) {
    cards.push({
      key: "phone",
      icon: "call",
      label: t("Liên hệ", "Contact"),
      value: place.phone,
    });
  }
  if (place?.website) {
    cards.push({
      key: "website",
      icon: "language",
      label: "Website",
      value: place.website.replace(/^https?:\/\//, ""),
    });
  }
  return cards.slice(0, 4);
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
    t("Hệ thống", "System")
  );
}

function formatPriceRange(place, t) {
  if (place?.priceRange && PRICE_RANGE_LABELS[place.priceRange]) {
    return PRICE_RANGE_LABELS[place.priceRange];
  }
  if (place?.priceRange) return String(place.priceRange);
  return t("Cập nhật sau", "Updated later");
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
    tag: t("Hôm nay", "Today"),
  });

  if (place?.phone) {
    items.push({
      key: "phone",
      icon: "call",
      label: t("Gọi nhanh", "Quick call"),
      tag: String(place.phone).replace(/\s+/g, "").slice(0, 14),
    });
  } else {
    items.push({
      key: "map",
      icon: "map",
      label: t("Dễ tìm", "Easy to find"),
    });
  }

  if (place?.website) {
    items.push({
      key: "web",
      icon: "language",
      label: t("Website", "Website"),
      tag: websiteLabel?.slice(0, 18),
    });
  } else {
    items.push({
      key: "save",
      icon: "star-outline",
      label: t("Yêu thích", "Favorite"),
    });
  }

  return items.slice(0, 3);
}



export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const placeIdentifier = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    return String(raw ?? "").trim();
  }, [id]);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const accessToken = useAuthStore((state) => state.accessToken);
  const bottomSheetRef = useRef(null);
  const writeReviewSheetRef = useRef(null);
  const allReviewsSheetRef = useRef(null);
  const imageListRef = useRef(null);
  const SCREEN_WIDTH = Dimensions.get("window").width;
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
        t("Cần đăng nhập", "Login required"),
        t(
          "Hãy đăng nhập để lưu địa điểm yêu thích.",
          "Please log in to save this place.",
        ),
        [
          { text: t("Để sau", "Later"), style: "cancel" },
          {
            text: t("Đăng nhập", "Login"),
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
          message: "Địa điểm đã không còn trong danh sách yêu thích",
        });
      } else {
        await saveMutation.mutateAsync({ placeId: place.id });
        addToast({
          type: "success",
          message: "Địa điểm đã được lưu vào danh sách yêu thích",
        });
      }
    } catch (error) {
      // Revert lại trạng thái nếu gọi API lỗi
      setIsSavedLocal(currentStatus);
      addToast({
        type: "error",
        message: currentStatus ? "Không thể bỏ lưu địa điểm" : "Không thể lưu địa điểm",
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
        t("Cần đăng nhập", "Login required"),
        t(
          "Hãy đăng nhập để thêm địa điểm vào chuyến đi.",
          "Please log in to add this place to your trip.",
        ),
        [
          { text: t("Để sau", "Later"), style: "cancel" },
          {
            text: t("Đăng nhập", "Login"),
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
        t("Cần đăng nhập", "Login required"),
        t(
          "Hãy đăng nhập mới có thể đặt chỗ/booking.",
          "Please log in to continue booking.",
        ),
        [
          { text: t("Để sau", "Later"), style: "cancel" },
          {
            text: t("Đăng nhập", "Login"),
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
        t("Cần đăng nhập", "Login required"),
        t(
          "Hãy đăng nhập để viết đánh giá địa điểm.",
          "Please log in to write a review.",
        ),
        [
          { text: t("Để sau", "Later"), style: "cancel" },
          {
            text: t("Đăng nhập", "Login"),
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
        t("Đã gửi đánh giá", "Review submitted"),
        t(
          "Cảm ơn bạn đã chia sẻ trải nghiệm.",
          "Thank you for sharing your experience.",
        ),
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

  if (isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View style={styles.errorState}>
        <View style={styles.errorIconWrap}>
          <MaterialIconsRounded
            name="error-outline"
            size={40}
            color="#EF4444"
          />
        </View>
        <Text style={styles.errorTitle}>
          {error?.message || t("Không tìm thấy địa điểm", "Place not found")}
        </Text>
      </View>
    );
  }

  const images = place?.images || [];
  const fallbackImage =
    resolveMediaUrl(place?.thumbnailUrl || place?.thumbnail) ||
    getCategoryPlaceholder(place?.category?.name);
  const currentImage = resolveMediaUrl(
    images[activeImage]?.secureUrl ||
      images[activeImage]?.thumbnailUrl ||
      images[activeImage]?.imageData ||
      images[activeImage]?.url ||
      fallbackImage,
  );
  const rating = Number(place?.ratingAvg || place?.averageRating || 0);
  const reviewCount = Number(place?.reviewCount || place?._count?.reviews || 0);
  const openState = getOpenState(place?.openingHours, t);
  const factCards = getFactCards(place, t);
  const amenityCards = getAmenityCards(place, t);
  const systemTags = getSystemTags(place);
  const location = getPlaceLocation(place);
  const categoryName =
    place?.category?.name || t("Điểm đến nổi bật", "Featured place");
  const categoryIcon = getCategoryIcon(categoryName);
  const priceLine = formatPriceLine(place);
  const priceRangeLabel = formatPriceRange(place, t);
  const addressLine = getAddressLine(place);
  const creatorName = getCreatorName(place, t);
  const ownerName =
    place?.business?.businessName ||
    place?.createdByUser?.profile?.fullName ||
    creatorName;
  const websiteUrl = toExternalUrl(place?.website);
  const facebookUrl = toExternalUrl(place?.facebook);
  const hasContactInfo = Boolean(
    addressLine || place?.phone || place?.email || websiteUrl || facebookUrl,
  );
  const overviewItems = [
    {
      key: "category",
      icon: "category",
      label: t("Danh mục", "Category"),
      value: categoryName,
    },
    {
      key: "area",
      icon: "explore",
      label: t("Khu vực", "Area"),
      value: location || t("Cần Thơ", "Can Tho"),
    },
    {
      key: "price",
      icon: "payments",
      label: t("Mức giá", "Price range"),
      value: priceRangeLabel,
    },
    {
      key: "owner",
      icon: "account-circle",
      label: t("Người đăng", "Owner"),
      value: ownerName,
    },
  ];
  const bottomPadding = Math.max(insets.bottom, 18) + 96;
  const subtitle =
    place?.category?.name ||
    location ||
    t("Điểm đến nổi bật", "Featured place");

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {/* Hero Image Gallery */}
        <View style={styles.hero}>
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
                  style={[styles.heroImage, { width: SCREEN_WIDTH }]}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.heroFallback, { width: SCREEN_WIDTH }]}>
                  <MaterialIconsRounded
                    name="travel-explore"
                    size={54}
                    color="#FFFFFF"
                  />
                </View>
              );
            }}
          />

          <View style={styles.heroShadeTop} pointerEvents="none" />
          <View style={styles.heroShadeBottom} pointerEvents="none" />

          <View style={[styles.heroTopBar, { top: insets.top + 10 }]}>
            <Pressable onPress={() => router.back()} style={styles.iconButton}>
              <MaterialIconsRounded
                name="arrow-back-ios-new"
                size={18}
                color={PALETTE.text}
              />
            </Pressable>

            <View style={styles.heroActions}>
              <Pressable onPress={handleNavigate} style={styles.iconButton}>
                <MaterialIconsRounded
                  name="near-me"
                  size={20}
                  color={PALETTE.text}
                />
              </Pressable>
              <Pressable onPress={handleAddToTrip} style={styles.iconButton}>
                <MaterialIconsRounded
                  name="playlist-add"
                  size={20}
                  color={PALETTE.text}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroContent}>
            {addressLine ? (
              <View style={styles.heroMetaRow}>
                <MaterialIconsRounded
                  name="home-work"
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.heroMetaText} numberOfLines={2}>
                  {addressLine}
                </Text>
              </View>
            ) : null}

            <Text style={styles.heroTitle} numberOfLines={2}>
              {place?.name}
            </Text>

            <Pressable
              onPress={handleOpenAllReviews}
              style={styles.heroReviewLink}
            >
              <Text style={styles.heroReviewText}>
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
            <View style={styles.heroPager}>
              {images.slice(0, 8).map((imageItem, index) => (
                <View
                  key={imageItem?.id || index}
                  style={[
                    styles.heroDot,
                    index === activeImage && styles.heroDotActive,
                  ]}
                />
              ))}
            </View>
          ) : null}

        </View>

        <View style={styles.contentWrap}>
          <View style={styles.introCard}>
            <Pressable onPress={handleSaveToggle} style={styles.favoriteFab}>
              <Bookmark
                size={24}
                fill={isSavedLocal ? "#FF9F0A" : "none"}
                color={isSavedLocal ? "#FF9F0A" : "#6B7280"}
                strokeWidth={1.75}
              />
            </Pressable>
            <View style={styles.locationBadgeRow}>
              <MaterialIconsRounded
                name={categoryIcon}
                size={16}
                color={PALETTE.textMuted}
              />
              <Text style={styles.locationBadgeText}>
                {subtitle.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.titleCentered}>{place?.name}</Text>

            <View style={styles.pillRowCentered}>
              <StatPill icon="place" label={location || "Cần Thơ"} />
              <StatPill
                icon="calendar-today"
                label={getTodayHoursLabel(place?.openingHours, t)}
              />
              <StatPill
                icon="groups-2"
                label={`${Math.max(reviewCount, 2).toString().padStart(2, "0")}`}
              />
            </View>

            <View style={styles.amenityGrid}>
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

            <View style={styles.introFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.priceCaption}>Từ</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceMain}>
                    {priceLine?.main || t("Liên hệ", "Contact")}
                  </Text>
                  {priceLine?.suffix ? (
                    <Text style={styles.priceSuffix}>{priceLine.suffix}</Text>
                  ) : null}
                </View>
              </View>

              <Pressable onPress={handleGetTicket} style={styles.bookButton}>
                <Text style={styles.bookButtonText}>
                  {accessToken
                    ? t("Đặt ngay", "Book now")
                    : t("Đăng nhập để đặt", "Login to book")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.quickActionRow}>
            <Pressable onPress={handleNavigate} style={styles.secondaryAction}>
              <MaterialIconsRounded
                name="directions"
                size={18}
                color={PALETTE.primaryDark}
              />
              <Text style={styles.secondaryActionText}>
                {t("Chỉ đường", "Directions")}
              </Text>
            </Pressable>

            <Pressable onPress={handleAddToTrip} style={styles.secondaryAction}>
              <MaterialIconsRounded
                name="playlist-add"
                size={18}
                color={PALETTE.primaryDark}
              />
              <Text style={styles.secondaryActionText}>
                {t("Thêm vào trip", "Add to trip")}
              </Text>
            </Pressable>
          </View>

          {rating > 0 || reviewCount > 0 ? (
            <SectionCard title={t("Đánh giá nổi bật", "Top rating")}>
              <View style={styles.ratingSummary}>
                <View>
                  <Text style={styles.ratingValue}>
                    {rating > 0 ? rating.toFixed(1) : t("Mới", "New")}
                  </Text>
                  <Text style={styles.ratingCount}>
                    {formatReviewCount(reviewCount, t)}
                  </Text>
                </View>

                <View style={styles.ratingStarsWrap}>
                  <View style={styles.ratingStars}>
                    <StarRow rating={rating} />
                  </View>
                  <Text
                    style={[styles.openStateText, { color: openState.color }]}
                  >
                    {openState.label}
                  </Text>
                </View>
              </View>
            </SectionCard>
          ) : null}

          {place?.description ? (
            <SectionCard title={t("Giới thiệu", "About")}>
              <Text style={styles.description}>{place.description}</Text>
            </SectionCard>
          ) : null}

          {systemTags.length > 0 ? (
            <SectionCard title="Tag">
              <View style={styles.tagWrap}>
                {systemTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          ) : null}

          {hasContactInfo ? (
            <SectionCard title={t("Liên hệ", "Contact")}>
              <View style={styles.detailList}>
                {addressLine ? (
                  <DetailRow
                    icon="place"
                    label={t("Địa chỉ", "Address")}
                    value={addressLine}
                    onPress={handleNavigate}
                  />
                ) : null}
                {place?.phone ? (
                  <DetailRow
                    icon="call"
                    label={t("Điện thoại", "Phone")}
                    value={place.phone}
                    highlight
                    onPress={() => handleOpenUrl(`tel:${place.phone}`)}
                  />
                ) : null}
                {place?.email ? (
                  <DetailRow
                    icon="mail"
                    label={t("Email", "Email")}
                    value={place.email}
                    onPress={() => handleOpenUrl(`mailto:${place.email}`)}
                  />
                ) : null}
                {websiteUrl ? (
                  <DetailRow
                    icon="language"
                    label={t("Website", "Website")}
                    value={websiteUrl.replace(/^https?:\/\//, "")}
                    onPress={() => handleOpenUrl(websiteUrl)}
                  />
                ) : null}
                {facebookUrl ? (
                  <DetailRow
                    icon="facebook"
                    label={t("Facebook", "Facebook")}
                    value={facebookUrl.replace(
                      /^https?:\/\/(www\.)?facebook\.com\//,
                      "fb/",
                    )}
                    onPress={() => handleOpenUrl(facebookUrl)}
                  />
                ) : null}
              </View>
            </SectionCard>
          ) : null}

          {place?.openingHours?.length > 0 ? (
            <SectionCard title={t("Giờ mở cửa", "Opening hours")}>
              <OpeningHours hours={place.openingHours} t={t} />
            </SectionCard>
          ) : null}

          <SectionCard
            title={t("Đánh giá", "Reviews")}
            actionLabel={
              accessToken ? t("Viết đánh giá", "Write review") : undefined
            }
            onActionPress={handleOpenReviewComposer}
          >
            {recentReviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>
                {t("Chưa có đánh giá nào", "No reviews yet")}
              </Text>
            ) : (
              <>
                {recentReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} t={t} />
                ))}
                {totalReviews > MAIN_REVIEW_LIMIT ? (
                  <Pressable
                    onPress={handleOpenAllReviews}
                    style={styles.seeAllReviewsButton}
                  >
                    <Text style={styles.seeAllReviewsText}>
                      {t(
                        `Xem tất cả ${totalReviews} đánh giá`,
                        `See all ${totalReviews} reviews`,
                      )}
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
        </View>
      </ScrollView>

      <BlurView
        intensity={85}
        tint="light"
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Pressable
          onPress={handleSaveToggle}
          style={[
            styles.bottomIconButton,
            isSavedLocal && {
              backgroundColor: "rgba(255, 159, 10, 0.08)",
              borderColor: "rgba(255, 159, 10, 0.2)",
            },
          ]}
        >
          <MaterialIconsRounded
            name={isSavedLocal ? "bookmark" : "bookmark-border"}
            size={24}
            color={isSavedLocal ? "#FF9F0A" : PALETTE.textMuted}
          />
        </Pressable>

        <Pressable
          onPress={handleNavigate}
          style={styles.bottomSecondaryButton}
        >
          <MaterialIconsRounded
            name="map"
            size={19}
            color={PALETTE.primaryDark}
          />
          <Text style={styles.bottomSecondaryText}>{t("Bản đồ", "Map")}</Text>
        </Pressable>

        <Pressable onPress={handleGetTicket} style={styles.bottomPrimaryButton}>
          <Text style={styles.bottomPrimaryText}>
            {accessToken
              ? t("Đặt ngay", "Book now")
              : t("Đăng nhập để đặt", "Login to book")}
          </Text>
        </Pressable>
      </BlurView>

      <BottomSheet
        ref={writeReviewSheetRef}
        index={-1}
        snapPoints={writeReviewSnapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={styles.reviewSheetBackground}
        handleIndicatorStyle={styles.reviewSheetIndicator}
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
        backgroundStyle={styles.reviewSheetBackground}
        handleIndicatorStyle={styles.reviewSheetIndicator}
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
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <View style={{ flex: 1 }}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bg },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.bg,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
    backgroundColor: PALETTE.bg,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDECEC",
  },
  errorTitle: {
    color: PALETTE.text,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    fontFamily: TOKENS.font.heading,
  },
  hero: {
    position: "relative",
    height: 480,
    backgroundColor: PALETTE.heroFallback,
  },
  heroImage: { height: 480 },
  heroFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.heroFallback,
  },
  heroShadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  heroShadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: PALETTE.overlayStrong,
  },
  heroTopBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  heroContent: { position: "absolute", left: 24, right: 24, bottom: 92 },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  heroMetaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 31,
    letterSpacing: -0.6,
    fontFamily: TOKENS.font.heading,
    maxWidth: "88%",
  },
  heroReviewLink: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  heroReviewText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  heroPager: {
    position: "absolute",
    bottom: 58,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroDotActive: { width: 16, backgroundColor: "#FFFFFF" },
  favoriteFab: {
    position: "absolute",
    right: 24,
    top: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 10,
  },
  contentWrap: { marginTop: -40, paddingHorizontal: 16 },
  introCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 8,
  },
  locationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationBadgeText: {
    color: PALETTE.textMuted,
    fontSize: 13,
    letterSpacing: 0.9,
    fontFamily: TOKENS.font.semibold,
  },
  titleCentered: {
    color: PALETTE.text,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
    fontFamily: TOKENS.font.heading,
    textAlign: "center",
  },
  pillRowCentered: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceAlt,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  statPillText: {
    maxWidth: 120,
    color: PALETTE.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  amenityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  amenityCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  amenityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.surfaceAlt,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    marginBottom: 8,
  },
  amenityLabel: {
    color: PALETTE.text,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    textAlign: "center",
  },
  amenityTagText: {
    color: PALETTE.textSoft,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    textAlign: "center",
    marginTop: 2,
  },
  factCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 78,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  factIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primarySoft,
  },
  factContent: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    color: PALETTE.textSoft,
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  factValue: {
    color: PALETTE.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: TOKENS.font.semibold,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    rowGap: 10,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: PALETTE.surfaceAlt,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  tagChipText: {
    color: PALETTE.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  detailList: {
    gap: 10,
  },
  detailRowPressable: {
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  detailContent: {
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    color: PALETTE.textSoft,
    fontSize: 11,
    marginBottom: 2,
    fontFamily: TOKENS.font.medium,
  },
  detailValue: {
    color: PALETTE.text,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TOKENS.font.semibold,
  },
  detailValueHighlight: {
    color: PALETTE.primaryDark,
  },
  introFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginTop: 22,
  },
  priceCaption: {
    color: PALETTE.textMuted,
    fontSize: 13,
    marginBottom: 2,
    fontFamily: TOKENS.font.medium,
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  priceMain: {
    color: PALETTE.text,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: TOKENS.font.heading,
  },
  priceSuffix: {
    color: PALETTE.textMuted,
    fontSize: 14,
    marginBottom: 2,
    fontFamily: TOKENS.font.medium,
  },
  bookButton: {
    minWidth: 140,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primary,
    shadowColor: PALETTE.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
  },
  quickActionRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  secondaryActionText: {
    color: PALETTE.primaryDark,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  sectionCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 18,
    backgroundColor: PALETTE.surface,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    color: PALETTE.text,
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
  },
  sectionAction: {
    color: PALETTE.primary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  ratingValue: {
    color: PALETTE.text,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: TOKENS.font.heading,
  },
  ratingCount: {
    color: PALETTE.textMuted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: TOKENS.font.medium,
  },
  ratingStarsWrap: { alignItems: "flex-end", gap: 8 },
  ratingStars: { flexDirection: "row", gap: 2 },
  openStateText: { fontSize: 13, fontFamily: TOKENS.font.semibold },
  description: {
    color: PALETTE.textMuted,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: TOKENS.font.body,
  },
  openingHoursList: { gap: 8 },
  openingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PALETTE.surfaceAlt,
  },
  openingRowActive: { backgroundColor: PALETTE.primarySoft },
  openingDay: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  openingDayActive: {
    color: PALETTE.primaryDark,
    fontFamily: TOKENS.font.semibold,
  },
  openingLabel: {
    color: PALETTE.textMuted,
    fontSize: 13,
    fontFamily: TOKENS.font.medium,
  },
  openingLabelActive: {
    color: PALETTE.primaryDark,
    fontFamily: TOKENS.font.semibold,
  },
  emptyReviewText: {
    color: PALETTE.textMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 18,
    fontFamily: TOKENS.font.medium,
  },
  seeAllReviewsButton: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  seeAllReviewsText: {
    color: PALETTE.primaryDark,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 12,
    overflow: "hidden",
  },
  bottomIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
  },
  bottomSecondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(239, 246, 255, 0.9)",
  },
  bottomSecondaryText: {
    color: PALETTE.primaryDark,
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  bottomPrimaryButton: {
    flex: 1.2,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primary,
  },
  bottomPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  sheetBackground: {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sheetIndicator: { backgroundColor: "rgba(0, 0, 0, 0.18)", width: 36 },
});
