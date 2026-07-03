import { memo, useCallback } from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { resolvePlaceImageUri, getOptimizedCloudinaryUrl } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatRatingLabel,
  formatPriceLine,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PAD = 24;
const CARD_H = 380;

const SPRING_CONFIG = TOKENS.spring.press;

function FeaturedCardInner({ place, onPress, onSave, isSaved }) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = Math.min(280, SCREEN_W - PAD * 2 - 16);
  const scale = useSharedValue(1);
  const rawImageUri = resolvePlaceImageUri(place);
  const imageUri = rawImageUri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(rawImageUri, 600)
    : rawImageUri;
  const location = getPlaceLocation(place);
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingCap = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);
  const categoryName = place?.category?.name || t("explore.card.recommended");

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave?.(place);
  }, [onSave, place]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          width: CARD_W,
          height: CARD_H,
          borderCurve: "continuous",
          ...Platform.select({
            ios: TOKENS.shadow.md,
            android: { elevation: 8 },
          }),
        },
      ]}
      className="rounded-[28px] overflow-hidden relative"
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: APPLE_THEME.surfaceMuted }}
        >
          <MaterialIconsRounded
            name="travel-explore"
            size={44}
            color={APPLE_THEME.textMuted}
          />
        </View>
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent"]}
        locations={[0, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: "40%" }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        locations={[0, 1]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" }}
        pointerEvents="none"
      />

      <View className="absolute top-3.5 left-3.5 z-[3] h-7 rounded-full overflow-hidden border-[0.5px] border-white/30">
        <BlurView
          intensity={70}
          tint="dark"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="flex-1 flex-row items-center gap-1 px-2.5">
          <MaterialIconsRounded name="bolt" size={12} color={TOKENS.color.warning} />
          <Text
            className="text-white text-[11px] font-semibold"
            style={{ fontFamily: TOKENS.font.semibold }}
          >
            {t("explore.card.featuredBadge")}
          </Text>
        </View>
      </View>

      {hasRating ? (
        <View className="absolute top-3.5 left-[94px] z-[3] h-7 rounded-full overflow-hidden border-[0.5px] border-white/30">
          <BlurView
            intensity={70}
            tint="dark"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="flex-1 flex-row items-center gap-1 px-2.5">
            <MaterialIconsRounded name="star" size={12} color={TOKENS.color.warning} />
            <Text
              className="text-white text-[11px] font-semibold"
              style={{ fontFamily: TOKENS.font.semibold }}
            >
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={handleSave}
        hitSlop={8}
        className="absolute top-3.5 right-3.5 z-[3] w-[34px] h-[34px] rounded-full items-center justify-center overflow-hidden border-[0.5px] border-white/35"
      >
        <BlurView
          intensity={60}
          tint="dark"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <MaterialIconsRounded
          name={isSaved ? "favorite" : "favorite-border"}
          size={17}
          color={isSaved ? APPLE_THEME.danger : APPLE_THEME.white}
        />
      </Pressable>

      <View className="absolute left-2.5 right-2.5 bottom-2.5 z-[3] rounded-[20px] overflow-hidden border-[0.5px] border-white/60">
        <BlurView intensity={85} tint="light" style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
          <View
            className="self-start h-[22px] px-2.5 rounded-full justify-center mb-1.5"
            style={{ backgroundColor: APPLE_THEME.primaryTint }}
          >
            <Text
              className="text-[10px] font-semibold tracking-[0.3px]"
              style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.semibold }}
              numberOfLines={1}
            >
              {categoryName}
            </Text>
          </View>

          <Text
            className="text-base leading-[21px] tracking-[-0.4px] font-bold mb-0.5"
            style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
            numberOfLines={2}
          >
            {place?.name}
          </Text>

          {location ? (
            <View className="flex-row items-center gap-0.5 mb-2">
              <MaterialIconsRounded name="place" size={12} color={APPLE_THEME.textMuted} />
              <Text
                className="text-[11px] font-medium flex-1"
                style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.medium }}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          ) : null}

          <View className="flex-row justify-between items-center">
            <Text
              className="text-[10px] font-semibold tracking-[0.5px]"
              style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.semibold }}
            >
              {ratingCap}
            </Text>
            <View className="flex-row items-center gap-2">
              {priceLine ? (
                <View className="flex-row items-baseline gap-0.5">
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
                  >
                    {priceLine.main}
                  </Text>
                  {priceLine.suffix ? (
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.medium }}
                    >
                      {priceLine.suffix}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <View
                className="w-[30px] h-[30px] rounded-full items-center justify-center"
                style={{ backgroundColor: APPLE_THEME.text }}
              >
                <MaterialIconsRounded name="arrow-forward" size={14} color={APPLE_THEME.white} />
              </View>
            </View>
          </View>
        </BlurView>
      </View>
    </AnimatedPressable>
  );
}

export const FeaturedCard = memo(FeaturedCardInner);
export { CARD_H as FEATURED_CARD_H };
