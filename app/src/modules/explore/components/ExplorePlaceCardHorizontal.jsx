import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { Star, MapPin, Bookmark, ArrowUpRight, Clock } from "lucide-react-native";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  getPlaceDistanceLabel,
  getPlaceOpeningHoursInfo,
  formatPlacePriceDisplay,
} from "../utils/exploreHelpers";
import { PosterMedia, usePressScale } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ExplorePlaceCardHorizontal = memo(function ExplorePlaceCardHorizontal({
  place, onPress, onSave, isSaved, userLocation,
}) {
  const { t } = useTranslation();
  const { onPressIn, onPressOut, cardStyle } = usePressScale({ to: 0.985, mediaTo: 1 });
  const location = getPlaceLocation(place);
  const distance = getPlaceDistanceLabel(place, userLocation);
  const hours = getPlaceOpeningHoursInfo(place);
  const price = formatPlacePriceDisplay(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const reviews = Number(place?.ratingCount ?? place?.reviewCount ?? 0);
  const description = place?.shortDescription || place?.description;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={place?.name}
      accessibilityHint={t("explore.accessibility.openPlace")}
      style={[styles.card, cardStyle]}
    >
      <View style={styles.topRow}>
        <View style={styles.photo}>
          <PosterMedia uri={resolvePlaceImageUri(place)} width={104} />
        </View>
        <View style={styles.identity}>
          {place?.category?.name ? <Text style={styles.category} numberOfLines={1}>{place.category.name}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>{place?.name}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <MapPin size={12} color={C.muted} />
              <Text style={styles.location} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
          <View style={styles.metrics}>
            {Number.isFinite(rating) && rating > 0 ? (
              <View style={styles.rating}>
                <Star size={12} fill={C.gold} color={C.gold} />
                <Text style={styles.ratingText}>{rating.toFixed(1)}{reviews > 0 ? ` (${reviews})` : ""}</Text>
              </View>
            ) : null}
            {distance ? <Text style={styles.distance}>{distance}</Text> : null}
          </View>
        </View>
      </View>
      {description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
      {hours ? (
        <View style={styles.hours}>
          <Clock size={13} color={C.muted} />
          <Text style={styles.hoursText}>{hours.statusText} · {hours.hoursText}</Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.action}>
          <Text style={price ? styles.price : styles.detail}>{price?.display || t("place.viewDetail", "Xem chi tiết")}</Text>
          <ArrowUpRight size={18} color={C.ink} />
        </View>
        {onSave ? (
          <Pressable
            onPress={(event) => { event.stopPropagation(); onSave(place); }}
            accessibilityRole="button"
            accessibilityLabel={t(isSaved ? "explore.accessibility.unsavePlace" : "explore.accessibility.savePlace", { name: place?.name })}
            accessibilityState={{ selected: Boolean(isSaved) }}
            style={({ pressed }) => [styles.save, pressed && { opacity: 0.55 }]}
          >
            <Bookmark size={19} color={C.ink} fill={isSaved ? C.ink : "transparent"} />
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 14, padding: 14, borderRadius: C.radius,
    backgroundColor: C.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line, gap: 12 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  photo: { width: 104, aspectRatio: 1, flexShrink: 0, borderRadius: 14, overflow: "hidden", backgroundColor: C.sand },
  identity: { flex: 1, minWidth: 0, gap: 6 },
  category: { fontFamily: C.font.medium, fontSize: 11, lineHeight: 16, color: C.muted },
  title: { fontFamily: C.font.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.3, color: C.ink },
  locationRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  location: { flex: 1, fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  metrics: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontFamily: C.font.medium, fontSize: 12, lineHeight: 18, color: C.ink },
  distance: { fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  description: { fontFamily: C.font.body, fontSize: 13, lineHeight: 20, color: C.muted },
  hours: { flexDirection: "row", alignItems: "center", gap: 6 },
  hoursText: { flex: 1, fontFamily: C.font.body, fontSize: 12, lineHeight: 18, color: C.muted },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 6 },
  action: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  price: { flexShrink: 1, fontFamily: C.font.semibold, fontSize: 14, lineHeight: 21, color: C.ink },
  detail: { flexShrink: 1, fontFamily: C.font.medium, fontSize: 13, lineHeight: 20, color: C.ink },
  save: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: C.surfaceMuted },
});
