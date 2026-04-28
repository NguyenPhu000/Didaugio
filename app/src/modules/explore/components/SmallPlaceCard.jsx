import { memo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const CARD_W = 156;
const CARD_H = 224;

function SmallPlaceCardInner({ place, onPress }) {
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="image-outline"
              size={32}
              color="#D1D5DB"
            />
          </View>
        )}
        
        {/* Rating badge absolutely positioned */}
        {hasRating ? (
          <View style={styles.ratingBadge}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.ratingContent}>
              <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.infoWrap}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place?.name}
        </Text>
        
        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={12}
            color="#9CA3AF"
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <Text style={styles.ratingsCap} numberOfLines={1}>
          {ratingCap}
        </Text>
      </View>
    </Pressable>
  );
}

export const SmallPlaceCard = memo(SmallPlaceCardInner);
export { CARD_W as SMALL_CARD_W, CARD_H as SMALL_CARD_H };

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  imageWrap: {
    width: "100%",
    height: 156,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  ratingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  infoWrap: {
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 12,
    gap: 3,
  },
  placeName: {
    color: "#111827",
    fontSize: 16,
    fontFamily: TOKENS.font.semibold,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  ratingsCap: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
