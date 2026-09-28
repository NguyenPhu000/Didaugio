import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Star,
  MapPin,
  Bookmark,
  Clock,
  ChevronRight,
  Compass,
  ShoppingBag,
  Utensils,
  Coffee,
  Wifi,
  Camera,
  Sparkles,
  Tag,
  Landmark,
} from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  getPlaceDistanceLabel,
  getPlaceAmenitiesList,
  getPlaceOpeningHoursInfo,
  formatPlacePriceDisplay,
} from "../utils/exploreHelpers";
import { PosterMedia, usePressScale } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const CARD_H = 416;

const AMENITY_ICONS = {
  compass: Compass,
  "shopping-bag": ShoppingBag,
  utensils: Utensils,
  coffee: Coffee,
  wifi: Wifi,
  camera: Camera,
  sparkles: Sparkles,
  tag: Tag,
  landmark: Landmark,
  "map-pin": MapPin,
};

function FeaturedAmenityChip({ icon, label }) {
  const IconComponent = AMENITY_ICONS[icon] || Sparkles;
  return (
    <View style={styles.amenityChip}>
      <IconComponent size={10.5} color="#64748B" strokeWidth={2} />
      <Text style={styles.amenityText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function getFeaturedCardWidth(screenWidth) {
  return Math.min(306, screenWidth - 48);
}

function FeaturedCardInner({ place, onPress, onSave, isSaved, userLocation }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = getFeaturedCardWidth(width);
  const imageUri = resolvePlaceImageUri(place);

  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const reviewCount = Number(
    place?.ratingCount ?? place?.reviewCount ?? place?._count?.reviews ?? 0,
  );
  const hasRating = Number.isFinite(rating) && rating > 0;

  const distanceLabel = getPlaceDistanceLabel(place, userLocation);
  const location = getPlaceLocation(place);
  const amenities = getPlaceAmenitiesList(place);
  const openingInfo = getPlaceOpeningHoursInfo(place);
  const priceInfo = formatPlacePriceDisplay(place);

  const shortSnippet =
    place?.shortDescription ||
    place?.description ||
    place?.address ||
    null;

  const categoryName = place?.category?.name || null;

  const { onPressIn, onPressOut, cardStyle } = usePressScale({
    to: 0.985,
    mediaTo: 1,
  });

  const bookmarkScale = useSharedValue(1);
  const bookmarkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const handleSavePress = useCallback(
    (event) => {
      event?.stopPropagation();
      bookmarkScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 14, stiffness: 180 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave?.(place);
    },
    [bookmarkScale, onSave, place],
  );

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const formattedReviewCount =
    reviewCount >= 1000
      ? `${(reviewCount / 1000).toFixed(1).replace(/\.0$/, "")}k đánh giá`
      : reviewCount > 0
        ? `${reviewCount} đánh giá`
        : null;

  return (
    <AnimatedPressable
      onPress={handleCardPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name || t("explore.card.recommended", "Địa điểm đề xuất")}
      accessibilityHint={t("explore.accessibility.openPlace", "Chạm để xem chi tiết địa điểm")}
      style={[styles.card, { width: cardWidth }, cardStyle]}
    >
      {/* 1. Hình ảnh Cinematic Crop 16:10 */}
      <View style={styles.imageWrap}>
        <PosterMedia uri={imageUri} width={cardWidth} />

        {/* Badge khoảng cách góc dưới bên trái của ảnh */}
        {distanceLabel ? (
          <View style={styles.distanceBadge}>
            <MapPin size={10} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.distanceText} numberOfLines={1}>
              {distanceLabel}
            </Text>
          </View>
        ) : null}

        {/* Floating Bookmark Button (Góc trên phải) */}
        <Pressable
          onPress={handleSavePress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(
            isSaved
              ? "explore.accessibility.unsavePlace"
              : "explore.accessibility.savePlace",
            { name: place?.name },
          )}
          accessibilityState={{ selected: isSaved }}
          style={styles.saveBtn}
        >
          <Animated.View style={bookmarkAnimStyle}>
            <Bookmark
              size={17}
              color={isSaved ? C.river : C.ink}
              fill={isSaved ? C.river : "transparent"}
              strokeWidth={2.2}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* 2. Nội dung thông tin phân tầng đầy đủ */}
      <View style={styles.content}>
        {/* Category Pill Tag */}
        {categoryName ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>
        ) : null}

        {/* Place Title (Tên địa điểm - Hierarchy #1) */}
        <Text style={styles.title} numberOfLines={1}>
          {place?.name || t("explore.card.recommended", "Địa điểm đề xuất")}
        </Text>

        {/* Rating & Location Meta Line */}
        <View style={styles.metaRow}>
          {hasRating ? (
            <View style={styles.ratingGroup}>
              <Star size={12.5} color={C.gold} fill={C.gold} strokeWidth={0} />
              <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
              {formattedReviewCount ? (
                <Text style={styles.reviewCount}>({formattedReviewCount})</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.unratedText}>Chưa có đánh giá</Text>
          )}

          {location ? (
            <>
              <View style={styles.metaDot} />
              <View style={styles.locationGroup}>
                <MapPin size={11} color={C.muted} strokeWidth={2.2} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Short Description Snippet */}
        {shortSnippet ? (
          <Text style={styles.snippet} numberOfLines={2}>
            {shortSnippet}
          </Text>
        ) : null}

        {/* Tiện ích / Tags pills */}
        {amenities.length > 0 ? (
          <View style={styles.amenitiesRow}>
            {amenities.map((item, idx) => (
              <FeaturedAmenityChip key={`feat-amenity-${idx}`} icon={item.icon} label={item.label} />
            ))}
          </View>
        ) : null}

        {/* Card Footer: Giờ mở cửa & Mức giá */}
        {openingInfo || priceInfo ? (
          <View style={styles.footer}>
            {openingInfo ? (
              <View style={styles.openingHoursWrap}>
                <Clock size={11.5} color={openingInfo.color} strokeWidth={2.2} />
                <Text style={[styles.openingStatus, { color: openingInfo.color }]}>
                  {openingInfo.statusText}
                </Text>
                <Text style={styles.openingTime}> · {openingInfo.hoursText}</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {priceInfo ? (
              <View style={styles.priceContainer}>
                {priceInfo.prefix ? (
                  <Text style={styles.pricePrefix}>{priceInfo.prefix} </Text>
                ) : null}
                <Text style={styles.priceText} numberOfLines={1}>
                  {priceInfo.amount}
                </Text>
                <ChevronRight size={13} color="#71717A" strokeWidth={2.4} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_H,
    borderRadius: C.radius,
    borderCurve: "continuous",
    backgroundColor: C.surface,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(24, 48, 44, 0.08)",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  imageWrap: {
    height: 172,
    backgroundColor: C.sand,
    overflow: "hidden",
    position: "relative",
  },
  distanceBadge: {
    position: "absolute",
    left: 9,
    bottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "rgba(18, 18, 19, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderCurve: "continuous",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  distanceText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: C.font.medium,
    letterSpacing: -0.1,
  },
  saveBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
    justifyContent: "space-between",
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F4F4F5",
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderCurve: "continuous",
  },
  categoryText: {
    fontSize: 10.5,
    fontFamily: C.font.medium,
    color: "#52525B",
    letterSpacing: -0.1,
  },
  title: {
    marginTop: 3,
    color: C.ink,
    fontFamily: C.font.bold,
    fontSize: 16.5,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
  },
  ratingValue: {
    color: C.ink,
    fontFamily: C.font.bold,
    fontSize: 12.5,
  },
  reviewCount: {
    color: C.muted,
    fontFamily: C.font.body,
    fontSize: 11,
  },
  unratedText: {
    color: C.muted,
    fontFamily: C.font.body,
    fontSize: 11,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.mutedLight,
    marginHorizontal: 6,
  },
  locationGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    flex: 1,
    color: C.muted,
    fontFamily: C.font.medium,
    fontSize: 11.5,
  },
  snippet: {
    marginTop: 4,
    color: "#71717A",
    fontFamily: C.font.body,
    fontSize: 12,
    lineHeight: 16,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "#F8F8F9",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  amenityText: {
    fontSize: 10.5,
    fontFamily: C.font.medium,
    color: "#52525B",
  },
  footer: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(24, 48, 44, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openingHoursWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 6,
  },
  openingStatus: {
    fontSize: 11,
    fontFamily: C.font.bold,
    marginLeft: 3.5,
  },
  openingTime: {
    fontSize: 11,
    fontFamily: C.font.body,
    color: "#71717A",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pricePrefix: {
    color: "#71717A",
    fontFamily: C.font.body,
    fontSize: 11,
  },
  priceText: {
    color: C.ink,
    fontFamily: C.font.bold,
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
});

export const FeaturedCard = memo(FeaturedCardInner);
export { CARD_H as FEATURED_CARD_H };


