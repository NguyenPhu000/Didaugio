import { memo, useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Star, MapPin, Bookmark, ArrowRight, Clock, ChevronRight } from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  getPlaceDistanceLabel,
  getPlaceOpeningHoursInfo,
  formatPlacePriceDisplay,
} from "../utils/exploreHelpers";
import { PosterMedia, SectionHeading, usePressScale } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const CARD_W = 216;
const CARD_H = 312;
const CARD_GAP = 12;
const ITEM_LENGTH = CARD_W + CARD_GAP;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryPlaceCard({ place, onPress, onSave, isSaved, userLocation }) {
  const { t } = useTranslation();
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const distanceLabel = getPlaceDistanceLabel(place, userLocation);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const reviewCount = Number(
    place?.ratingCount ?? place?.reviewCount ?? place?._count?.reviews ?? 0,
  );
  const hasRating = Number.isFinite(rating) && rating > 0;
  const openingInfo = getPlaceOpeningHoursInfo(place);
  const priceInfo = formatPlacePriceDisplay(place);

  const { onPressIn, onPressOut, cardStyle } = usePressScale({
    to: 0.98,
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

  return (
    <AnimatedPressable
      onPress={handleCardPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name || t("explore.card.recommended", "Địa điểm đề xuất")}
      accessibilityHint={t("explore.accessibility.openPlace", "Chạm để xem chi tiết địa điểm")}
      style={[styles.card, cardStyle]}
    >
      {/* Khung ảnh 4:3 */}
      <View style={styles.imageWrap}>
        <PosterMedia uri={imageUri} width={CARD_W} />

        {/* Distance Badge Pill góc dưới trái */}
        {distanceLabel ? (
          <View style={styles.distanceBadge}>
            <MapPin size={9.5} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.distanceText} numberOfLines={1}>
              {distanceLabel}
            </Text>
          </View>
        ) : null}

        {/* Bookmark Button */}
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
              size={15}
              color={isSaved ? C.river : C.ink}
              fill={isSaved ? C.river : "transparent"}
              strokeWidth={2.2}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Thông tin thẻ */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {place?.name || t("explore.card.recommended", "Địa điểm đề xuất")}
        </Text>

        {location ? (
          <View style={styles.locationRow}>
            <MapPin size={11} color={C.muted} strokeWidth={2.2} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}

        {/* Giờ mở cửa */}
        {openingInfo ? (
          <View style={styles.hoursRow}>
            <Clock size={11} color={openingInfo.color} strokeWidth={2} />
            <Text style={[styles.hoursStatus, { color: openingInfo.color }]}>
              {openingInfo.statusText}
            </Text>
            <Text style={styles.hoursText}> · {openingInfo.hoursText}</Text>
          </View>
        ) : null}

        {/* Footer: Rating & Price */}
        <View style={styles.meta}>
          <View style={styles.rating}>
            {hasRating ? (
              <>
                <Star size={11.5} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </>
            ) : (
              <Text style={styles.reviewCountText}>Mới</Text>
            )}
            {reviewCount > 0 ? (
              <Text style={styles.reviewCountText}>({reviewCount})</Text>
            ) : null}
          </View>

          {priceInfo ? (
            <View style={styles.priceWrap}>
              <Text style={styles.price} numberOfLines={1}>
                {priceInfo.amount}
              </Text>
              <ChevronRight size={11.5} color="#71717A" strokeWidth={2.4} />
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}


function ViewMoreCard({ onPress, label }) {
  const { onPressIn, onPressOut, cardStyle } = usePressScale({
    to: 0.97,
    mediaTo: 1,
  });

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.more, cardStyle]}
    >
      <View style={styles.moreIconCircle}>
        <ArrowRight size={20} color={C.river} strokeWidth={2.4} />
      </View>
      <Text style={styles.moreText}>{label}</Text>
    </AnimatedPressable>
  );
}

function CategoryPlacesSectionInner({
  categoryName,
  places,
  onPressPlace,
  onPressViewAll,
  onSavePlace,
  savedPlaceIds,
  userLocation,
}) {
  const { t } = useTranslation();
  const data = useMemo(
    () => [...(places || []), { id: "__view-more__" }],
    [places],
  );
  const snapToOffsets = useMemo(
    () => data.map((_, index) => index * ITEM_LENGTH),
    [data],
  );

  const renderItem = useCallback(
    ({ item, index }) =>
      index === places.length ? (
        <ViewMoreCard
          onPress={onPressViewAll}
          label={t("common.viewAll", "Xem tất cả")}
        />
      ) : (
        <CategoryPlaceCard
          place={item}
          userLocation={userLocation}
          onPress={() => onPressPlace(item)}
          onSave={onSavePlace}
          isSaved={savedPlaceIds?.has?.(Number(item?.id)) || false}
        />
      ),
    [places, onPressPlace, onPressViewAll, onSavePlace, savedPlaceIds, userLocation, t],
  );

  if (!places?.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <SectionHeading
          title={categoryName}
          right={
            onPressViewAll ? (
              <Pressable
                onPress={onPressViewAll}
                hitSlop={8}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>
                  {t("common.viewAll", "Xem tất cả")}
                </Text>
                <ArrowRight size={13} color={C.river} strokeWidth={2.2} />
              </Pressable>
            ) : null
          }
        />
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.id != null ? String(item.id) : `place-${index}`
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  heading: {
    paddingHorizontal: C.spacing,
    marginBottom: 12,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
  },
  viewAllText: {
    fontFamily: C.font.semibold,
    fontSize: 12.5,
    color: C.river,
    letterSpacing: -0.2,
  },
  list: {
    paddingHorizontal: C.spacing,
    paddingBottom: 2,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: C.surface,
    borderRadius: C.radius,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(24, 48, 44, 0.08)",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrap: {
    height: 145,
    backgroundColor: C.sand,
    overflow: "hidden",
    position: "relative",
  },
  distanceBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(18, 18, 19, 0.72)",
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 9999,
    borderCurve: "continuous",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  distanceText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: C.font.medium,
    letterSpacing: -0.1,
  },
  saveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  body: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    color: C.ink,
    fontFamily: C.font.bold,
    fontSize: 14.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    minHeight: 38,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  location: {
    flex: 1,
    color: C.muted,
    fontFamily: C.font.medium,
    fontSize: 11.5,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  hoursStatus: {
    fontSize: 11,
    fontFamily: C.font.bold,
    marginLeft: 3,
  },
  hoursText: {
    fontSize: 10.5,
    fontFamily: C.font.body,
    color: "#71717A",
  },
  meta: {
    marginTop: "auto",
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(24, 48, 44, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
  },
  ratingText: {
    color: C.ink,
    fontFamily: C.font.bold,
    fontSize: 12,
  },
  reviewCountText: {
    color: C.muted,
    fontFamily: C.font.body,
    fontSize: 10.5,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    maxWidth: 95,
    color: C.river,
    fontFamily: C.font.bold,
    fontSize: 11.5,
  },
  more: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: C.radius,
    borderCurve: "continuous",
    backgroundColor: C.sand,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.5,
    borderColor: "rgba(24, 48, 44, 0.08)",
  },
  moreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  moreText: {
    color: C.river,
    fontFamily: C.font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
});

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
export { CARD_W as CATEGORY_CARD_W, CARD_H as CATEGORY_CARD_H };


