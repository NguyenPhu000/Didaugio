import { memo } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
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
  formatRatingLabel,
  formatPriceLine,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SCREEN_W = Dimensions.get("window").width;
const PAD = 24;
const CARD_W = Math.min(300, SCREEN_W - PAD * 2 - 16);
const CARD_H = 400;

const SPRING_CONFIG = { damping: 14, stiffness: 180 };

function FeaturedCardInner({ place, onPress }) {
  const scale = useSharedValue(1);
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);
  const categoryName = place?.category?.name || "Đề xuất";

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
      {/* Image background */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons
            name="travel-explore"
            size={44}
            color="rgba(255,255,255,0.25)"
          />
        </View>
      )}

      {/* Cinematic gradients */}
      <View style={styles.gradientTop} pointerEvents="none" />
      <View style={styles.gradientBottom} pointerEvents="none" />

      {/* Featured badge — dark glass pill */}
      <View style={styles.featuredBadge}>
        <BlurView
          intensity={70}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badgeInner}>
          <MaterialIcons name="bolt" size={12} color="#FACC15" />
          <Text style={styles.featuredBadgeText}>Nổi bật</Text>
        </View>
      </View>

      {/* Rating badge — dark glass pill */}
      {hasRating ? (
        <View style={[styles.ratingBadge]}>
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.badgeInner}>
            <MaterialIcons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
      ) : null}

      {/* Favourite button */}
      <View style={styles.favoriteBtn}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <MaterialIcons name="favorite-border" size={17} color="#FFFFFF" />
      </View>

      {/* Footer: frosted glass */}
      <View style={styles.footerWrap}>
        <BlurView intensity={85} tint="light" style={styles.footerBlur}>
          {/* Category pill */}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>

          {/* Name & location */}
          <Text style={styles.placeName} numberOfLines={2}>
            {place?.name}
          </Text>

          {location ? (
            <View style={styles.locationRow}>
              <MaterialIcons
                name="place"
                size={12}
                color={APPLE_THEME.textMuted}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          {/* Bottom row */}
          <View style={styles.footerBottomRow}>
            <Text style={styles.ratingsCap}>{ratingCap}</Text>
            <View style={styles.bottomRightRow}>
              {priceLine ? (
                <View style={styles.priceRow}>
                  <Text style={styles.priceMain}>{priceLine.main}</Text>
                  {priceLine.suffix ? (
                    <Text style={styles.priceSuffix}>{priceLine.suffix}</Text>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.ctaCircle}>
                <MaterialIcons
                  name="arrow-forward"
                  size={14}
                  color={APPLE_THEME.white}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </View>
    </AnimatedPressable>
  );
}

export const FeaturedCard = memo(FeaturedCardInner);
export { CARD_W as FEATURED_CARD_W, CARD_H as FEATURED_CARD_H };

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: TOKENS.radius["3xl"],
    overflow: "hidden",
    backgroundColor: APPLE_THEME.surfaceMuted,
    ...Platform.select({
      ios: TOKENS.shadow.lg,
      android: { elevation: 10 },
    }),
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: APPLE_THEME.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  favoriteBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 3,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 3,
    height: 28,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  ratingBadge: {
    position: "absolute",
    top: 14,
    left: 94,
    zIndex: 3,
    height: 28,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  badgeInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  ratingBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  footerWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 3,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.6)",
  },
  footerBlur: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  categoryPill: {
    alignSelf: "flex-start",
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APPLE_THEME.border,
    marginBottom: 6,
  },
  categoryPillText: {
    color: APPLE_THEME.primary,
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.3,
  },
  placeName: {
    color: APPLE_THEME.text,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.4,
    fontFamily: TOKENS.font.heading,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
  },
  locationText: {
    color: APPLE_THEME.textMuted,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  footerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingsCap: {
    color: APPLE_THEME.textMuted,
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  bottomRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceMain: {
    color: APPLE_THEME.text,
    fontSize: 15,
    fontFamily: TOKENS.font.heading,
  },
  priceSuffix: {
    color: APPLE_THEME.textMuted,
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
  },
  ctaCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primary,
  },
});
