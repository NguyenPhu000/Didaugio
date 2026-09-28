import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Star,
  MapPin,
  Bookmark,
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

function AmenityChip({ icon, label }) {
  const IconComponent = AMENITY_ICONS[icon] || Sparkles;
  return (
    <View style={styles.amenityChip}>
      <IconComponent size={10.5} color="#5A5852" strokeWidth={2} />
      <Text style={styles.amenityText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export const ExplorePlaceCardHorizontal = memo(function ExplorePlaceCardHorizontal({
  place,
  onPress,
  onSave,
  isSaved,
  userLocation,
  index = 0,
}) {
  const { t } = useTranslation();
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

  // Emil Kowalski: button/card press scale 0.98 with spring physics
  const { onPressIn, onPressOut, cardStyle } = usePressScale({
    to: 0.982,
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
        withSpring(1.35, { damping: 9, stiffness: 240 }),
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
    <Animated.View
      entering={FadeInDown.duration(240)
        .delay(Math.min(index * 35, 200))
        .springify()
        .damping(16)}
    >
      <AnimatedPressable
        onPress={handleCardPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={place?.name || "Địa điểm đề xuất"}
        accessibilityHint={t("explore.accessibility.openPlace", "Chạm để xem chi tiết địa điểm")}
        style={[styles.card, cardStyle]}
      >
        {/* 1. Thumbnail ảnh bên trái kèm Badge khoảng cách kính mờ */}
        <View style={styles.imageColumn}>
          <PosterMedia uri={imageUri} width={122} />

          {/* Badge khoảng cách góc dưới bên trái */}
          {distanceLabel ? (
            <View style={styles.distanceBadge}>
              <MapPin size={9.5} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.distanceText} numberOfLines={1}>
                {distanceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 2. Cột thông tin chi tiết với độ hoàn thiện cao */}
        <View style={styles.infoColumn}>
          {/* Row 1: Tên địa điểm + Nút Bookmark */}
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {place?.name || "Địa điểm đề xuất"}
            </Text>

            <Pressable
              onPress={handleSavePress}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? "Bỏ lưu" : "Lưu địa điểm"}
              style={styles.saveBtn}
            >
              <Animated.View style={bookmarkAnimStyle}>
                <Bookmark
                  size={18}
                  color={isSaved ? C.river : "#71717A"}
                  fill={isSaved ? C.river : "transparent"}
                  strokeWidth={isSaved ? 2.2 : 1.8}
                />
              </Animated.View>
            </Pressable>
          </View>

          {/* Row 2: Tag Danh mục dạng viên thuốc phong cách Editorial */}
          {categoryName ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText} numberOfLines={1}>
                {categoryName}
              </Text>
            </View>
          ) : null}

          {/* Row 3: Rating sao vàng + Số lượng đánh giá */}
          <View style={styles.ratingRow}>
            {hasRating ? (
              <>
                <Star size={12.5} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                {formattedReviewCount ? (
                  <Text style={styles.reviewCount}>({formattedReviewCount})</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.unratedText}>Chưa có đánh giá</Text>
            )}

            {location ? (
              <>
                <View style={styles.metaDot} />
                <View style={styles.locationWrap}>
                  <MapPin size={10.5} color="#8A8780" strokeWidth={2} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Row 4: Đoạn mô tả giới thiệu ngắn */}
          {shortSnippet ? (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {shortSnippet}
            </Text>
          ) : null}

          {/* Row 5: Tiện ích / Tags đặc trưng */}
          {amenities.length > 0 ? (
            <View style={styles.amenitiesRow}>
              {amenities.map((item, idx) => (
                <AmenityChip key={`amenity-${idx}`} icon={item.icon} label={item.label} />
              ))}
            </View>
          ) : null}

          {/* Row 6: Footer Divider — Trạng thái hoạt động bên trái & Mức giá bên phải */}
          {openingInfo || priceInfo ? (
            <View style={styles.footerRow}>
              {openingInfo ? (
                <View style={styles.openingHoursWrap}>
                  <View style={[styles.statusDot, { backgroundColor: openingInfo.color }]} />
                  <Text style={[styles.openingStatus, { color: openingInfo.color }]}>
                    {openingInfo.statusText}
                  </Text>
                  <Text style={styles.openingTime}> · {openingInfo.hoursText}</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {priceInfo ? (
                <View style={styles.priceWrap}>
                  {priceInfo.prefix ? (
                    <Text style={styles.pricePrefix}>{priceInfo.prefix} </Text>
                  ) : null}
                  <Text style={styles.priceAmount}>{priceInfo.amount}</Text>
                  <View style={styles.arrowCircle}>
                    <ChevronRight size={11.5} color="#52525B" strokeWidth={2.4} />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  imageColumn: {
    width: 122,
    height: 154,
    borderRadius: 15,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: C.sand,
    position: "relative",
  },
  distanceBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(18, 18, 19, 0.76)",
    paddingHorizontal: 7.5,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  distanceText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: C.font.medium,
    letterSpacing: -0.1,
  },
  infoColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: C.font.bold,
    color: C.ink,
    letterSpacing: -0.3,
    marginRight: 6,
  },
  saveBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F4F3ED",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    borderCurve: "continuous",
    marginTop: 2,
  },
  categoryText: {
    fontSize: 10.5,
    fontFamily: C.font.semibold,
    color: "#4A4740",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  ratingValue: {
    fontSize: 12.5,
    fontFamily: C.font.bold,
    color: C.ink,
    marginLeft: 3.5,
  },
  reviewCount: {
    fontSize: 11,
    fontFamily: C.font.body,
    color: "#8A8780",
    marginLeft: 3,
  },
  unratedText: {
    fontSize: 11,
    fontFamily: C.font.body,
    color: "#8A8780",
  },
  metaDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#D1CEC7",
    marginHorizontal: 5,
  },
  locationWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
  },
  locationText: {
    fontSize: 11,
    fontFamily: C.font.medium,
    color: "#71717A",
    flex: 1,
  },
  descriptionText: {
    fontSize: 11.5,
    lineHeight: 15.5,
    fontFamily: C.font.body,
    color: "#6B6964",
    marginTop: 3,
    letterSpacing: -0.1,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5.5,
    marginTop: 5,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    backgroundColor: "#FAF9F5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderCurve: "continuous",
  },
  amenityText: {
    fontSize: 10,
    fontFamily: C.font.medium,
    color: "#4A4742",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  openingHoursWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4.5,
  },
  openingStatus: {
    fontSize: 11,
    fontFamily: C.font.bold,
  },
  openingTime: {
    fontSize: 10.5,
    fontFamily: C.font.body,
    color: "#8A8780",
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  pricePrefix: {
    fontSize: 10.5,
    fontFamily: C.font.body,
    color: "#8A8780",
  },
  priceAmount: {
    fontSize: 12,
    fontFamily: C.font.bold,
    color: C.ink,
    marginRight: 3,
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(24, 24, 25, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
});
