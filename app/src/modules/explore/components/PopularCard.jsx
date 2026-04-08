import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
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
  formatPriceLine,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRIMARY = "#101E2C";
const TEXT_COLOR = "#191C1E";
const TEXT_MUTED = "#54647A";

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
          <MaterialIcons name="place" size={13} color={PRIMARY} />
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
    borderRadius: 34,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.5)",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  imageWrap: {
    width: 94,
    height: 94,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#D0E1FB",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D0E1FB",
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
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  name: {
    color: TEXT_COLOR,
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
    color: TEXT_MUTED,
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
    color: PRIMARY,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: TOKENS.font.heading,
  },
  priceSuffix: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  ctaBtn: {
    height: 38,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: TOKENS.font.semibold,
  },
});
