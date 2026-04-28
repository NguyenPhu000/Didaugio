import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatPriceLine,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 200 };

function PopularCardInner({ place, onPress }) {
  const scale = useSharedValue(1);
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place) || "Cần Thơ";
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingMeta = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animatedStyle]}
    >
      {/* Thumbnail */}
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={240}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons
              name="travel-explore"
              size={28}
              color="rgba(0,0,0,0.15)"
            />
          </View>
        )}
      </View>

      {/* Info column */}
      <View style={styles.infoCol}>
        {/* Rating */}
        <View style={styles.ratingRow}>
          <MaterialIcons
            name="star"
            size={13}
            color={hasRating ? "#F59E0B" : APPLE_THEME.textMuted}
          />
          <Text style={styles.ratingText}>
            {hasRating ? `${rating.toFixed(1)} · ${ratingMeta}` : "Mới"}
          </Text>
        </View>

        {/* Place name */}
        <Text style={styles.name} numberOfLines={2}>
          {place?.name}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={12} color={APPLE_THEME.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Bottom: price + CTA */}
        <View style={styles.bottomRow}>
          <View style={styles.priceCol}>
            {priceLine ? (
              <>
                <Text style={styles.priceMain}>{priceLine.main}</Text>
                {priceLine.suffix ? (
                  <Text style={styles.priceSuffix}>{priceLine.suffix}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.priceMain}>Liên hệ</Text>
            )}
          </View>

          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Xem</Text>
            <MaterialIcons
              name="arrow-forward"
              size={13}
              color={APPLE_THEME.white}
            />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const PopularCard = memo(PopularCardInner);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: TOKENS.radius["2xl"],
    padding: 10,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.border,
    ...Platform.select({
      ios: TOKENS.shadow.sm,
      android: { elevation: 2 },
    }),
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APPLE_THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: APPLE_THEME.textMuted,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.3,
  },
  name: {
    color: APPLE_THEME.text,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.4,
    fontFamily: TOKENS.font.heading,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  bottomRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  priceCol: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    flexShrink: 1,
  },
  priceMain: {
    color: APPLE_THEME.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  priceSuffix: {
    color: APPLE_THEME.textMuted,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    borderRadius: 999,
    backgroundColor: APPLE_THEME.primary,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: TOKENS.shadow.sm,
      android: { elevation: 2 },
    }),
  },
  ctaText: {
    color: APPLE_THEME.white,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
});
