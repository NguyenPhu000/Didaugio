import { useCallback, useMemo, useRef, useState } from "react";
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
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  usePlaceDetail,
  usePlaceReviews,
} from "../../src/modules/place/hooks/usePlaceDetail";
import {
  useSavePlace,
  useUnsavePlace,
} from "../../src/modules/saved/hooks/useSaved";
import { useAuthStore } from "../../src/stores/authStore";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { useAddDestination } from "../../src/modules/trips/hooks/useTripDetail";
import { GLASS_THEME, TOKENS } from "../../src/constants/design-tokens";
import { resolveMediaUrl } from "../../src/lib/media-url";
import { useI18n } from "../../src/hooks/useI18n";
import {
  formatPriceLine,
  getCategoryIcon,
  getPlaceLocation,
} from "../../src/modules/explore/utils/exploreHelpers";

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const PALETTE = {
  bg: "#F4F7FB", // Lighter, clean background
  surface: "#FFFFFF",
  surfaceAlt: "#FAFCFF", // Very subtle tint
  text: "#0F172A", // Darker slate for contrast
  textMuted: "#475569", // Medium slate
  textSoft: "#94A3B8", // Light slate
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  primary: "#2563EB", // Vibrant blue
  primaryDark: "#1D4ED8",
  primarySoft: "#EFF6FF", // Soft blue background for chips
  success: "#10B981",
  warning: "#F59E0B",
  overlayStrong: "rgba(15, 23, 42, 0.65)", // Darker gradient
  heroFallback: "#CBD5E1",
  accent: "#FBBF24",
};
const PRICE_RANGE_LABELS = {
  FREE: "Miễn phí",
  BUDGET: "Bình dân",
  MODERATE: "Trung bình",
  EXPENSIVE: "Cao cấp",
  LUXURY: "Sang trọng",
};

function formatReviewCount(value, t) {
  const count = Number(value || 0);
  if (!count) return t("Mới", "New");
  if (count >= 1000)
    return t(
      `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k đánh giá`,
      `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k reviews`,
    );
  return t(`${count} đánh giá`, `${count} reviews`);
}

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

const StarRow = ({ rating, size = 16 }) =>
  [1, 2, 3, 4, 5].map((value) => (
    <MaterialIcons
      key={value}
      name={value <= Math.round(rating) ? "star" : "star-border"}
      size={size}
      color="#FBBF24"
    />
  ));

function ReviewCard({ review, t }) {
  const author =
    review?.user?.profile?.fullName ||
    review?.user?.email?.split("@")[0] ||
    t("Ẩn danh", "Anonymous");
  const avatar = resolveMediaUrl(review?.user?.profile?.avatar);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.reviewAvatarImage}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.reviewAvatarFallback}>
              {author.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.reviewMeta}>
          <Text style={styles.reviewAuthor}>{author}</Text>
          <View style={styles.reviewStars}>
            <StarRow rating={review?.rating || 0} size={12} />
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {review?.createdAt
            ? new Date(review.createdAt).toLocaleDateString("vi-VN")
            : ""}
        </Text>
      </View>
      {review?.content ? (
        <Text style={styles.reviewContent}>{review.content}</Text>
      ) : null}
    </View>
  );
}

