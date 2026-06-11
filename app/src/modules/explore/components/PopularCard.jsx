import { memo, useCallback } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
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
import { TAB_THEME } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri, getOptimizedCloudinaryUrl } from "../../../lib/media-url";
import {
  getPlaceLocation,
  formatPriceLine,
  formatRatingLabel,
} from "../utils/exploreHelpers";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.press;
const THUMB_W = 108;
const THUMB_H = 120;

function PopularCardInner({ place, onPress }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const rawImageUri = resolvePlaceImageUri(place);
  const imageUri = rawImageUri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(rawImageUri, 250)
    : rawImageUri;
  const location = getPlaceLocation(place) || t("explore.header.location");
  const rating = Number(place?.ratingAvg ?? place?.averageRating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingMeta = formatRatingLabel(place);
  const priceLine = formatPriceLine(place);
  const categoryName = place?.category?.name;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
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
      style={[
        animatedStyle,
        {
          borderCurve: "continuous",
          borderColor: APPLE_THEME.border,
          ...Platform.select({
            ios: TOKENS.shadow.sm,
            android: { elevation: 2 },
          }),
        },
      ]}
      className="flex-row items-center gap-3.5 rounded-[24px] p-3 bg-white border-[0.5px]"
    >
      <View
        className="overflow-hidden"
        style={{
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: 18,
          borderCurve: "continuous",
          backgroundColor: APPLE_THEME.surfaceMuted,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={240}
            cachePolicy="memory-disk"
            style={{ width: THUMB_W, height: THUMB_H }}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{ width: THUMB_W, height: THUMB_H }}
          >
            <MaterialIconsRounded
              name="travel-explore"
              size={28}
              color={APPLE_THEME.textMuted}
            />
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0 gap-1">
        {categoryName ? (
          <View
            className="self-start px-2 h-5 rounded-full justify-center"
            style={{ backgroundColor: TOKENS.color.overlay.blue }}
          >
            <Text
              className="text-[10px] font-semibold"
              style={{ color: APPLE_THEME.focusBlue, fontFamily: TOKENS.font.semibold }}
              numberOfLines={1}
            >
              {categoryName}
            </Text>
          </View>
        ) : null}

        <Text
          className="text-base leading-[21px] tracking-[-0.3px] font-bold"
          style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
          numberOfLines={2}
        >
          {place?.name}
        </Text>

        <View className="flex-row items-center gap-0.5">
          <MaterialIconsRounded name="place" size={12} color={TAB_THEME.textMuted} />
          <Text
            className="text-xs font-medium flex-1"
            style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.medium }}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <MaterialIconsRounded
            name="star"
            size={13}
            color={hasRating ? TOKENS.color.warning : APPLE_THEME.textMuted}
          />
          <Text
            className="text-[11px] font-semibold"
            style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.semibold }}
          >
            {hasRating ? `${rating.toFixed(1)} · ${ratingMeta}` : ratingMeta}
          </Text>
        </View>

        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <View className="flex-row items-baseline gap-0.5 shrink">
            {priceLine ? (
              <>
                <Text
                  className="text-[15px] leading-5 font-bold tracking-[-0.2px]"
                  style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
                >
                  {priceLine.main}
                </Text>
                {priceLine.suffix ? (
                  <Text
                    className="text-[11px] font-medium"
                    style={{ color: APPLE_THEME.textMuted, fontFamily: TOKENS.font.medium }}
                  >
                    {priceLine.suffix}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text
                className="text-[15px] leading-5 font-bold"
                style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
              >
                {t("explore.card.contact")}
              </Text>
            )}
          </View>

          <View
            className="flex-row items-center gap-1 h-8 rounded-full px-3.5"
            style={{ backgroundColor: APPLE_THEME.text }}
          >
            <Text
              className="text-white text-xs font-semibold"
              style={{ fontFamily: TOKENS.font.semibold }}
            >
              {t("explore.card.view")}
            </Text>
            <MaterialIconsRounded name="arrow-forward" size={13} color={APPLE_THEME.white} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const PopularCard = memo(PopularCardInner);
