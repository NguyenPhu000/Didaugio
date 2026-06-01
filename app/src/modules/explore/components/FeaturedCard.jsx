import { memo, useCallback, useEffect } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
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

const SPRING_CONFIG = TOKENS.spring.press;

function FeaturedCardInner({ place, onPress, index = 0 }) {
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

  const shadowStyle = {
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { width: CARD_W, height: CARD_H }]}
      className="rounded-[32px] overflow-hidden bg-[#EDEDF2] shadow-lg elevation-10 relative"
    >
      {/* Image background */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <View className="absolute inset-0 bg-[#EDEDF2] items-center justify-center">
          <MaterialIconsRounded
            name="travel-explore"
            size={44}
            color="rgba(255,255,255,0.25)"
          />
        </View>
      )}

      {/* Cinematic gradients */}
      <View className="absolute top-0 left-0 right-0 h-[35%] bg-black/[0.18]" pointerEvents="none" />
      <View className="absolute bottom-0 left-0 right-0 h-[65%] bg-black/[0.55]" pointerEvents="none" />

      {/* Featured badge — dark glass pill */}
      <View className="absolute top-3.5 left-3.5 z-[3] h-7 rounded-full overflow-hidden border-[0.5px] border-white/30">
        <BlurView
          intensity={70}
          tint="dark"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="flex-1 flex-row items-center gap-1 px-2.5">
          <MaterialIconsRounded name="bolt" size={12} color="#FACC15" />
          <Text className="text-white text-[11px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
            Nổi bật
          </Text>
        </View>
      </View>

      {/* Rating badge — dark glass pill */}
      {hasRating ? (
        <View className="absolute top-3.5 left-[94px] z-[3] h-7 rounded-full overflow-hidden border-[0.5px] border-white/30">
          <BlurView
            intensity={70}
            tint="dark"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="flex-1 flex-row items-center gap-1 px-2.5">
            <MaterialIconsRounded name="star" size={12} color="#FBBF24" />
            <Text className="text-white text-[11px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
              {rating.toFixed(1)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Favourite button */}
      <View className="absolute top-3.5 right-3.5 z-[3] w-[34px] h-[34px] rounded-full items-center justify-center overflow-hidden border-[0.5px] border-white/35">
        <BlurView
          intensity={60}
          tint="dark"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <MaterialIconsRounded name="favorite-border" size={17} color="#FFFFFF" />
      </View>

      {/* Footer: frosted glass */}
      <View className="absolute left-2.5 right-2.5 bottom-2.5 z-[3] rounded-[22px] overflow-hidden border-[0.5px] border-white/60">
        <BlurView intensity={85} tint="light" style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
          {/* Category pill */}
          <View className="self-start h-[22px] px-2.5 rounded-full justify-center bg-black/5 border-[0.5px] border-[#D2D2D7] mb-1.5">
            <Text className="text-[#1D1D1F] text-[10px] font-semibold tracking-[0.3px]" style={{ fontFamily: TOKENS.font.semibold }} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>

          {/* Name & location */}
          <Text className="text-[#1D1D1F] text-base leading-[21px] tracking-[-0.4px] font-bold mb-0.5" style={{ fontFamily: TOKENS.font.heading }} numberOfLines={2}>
            {place?.name}
          </Text>

          {location ? (
            <View className="flex-row items-center gap-0.5 mb-2">
              <MaterialIconsRounded
                name="place"
                size={12}
                color={APPLE_THEME.textMuted}
              />
              <Text className="text-[#1D1D1F]/50 text-[11px] font-medium flex-1" style={{ fontFamily: TOKENS.font.medium }} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          {/* Bottom row */}
          <View className="flex-row justify-between items-center">
            <Text className="text-[#1D1D1F]/50 text-[10px] font-semibold tracking-[0.5px]" style={{ fontFamily: TOKENS.font.semibold }}>
              {ratingCap}
            </Text>
            <View className="flex-row items-center gap-2">
              {priceLine ? (
                <View className="flex-row items-baseline gap-0.5">
                  <Text className="text-[#1D1D1F] text-[15px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>
                    {priceLine.main}
                  </Text>
                  {priceLine.suffix ? (
                    <Text className="text-[#1D1D1F]/50 text-[10px] font-medium" style={{ fontFamily: TOKENS.font.medium }}>
                      {priceLine.suffix}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <View className="w-[30px] h-[30px] rounded-full items-center justify-center bg-[#1D1D1F]">
                <MaterialIconsRounded
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
