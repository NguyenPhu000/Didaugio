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
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
  formatPriceLine,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SCREEN_W = Dimensions.get("window").width;
const PAD = 24;
const CARD_W = Math.min(312, SCREEN_W - PAD * 2 - 20);
const CARD_H = 404;
const PRIMARY = "#101E2C";
const TEXT_COLOR = "#191C1E";
const TEXT_MUTED = "#54647A";

const SPRING_CONFIG = { damping: 15, stiffness: 200 };

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
    scale.value = withSpring(0.965, SPRING_CONFIG);
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
            size={48}
            color="rgba(255,255,255,0.3)"
          />
        </View>
      )}

      {/* Gradient overlay */}
      <View style={styles.gradientTop} pointerEvents="none" />
      <View style={styles.gradientBottom} pointerEvents="none" />
      <View style={styles.atmosphereGlowA} pointerEvents="none" />
      <View style={styles.atmosphereGlowB} pointerEvents="none" />

      {/* Top-right action */}
      <View style={styles.favoriteBtn} pointerEvents="none">
        <MaterialIcons name="favorite-border" size={18} color="#FFFFFF" />
      </View>

      {/* Featured badge */}
      <View style={styles.featuredBadge}>
        <MaterialIcons name="bolt" size={12} color="#FACC15" />
        <Text style={styles.featuredBadgeText}>Nổi bật</Text>
      </View>

      {/* Rating badge */}
      {hasRating ? (
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={13} color="#FBBF24" />
          <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
        </View>
      ) : null}

      {/* Glassmorphic footer */}
      <View style={styles.footer}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        <View style={styles.footerTopRow}>
          <View style={styles.footerTextCol}>
            <Text style={styles.placeName} numberOfLines={2}>
              {place?.name}
            </Text>
            {location ? (
              <View style={styles.locationRow}>
                <MaterialIcons name="place" size={13} color={PRIMARY} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

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
              <MaterialIcons name="arrow-forward" size={14} color={PRIMARY} />
            </View>
          </View>
        </View>
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
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#E0E3E5",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.52)",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.12,
        shadowRadius: 34,
      },
      android: { elevation: 13 },
    }),
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D0E1FB",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(0,3,8,0.2)",
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "rgba(0,3,8,0.66)",
  },
  atmosphereGlowA: {
    position: "absolute",
    top: -70,
    right: -48,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "rgba(208,225,251,0.28)",
  },
  atmosphereGlowB: {
    position: "absolute",
    bottom: -86,
    left: -64,
    width: 236,
    height: 236,
    borderRadius: 999,
    backgroundColor: "rgba(82,96,112,0.2)",
  },
  favoriteBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  ratingBadge: {
    position: "absolute",
    top: 14,
    left: 98,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ratingBadgeText: {
    color: "#92400E",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: TOKENS.radius.pill,
    backgroundColor: "rgba(16,30,44,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  footer: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderWidth: 1,
    borderColor: "rgba(224,227,229,0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
    }),
  },
  categoryPill: {
    alignSelf: "flex-start",
    maxWidth: "75%",
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.65)",
    marginBottom: 7,
  },
  categoryPillText: {
    color: "#101E2C",
    fontSize: 10,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  footerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    color: TEXT_COLOR,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
    fontFamily: TOKENS.font.heading,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
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
    color: TEXT_COLOR,
    fontSize: 16,
    fontFamily: TOKENS.font.heading,
  },
  priceSuffix: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
    marginLeft: 1,
  },
  ctaCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242,244,246,0.96)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.75)",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
});
