import { memo } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { Clock, MapPin, MessageCircle, Star } from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  formatPlacePriceDisplay,
  getPlaceLocation,
  getPlaceOpeningHoursInfo,
} from "../utils/exploreHelpers";
import { PosterMedia, usePressScale } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const FEATURED_CARD_H = 392;

export function getFeaturedCardWidth(screenWidth) {
  return Math.max(0, screenWidth - C.spacing * 2);
}

function FeaturedCardInner({ place, onPress }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = getFeaturedCardWidth(width);
  const { onPressIn, onPressOut, cardStyle } = usePressScale({ to: 0.985, mediaTo: 1 });
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const reviewCount = Number(place?.ratingCount ?? place?.reviewCount ?? place?._count?.reviews ?? 0);
  const location = getPlaceLocation(place);
  const hours = getPlaceOpeningHoursInfo(place);
  const price = formatPlacePriceDisplay(place);
  const description = place?.shortDescription || place?.description;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name || t("explore.card.recommended", "Địa điểm đề xuất")}
      accessibilityHint={t("explore.accessibility.openPlace")}
      style={[styles.card, { width: cardWidth }, cardStyle]}
    >
      <PosterMedia uri={resolvePlaceImageUri(place)} width={cardWidth} />
      <LinearGradient
        colors={["rgba(11,14,13,0.04)", "rgba(11,14,13,0.38)", "rgba(11,14,13,0.92)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {place?.category?.name ? <Text style={styles.category} numberOfLines={1}>{place.category.name}</Text> : null}
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{place?.name}</Text>
        {location ? (
          <View style={styles.line}>
            <MapPin size={14} color="rgba(255,255,255,0.84)" />
            <Text style={styles.lineText} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
          </View>
        ) : null}
        {description ? <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{description}</Text> : null}

        <View style={styles.meta}>
          {Number.isFinite(rating) && rating > 0 ? (
            <View style={styles.metric}>
              <Star size={14} color={C.gold} fill={C.gold} />
              <Text style={styles.metricText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {reviewCount > 0 ? (
            <View style={styles.metric}>
              <MessageCircle size={13} color="rgba(255,255,255,0.86)" />
              <Text style={styles.metricText}>{reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1).replace(/\.0$/, "")}k` : reviewCount}</Text>
            </View>
          ) : null}
          {hours ? (
            <View style={styles.metricWide}>
              <Clock size={13} color="rgba(255,255,255,0.86)" />
              <Text style={styles.metricText} numberOfLines={1}>{hours.statusText} · {hours.hoursText}</Text>
            </View>
          ) : null}
          {price ? <Text style={styles.price} numberOfLines={1}>{price.display}</Text> : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { height: FEATURED_CARD_H, borderRadius: 24, overflow: "hidden", backgroundColor: C.sand },
  content: { position: "absolute", left: 18, right: 18, bottom: 18, gap: 8 },
  category: { alignSelf: "flex-start", maxWidth: "80%", color: "rgba(255,255,255,0.92)", fontFamily: C.font.medium, fontSize: 11, lineHeight: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { color: "#FFFFFF", fontFamily: C.font.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  line: { flexDirection: "row", alignItems: "center", gap: 5 },
  lineText: { flex: 1, color: "rgba(255,255,255,0.85)", fontFamily: C.font.medium, fontSize: 13, lineHeight: 20 },
  description: { color: "rgba(255,255,255,0.78)", fontFamily: C.font.body, fontSize: 13, lineHeight: 19 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingTop: 4 },
  metric: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricWide: { maxWidth: "58%", flexDirection: "row", alignItems: "center", gap: 4 },
  metricText: { flexShrink: 1, color: "#FFFFFF", fontFamily: C.font.medium, fontSize: 12, lineHeight: 18 },
  price: { marginLeft: "auto", maxWidth: "52%", color: "#FFFFFF", fontFamily: C.font.bold, fontSize: 14, lineHeight: 20 },
});

export const FeaturedCard = memo(FeaturedCardInner);
