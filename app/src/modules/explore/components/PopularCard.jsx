import { memo, useCallback, useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
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

const SPRING_CONFIG = TOKENS.spring.press;

function PopularCardInner({ place, onPress, index = 0 }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);
  const imageUri = resolvePlaceImageUri(place);
  const location = getPlaceLocation(place) || "Cần Thơ";
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingMeta = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);

  useEffect(() => {
    const delay = 100 + index * 70;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 320 }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, TOKENS.spring.entrance),
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
      className="flex-row items-center gap-4 rounded-[28px] p-3 bg-white border-[0.5px] border-[#D2D2D7] shadow-sm elevation-2"
    >
      {/* Thumbnail */}
      <View className="w-[110px] h-[110px] rounded-[22px] overflow-hidden bg-[#EDEDF2]">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={240}
            cachePolicy="memory-disk"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
          />
        ) : (
          <View className="absolute inset-0 bg-[#EDEDF2] items-center justify-center">
            <MaterialIcons
              name="travel-explore"
              size={28}
              color="rgba(0,0,0,0.15)"
            />
          </View>
        )}
        {/* Subtle gradient on thumbnail */}
        <View className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/5" pointerEvents="none" />
      </View>

      {/* Info column */}
      <View className="flex-1 min-w-0 gap-0.5">
        {/* Rating */}
        <View className="flex-row items-center gap-1">
          <MaterialIcons
            name="star"
            size={13}
            color={hasRating ? "#F59E0B" : APPLE_THEME.textMuted}
          />
          <Text className="text-black/50 text-[11px] font-semibold tracking-[0.3px]" style={{ fontFamily: TOKENS.font.semibold }}>
            {hasRating ? `${rating.toFixed(1)} · ${ratingMeta}` : "Mới"}
          </Text>
        </View>

        {/* Place name */}
        <Text className="text-[#1D1D1F] text-base leading-[21px] tracking-[-0.4px] font-bold" style={{ fontFamily: TOKENS.font.heading }} numberOfLines={2}>
          {place?.name}
        </Text>

        {/* Location */}
        <View className="flex-row items-center gap-0.5">
          <MaterialIcons name="place" size={12} color={APPLE_THEME.textMuted} />
          <Text className="text-[#1D1D1F]/50 text-xs font-medium flex-1" style={{ fontFamily: TOKENS.font.medium }} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Bottom: price + CTA */}
        <View className="mt-1.5 flex-row items-center justify-between gap-2.5">
          <View className="flex-row items-baseline gap-0.5 shrink">
            {priceLine ? (
              <>
                <Text className="text-[#1D1D1F] text-[15px] leading-5 font-bold tracking-[-0.2px]" style={{ fontFamily: TOKENS.font.heading }}>{priceLine.main}</Text>
                {priceLine.suffix ? (
                  <Text className="text-[#1D1D1F]/50 text-[11px] font-medium" style={{ fontFamily: TOKENS.font.medium }}>{priceLine.suffix}</Text>
                ) : null}
              </>
            ) : (
              <Text className="text-[#1D1D1F] text-[15px] leading-5 font-bold tracking-[-0.2px]" style={{ fontFamily: TOKENS.font.heading }}>Liên hệ</Text>
            )}
          </View>

          <View className="flex-row items-center gap-1 h-9 rounded-full bg-[#1D1D1F] px-4 shadow-sm elevation-2">
            <Text className="text-white text-xs font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>Xem</Text>
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
