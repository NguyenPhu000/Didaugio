import { memo, useCallback } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { GLASS_THEME, TOKENS } from "../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CARD_WIDTH = 160;
const CARD_HEIGHT = 200;
const CARD_WIDTH_COMPACT = 146;
const CARD_HEIGHT_COMPACT = 188;

const PlaceCardBase = memo(function PlaceCardBase({
  place,
  onPressPlace,
  variant,
}) {
  const imgUri = resolvePlaceImageUri(place);
  const placeId = place?.id;
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const location =
    place?.district?.name || place?.ward?.name || place?.address || "Cần Thơ";
  const handlePress = useCallback(() => {
    if (placeId != null) {
      onPressPlace(placeId);
    }
  }, [onPressPlace, placeId]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        variant.cardStyle,
        variant.sizeStyle,
        pressed && styles.cardPressed,
      ]}
    >
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={180}
        />
      ) : (
        <View style={styles.imageFallback}>
          <MaterialIcons name="place" size={36} color="#60A5FA" />
        </View>
      )}

      <View style={styles.imageShade} />

      <View style={[styles.content, variant.contentStyle]}>
        <Text style={[styles.title, variant.titleStyle]} numberOfLines={1}>
          {place?.name}
        </Text>

        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={variant.iconSize} color="#2563EB" />
          <Text
            numberOfLines={1}
            style={[styles.locationText, variant.locationTextStyle]}
          >
            {location}
          </Text>
        </View>

        {hasRating ? (
          <View style={[styles.ratingPill, variant.ratingPillStyle]}>
            <MaterialIcons
              name="star"
              size={variant.iconSize}
              color="#F59E0B"
            />
            <Text style={[styles.ratingText, variant.ratingTextStyle]}>
              {rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const StandardPlaceCard = memo(function StandardPlaceCard({
  place,
  onPressPlace,
}) {
  return (
    <PlaceCardBase
      place={place}
      onPressPlace={onPressPlace}
      variant={STANDARD_CARD_VARIANT}
    />
  );
});

const CompactPlaceCard = memo(function CompactPlaceCard({
  place,
  onPressPlace,
}) {
  return (
    <PlaceCardBase
      place={place}
      onPressPlace={onPressPlace}
      variant={COMPACT_CARD_VARIANT}
    />
  );
});

export function SectionRow({ title, data = [], onSeeAll, loading = false }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const CardComponent = compact ? CompactPlaceCard : StandardPlaceCard;
  const cardWidth = compact ? CARD_WIDTH_COMPACT : CARD_WIDTH;
  const cardHeight = compact ? CARD_HEIGHT_COMPACT : CARD_HEIGHT;

  const handlePressPlace = useCallback(
    (placeId) => {
      router.push(`/place/${placeId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <CardComponent place={item} onPressPlace={handlePressPlace} />
    ),
    [CardComponent, handlePressPlace],
  );

  if (!loading && data.length === 0) return null;

  return (
    <View style={{ marginBottom: 32 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {title}
        </Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text
              style={{
                color: GLASS_THEME.neon,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Xem tất cả
            </Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: "row",
            gap: 12,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: compact ? 18 : 20,
                backgroundColor: "#EFF6FF",
                borderWidth: 1,
                borderColor: "#DBEAFE",
              }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(217,232,247,0.95)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  cardCompact: {
    borderRadius: 18,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  imageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "52%",
    backgroundColor: "rgba(15,23,42,0.1)",
  },
  content: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.88)",
  },
  contentCompact: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  title: {
    color: "#0F172A",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  titleCompact: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    flex: 1,
    color: "#64748B",
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
  },
  locationTextCompact: {
    fontSize: 9.5,
  },
  ratingPill: {
    alignSelf: "flex-start",
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ratingPillCompact: {
    height: 18,
    paddingHorizontal: 6,
  },
  ratingText: {
    color: "#92400E",
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
  },
  ratingTextCompact: {
    fontSize: 9,
  },
});

const STANDARD_CARD_SIZE = Object.freeze({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
});

const COMPACT_CARD_SIZE = Object.freeze({
  width: CARD_WIDTH_COMPACT,
  height: CARD_HEIGHT_COMPACT,
});

const STANDARD_CARD_VARIANT = Object.freeze({
  cardStyle: null,
  sizeStyle: STANDARD_CARD_SIZE,
  contentStyle: null,
  titleStyle: null,
  locationTextStyle: null,
  ratingPillStyle: null,
  ratingTextStyle: null,
  iconSize: 12,
});

const COMPACT_CARD_VARIANT = Object.freeze({
  cardStyle: styles.cardCompact,
  sizeStyle: COMPACT_CARD_SIZE,
  contentStyle: styles.contentCompact,
  titleStyle: styles.titleCompact,
  locationTextStyle: styles.locationTextCompact,
  ratingPillStyle: styles.ratingPillCompact,
  ratingTextStyle: styles.ratingTextCompact,
  iconSize: 11,
});
