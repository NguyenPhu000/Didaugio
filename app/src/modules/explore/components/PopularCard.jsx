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
              size={30}
              color="rgba(255,255,255,0.55)"
            />
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#B45309" />
          <Text style={styles.ratingText}>
            {hasRating ? `${rating.toFixed(1)} (${ratingMeta})` : ratingMeta}
          </Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {place?.name}
        </Text>

        <View style={styles.locationRow}>
          <MaterialIcons name="place" size={13} color={APPLE_THEME.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>

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
            <Text style={styles.ctaText}>ĐẶT NGAY</Text>
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
    gap: 12,
    borderRadius: TOKENS.radius["3xl"],
    padding: 12,
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    ...Platform.select({
      ios: {
        ...TOKENS.shadow.sm,
      },
      android: { elevation: TOKENS.shadow.sm.elevation },
    }),
  },
  imageWrap: {
    width: 94,
    height: 94,
    borderRadius: 28,
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
    gap: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  name: {
    color: APPLE_THEME.text,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
    fontFamily: TOKENS.font.heading,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    color: APPLE_THEME.textSecondary,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    flex: 1,
  },
  bottomRow: {
    marginTop: 4,
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
    color: APPLE_THEME.primary,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 2,
    fontFamily: TOKENS.font.heading,
  },
  priceSuffix: {
    color: APPLE_THEME.textMuted,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  ctaBtn: {
    height: 36,
    borderRadius: 999,
    backgroundColor: APPLE_THEME.primary,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.sm,
  },
  ctaText: {
    color: APPLE_THEME.white,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: TOKENS.font.semibold,
  },
});