function OpeningHours({ hours, t }) {
  const today = new Date().getDay();

  return (
    <View style={styles.openingHoursList}>
      {DAY_NAMES.map((day, index) => {
        const dayNumber = index === 6 ? 0 : index + 1;
        const item = hours?.find((entry) => entry.dayOfWeek === dayNumber);
        const isToday = today === dayNumber;
        const label = item?.isClosed
          ? t("Đóng cửa", "Closed")
          : item?.openTime && item?.closeTime
            ? `${item.openTime} - ${item.closeTime}`
            : t("Chưa cập nhật", "Not updated");

        return (
          <View
            key={day}
            style={[styles.openingRow, isToday && styles.openingRowActive]}
          >
            <Text
              style={[styles.openingDay, isToday && styles.openingDayActive]}
            >
              {day}
            </Text>
            <Text
              style={[
                styles.openingLabel,
                isToday && styles.openingLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SectionCard({ title, actionLabel, onActionPress, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function StatPill({ icon, label }) {
  return (
    <View style={styles.statPill}>
      <MaterialIcons name={icon} size={15} color={PALETTE.textMuted} />
      <Text style={styles.statPillText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function FactCard({ icon, label, value }) {
  return (
    <View style={styles.factCard}>
      <View style={styles.factIconWrap}>
        <MaterialIcons name={icon} size={18} color={PALETTE.primaryDark} />
      </View>
      <View style={styles.factContent}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={18} color={PALETTE.textSoft} />
    </View>
  );
}

function AmenityCard({ icon, label, tag, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.amenityCard}>
      <View style={styles.amenityIconWrap}>
        <MaterialIcons name={icon} size={22} color={PALETTE.primaryDark} />
      </View>
      <Text style={styles.amenityLabel} numberOfLines={1}>
        {label}
      </Text>
      {tag ? (
        <Text style={styles.amenityTagText} numberOfLines={1}>
          {tag}
        </Text>
      ) : null}
    </Pressable>
  );
}

function DetailRow({ icon, label, value, onPress, highlight = false }) {
  const content = (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <MaterialIcons
          name={icon}
          size={17}
          color={highlight ? PALETTE.primaryDark : PALETTE.textMuted}
        />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text
          style={[styles.detailValue, highlight && styles.detailValueHighlight]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <MaterialIcons name="open-in-new" size={17} color={PALETTE.textSoft} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.detailRowPressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function TripSelectorSheet({ placeId, placeName, onClose, t }) {
  const router = useRouter();
  const { data: trips = [], isLoading } = useTrips();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const addMutation = useAddDestination(selectedTripId);

  const handleSelect = useCallback(
    async (tripId) => {
      setSelectedTripId(tripId);
      try {
        await addMutation.mutateAsync({
          placeId: parseInt(placeId, 10),
          dayNumber: 1,
          order: 0,
        });
        onClose();
      } catch {
        setSelectedTripId(null);
      }
    },
    [addMutation, onClose, placeId],
  );

  return (
    <View style={styles.tripSheet}>
      <View style={styles.tripSheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripSheetTitle}>
            {t("Thêm vào chuyến đi", "Add to trip")}
          </Text>
          {placeName ? (
            <Text style={styles.tripSheetSubtitle}>{placeName}</Text>
          ) : null}
        </View>
        <Pressable onPress={onClose} hitSlop={8} style={styles.tripSheetClose}>
          <MaterialIcons
            name="close"
            size={20}
            color={GLASS_THEME.textSecondary}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={GLASS_THEME.neon}
          style={{ marginTop: 20 }}
        />
      ) : trips.length === 0 ? (
        <View style={styles.emptyTripState}>
          <Text style={styles.emptyTripText}>
            {t("Bạn chưa có chuyến đi nào", "You have no trips yet")}
          </Text>
          <Pressable
            onPress={() => {
              onClose();
              router.push("/trip/create");
            }}
            style={styles.createTripButton}
          >
            <Text style={styles.createTripButtonText}>
              {t("Tạo chuyến đi mới", "Create new trip")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={trips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isAdding =
                selectedTripId === item.id && addMutation.isPending;
              return (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  disabled={addMutation.isPending}
                  style={styles.tripItem}
                >
                  <View style={styles.tripItemIcon}>
                    <MaterialIcons
                      name="luggage"
                      size={18}
                      color={GLASS_THEME.neon}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripItemTitle}>{item.title}</Text>
                    <Text style={styles.tripItemMeta}>
                      {t(
                        `${item.destinations?.length || 0} điểm đến`,
                        `${item.destinations?.length || 0} destinations`,
                      )}
                    </Text>
                  </View>
                  {isAdding ? (
                    <ActivityIndicator size="small" color={GLASS_THEME.neon} />
                  ) : (
                    <MaterialIcons
                      name="add-circle-outline"
                      size={22}
                      color={GLASS_THEME.neon}
                    />
                  )}
                </Pressable>
              );
            }}
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            onPress={() => {
              onClose();
              router.push("/trip/create");
            }}
            style={styles.tripSecondaryButton}
          >
            <MaterialIcons
              name="add"
              size={18}
              color={GLASS_THEME.neonAccent}
            />
            <Text style={styles.tripSecondaryButtonText}>
              {t("Tạo chuyến đi mới", "Create new trip")}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams();
  const placeId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id]);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const accessToken = useAuthStore((state) => state.accessToken);
  const bottomSheetRef = useRef(null);
  const imageListRef = useRef(null);
  const SCREEN_WIDTH = Dimensions.get("window").width;

  const { data: place, isLoading, isError, error } = usePlaceDetail(placeId);
  const { data: reviewData } = usePlaceReviews(placeId, { limit: 5 });
  const reviews = reviewData?.reviews || [];

  const saveMutation = useSavePlace();
  const unsaveMutation = useUnsavePlace();
  const [activeImage, setActiveImage] = useState(0);

  const handleImageScroll = useCallback(
    (e) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveImage(index);
    },
    [SCREEN_WIDTH],
  );

  const handleSaveToggle = useCallback(() => {
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

    if (place?.isSaved) {
      unsaveMutation.mutate(place.id);
    } else if (place?.id) {
      saveMutation.mutate({ placeId: place.id });
    }
  }, [accessToken, place, router, saveMutation, unsaveMutation]);

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
    bottomSheetRef.current?.expand();
  }, [accessToken, router, t]);

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

    router.push(`/booking/${id}`);
  }, [accessToken, id, router, t]);

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
          <MaterialIcons name="error-outline" size={40} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>
          {error?.message || t("Không tìm thấy địa điểm", "Place not found")}
        </Text>
      </View>
    );
  }

  const images = place?.images || [];
  const fallbackImage = resolveMediaUrl(
    place?.thumbnailUrl || place?.thumbnail,
  );
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
                  <MaterialIcons
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
              <MaterialIcons
                name="arrow-back-ios-new"
                size={18}
                color={PALETTE.text}
              />
            </Pressable>

            <View style={styles.heroActions}>
              <Pressable onPress={handleNavigate} style={styles.iconButton}>
                <MaterialIcons name="near-me" size={20} color={PALETTE.text} />
              </Pressable>
              <Pressable onPress={handleAddToTrip} style={styles.iconButton}>
                <MaterialIcons
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
                <MaterialIcons name="home-work" size={14} color="#FFFFFF" />
                <Text style={styles.heroMetaText} numberOfLines={1}>
                  {addressLine}
                </Text>
              </View>
            ) : null}

            <Text style={styles.heroTitle} numberOfLines={2}>
              {place?.name}
            </Text>

            <Pressable style={styles.heroReviewLink}>
              <Text style={styles.heroReviewText}>
                {formatReviewCount(reviewCount, t)}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#FFFFFF" />
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

          <Pressable onPress={handleSaveToggle} style={styles.favoriteFab}>
            <MaterialIcons
              name={place?.isSaved ? "star" : "star-border"}
              size={28}
              color={place?.isSaved ? PALETTE.accent : "#F3B300"}
            />
          </Pressable>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.introCard}>
            <View style={styles.locationBadgeRow}>
              <MaterialIcons
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
              <MaterialIcons
                name="directions"
                size={18}
                color={PALETTE.primaryDark}
              />
              <Text style={styles.secondaryActionText}>
                {t("Chỉ đường", "Directions")}
              </Text>
            </Pressable>

            <Pressable onPress={handleAddToTrip} style={styles.secondaryAction}>
              <MaterialIcons
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
          >
            {reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>
                {t("Chưa có đánh giá nào", "No reviews yet")}
              </Text>
            ) : (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} t={t} />
              ))
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
        <Pressable onPress={handleSaveToggle} style={styles.bottomIconButton}>
          <MaterialIcons
            name={place?.isSaved ? "bookmark" : "bookmark-border"}
            size={24}
            color={place?.isSaved ? PALETTE.primary : PALETTE.textMuted}
          />
        </Pressable>

        <Pressable
          onPress={handleNavigate}
          style={styles.bottomSecondaryButton}
        >
          <MaterialIcons name="map" size={19} color={PALETTE.primaryDark} />
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
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["55%", "80%"]}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <TripSelectorSheet
            placeId={id}
            placeName={place?.name}
            t={t}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
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
    bottom: -26,
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
  factGrid: { gap: 10, marginTop: 18 },
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
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  overviewItem: {
    width: "48.5%",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    backgroundColor: PALETTE.surfaceAlt,
  },
  overviewIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  overviewTextWrap: {
    gap: 4,
  },
  overviewLabel: {
    color: PALETTE.textSoft,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.semibold,
  },
  overviewValue: {
    color: PALETTE.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: TOKENS.font.heading,
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
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: {
    flex: 1,
    color: PALETTE.textMuted,
    fontSize: 14,
    lineHeight: 22,
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
  reviewCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: PALETTE.surfaceAlt,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PALETTE.primarySoft,
  },
  reviewAvatarImage: { width: 44, height: 44 },
  reviewAvatarFallback: {
    color: PALETTE.primaryDark,
    fontSize: 16,
    fontFamily: TOKENS.font.heading,
  },
  reviewMeta: { flex: 1 },
  reviewAuthor: {
    color: PALETTE.text,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  reviewStars: { flexDirection: "row", gap: 1, marginTop: 2 },
  reviewDate: {
    color: PALETTE.textSoft,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  reviewContent: {
    color: PALETTE.textMuted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    fontFamily: TOKENS.font.body,
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
    backgroundColor: "#0D1117",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: GLASS_THEME.glassBorder,
  },
  sheetIndicator: { backgroundColor: "rgba(255,255,255,0.3)", width: 36 },
  tripSheet: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  tripSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  tripSheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: TOKENS.font.heading,
  },
  tripSheetSubtitle: {
    color: GLASS_THEME.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontFamily: TOKENS.font.body,
  },
  tripSheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  emptyTripState: { alignItems: "center", paddingVertical: 28, gap: 12 },
  emptyTripText: {
    color: GLASS_THEME.textSecondary,
    textAlign: "center",
    fontFamily: TOKENS.font.body,
  },
  createTripButton: {
    backgroundColor: GLASS_THEME.neon,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createTripButtonText: {
    color: "#03131A",
    fontSize: 13,
    fontFamily: TOKENS.font.heading,
  },
  tripItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: GLASS_THEME.glass,
    borderWidth: 1,
    borderColor: GLASS_THEME.glassBorder,
    marginBottom: 10,
  },
  tripItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,240,255,0.08)",
  },
  tripItemTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  tripItemMeta: {
    color: GLASS_THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: TOKENS.font.body,
  },
  tripSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_THEME.glassBorderStrong,
    marginTop: 4,
  },
  tripSecondaryButtonText: {
    color: GLASS_THEME.neonAccent,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
});
