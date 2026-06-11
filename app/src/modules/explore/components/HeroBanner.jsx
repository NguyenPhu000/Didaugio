import { memo, useCallback } from "react";
import { Platform, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { Pressable } from "@/components/primitives/Pressable";
import { useTranslation } from "react-i18next";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { resolveMediaUrl } from "../../../lib/media-url";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";

const HERO_HEIGHT = 200;

const DEFAULT_IMAGE_URI =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80&auto=format";

const GRADIENT_COLORS = {
  background: ["#1B4332", "#0F1419"],
  overlay: ["rgba(15,23,42,0)", "rgba(15,23,42,0.85)"],
  imageFade: ["rgba(15,20,25,0)", "rgba(15,20,25,0.6)", "rgba(15,20,25,1)"],
};

function HeroBannerInner({ title, description, onPress, imageUrl }) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const containerWidth = screenWidth - TAB_SCREEN_PADDING * 2;

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const resolvedImageUrl = resolveMediaUrl(imageUrl) || DEFAULT_IMAGE_URI;
  const displayTitle = title || t("explore.heroBanner.title");
  const displayDescription = description || t("explore.heroBanner.description");

  return (
    <Pressable
      haptic="light"
      onPress={handlePress}
      className="rounded-[22px] overflow-hidden"
      style={{
        width: containerWidth,
        height: HERO_HEIGHT,
        borderCurve: "continuous",
        backgroundColor: GRADIENT_COLORS.background[0],
        ...(Platform.OS === "ios" ? TOKENS.shadow.lg : null),
      }}
    >
      {/* Gradient background layer */}
      <LinearGradient
        colors={GRADIENT_COLORS.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {/* Right-side image with soft fade */}
      <Image
        source={{ uri: resolvedImageUrl }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        className="absolute right-0 top-0 h-full"
        style={{ width: "55%" }}
      />

      {/* Image fade overlay — blends image into dark background */}
      <LinearGradient
        colors={GRADIENT_COLORS.imageFade}
        locations={[0, 0.4, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Bottom shadow overlay for text readability */}
      <LinearGradient
        colors={GRADIENT_COLORS.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Content */}
      <View className="absolute bottom-5 left-5 right-[50%]">
        <Text
          className="text-white text-[20px] leading-[28px] font-bold tracking-tight"
          numberOfLines={2}
        >
          {displayTitle}
        </Text>

        <Text
          className="text-white/75 text-sm font-medium mt-1.5"
          numberOfLines={2}
        >
          {displayDescription}
        </Text>

        {/* CTA Button */}
        <View
          className="flex-row items-center self-start mt-3 px-4 py-2 rounded-xl gap-1.5"
          style={{
            borderCurve: "continuous",
            backgroundColor: "#F5F0E8",
          }}
        >
          <Text className="text-sm font-semibold" style={{ color: APPLE_THEME.primary }}>
            {t("explore.heroBanner.cta")}
          </Text>
          <MaterialIconsRounded
            name="arrow-forward"
            size={14}
            color={APPLE_THEME.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

export const HeroBanner = memo(HeroBannerInner);
