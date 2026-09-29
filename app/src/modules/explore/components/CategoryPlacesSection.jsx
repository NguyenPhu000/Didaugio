import { memo, useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { Star, MapPin, ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import { getPlaceLocation, getPlaceDistanceLabel, formatPlacePriceDisplay } from "../utils/exploreHelpers";
import { PosterMedia, SectionHeading, usePressScale } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const CARD_W = 232;
const CARD_H = 360;
const CARD_GAP = 12;
const ITEM_LENGTH = CARD_W + CARD_GAP;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatReviewCount(count) {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

function CategoryPlaceCard({ place, onPress, userLocation }) {
  const { t } = useTranslation();
  const { onPressIn, onPressOut, cardStyle } = usePressScale({ to: 0.985, mediaTo: 1 });
  const location = getPlaceLocation(place);
  const distance = getPlaceDistanceLabel(place, userLocation);
  const price = formatPlacePriceDisplay(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const reviews = Number(place?.ratingCount ?? place?.reviewCount ?? 0);
  const description = place?.shortDescription;
  return (
    <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
      accessibilityRole="button" accessibilityLabel={place?.name}
      accessibilityHint={t("explore.accessibility.openPlace")} style={[styles.card, cardStyle]}>
      <View style={styles.imageWrap}>
        <PosterMedia uri={resolvePlaceImageUri(place)} width={CARD_W} />
        {distance ? <View style={styles.distanceBadge}><Text style={styles.distanceText}>{distance}</Text></View> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{place?.name}</Text>
        {location ? <View style={styles.locationRow}><MapPin size={12} color={C.muted} /><Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">{location}</Text></View> : null}
        {description ? <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{description}</Text> : null}
        <View style={styles.rating}>
          {Number.isFinite(rating) && rating > 0 ? (
            <>
              <Star size={12} fill={C.gold} color={C.gold} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </>
          ) : (
            <Text style={styles.unratedText}>{t("place.detail.noReviewsShort", "Chưa có đánh giá")}</Text>
          )}
          {reviews > 0 ? (
            <View style={styles.reviewCount}>
              <MessageCircle size={12} color={C.muted} strokeWidth={2} />
              <Text style={styles.reviewCountText}>{formatReviewCount(reviews)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Text style={price ? styles.price : styles.detail}>{price?.display || t("place.viewDetail", "Xem chi tiết")}</Text>
          <ArrowUpRight size={18} color={C.ink} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

function ViewMoreCard({ onPress, label }) {
  const { onPressIn, onPressOut, cardStyle } = usePressScale({ to: 0.985, mediaTo: 1 });
  return (
    <AnimatedPressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
      accessibilityRole="button" accessibilityLabel={label} style={[styles.more, cardStyle]}>
      <ArrowRight size={24} color={C.ink} />
      <Text style={styles.moreText}>{label}</Text>
    </AnimatedPressable>
  );
}

function CategoryPlacesSectionInner({
  categoryName,
  places,
  onPressPlace,
  onPressViewAll,
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
        />
      ),
    [places, onPressPlace, onPressViewAll, userLocation, t],
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
  section: { marginTop: 28 },
  heading: { paddingHorizontal: C.spacing, marginBottom: 12 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44 },
  viewAllText: { fontFamily: C.font.medium, fontSize: 12, color: C.ink },
  list: { paddingHorizontal: C.spacing, paddingBottom: 2, alignItems: "flex-start" },
  card: { width: CARD_W, height: CARD_H, borderRadius: C.radius, backgroundColor: C.surface, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  imageWrap: { aspectRatio: 16 / 10, backgroundColor: C.sand, overflow: "hidden" },
  distanceBadge: { position: "absolute", left: 10, bottom: 10, backgroundColor: "rgba(18,24,22,0.76)", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8, maxWidth: "75%" },
  distanceText: { fontFamily: C.font.medium, fontSize: 11, lineHeight: 16, color: "#FFFFFF" },
  body: { flex: 1, padding: 14, gap: 8 },
  name: { minHeight: 46, fontFamily: C.font.semibold, fontSize: 16, lineHeight: 23, letterSpacing: -0.25, color: C.ink },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { flex: 1, fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  description: { minHeight: 38, fontFamily: C.font.body, fontSize: 12, lineHeight: 19, color: C.muted },
  rating: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontFamily: C.font.medium, fontSize: 12, lineHeight: 18, color: C.ink },
  reviewCount: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 3 },
  reviewCountText: { fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  unratedText: { fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  price: { flex: 1, fontFamily: C.font.semibold, fontSize: 13, lineHeight: 20, color: C.ink },
  detail: { flex: 1, fontFamily: C.font.medium, fontSize: 12, lineHeight: 20, color: C.ink },
  more: { width: 140, height: CARD_H, borderRadius: C.radius, backgroundColor: C.surfaceMuted, justifyContent: "center", alignItems: "center", gap: 12, padding: 16 },
  moreText: { fontFamily: C.font.medium, fontSize: 13, lineHeight: 20, textAlign: "center", color: C.ink },
});

export const CategoryPlacesSection = memo(CategoryPlacesSectionInner);
export { CARD_W as CATEGORY_CARD_W, CARD_H as CATEGORY_CARD_H };
