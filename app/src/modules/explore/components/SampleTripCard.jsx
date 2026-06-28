import { memo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
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
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SAMPLE_TRIP_CARD_W = 220;
const CARD_H = 240;

function SampleTripCardInner({ trip, onPress }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const TRAVEL_STYLE_LABEL = {
    adventure: t("explore.sampleTrip.adventure"),
    culture: t("explore.sampleTrip.culture"),
    relax: t("explore.sampleTrip.relax"),
    food: t("explore.sampleTrip.food"),
    family: t("explore.sampleTrip.family"),
    budget: t("explore.sampleTrip.budget"),
    luxury: t("explore.sampleTrip.luxury"),
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(trip);
  }, [trip, onPress]);

  const rawImage = trip?.thumbnail;
  const imageUri = rawImage
    ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 400)
    : "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=70";

  const destinationNames = (trip?.destinations || [])
    .map((d) => d?.place?.name)
    .filter(Boolean);

  const styleLabel = trip?.travelStyle
    ? TRAVEL_STYLE_LABEL[trip.travelStyle] || trip.travelStyle
    : null;

  const costText =
    trip?.estimatedCost != null
      ? `${(trip.estimatedCost / 1000).toFixed(0)}K`
      : null;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, { width: SAMPLE_TRIP_CARD_W, height: CARD_H }]}
      className="rounded-[20px] overflow-hidden bg-[#EDEDF2] shadow-sm border border-black/5"
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
      />

      {/* Overlay */}
      <View className="absolute inset-0 bg-black/15" pointerEvents="none" />
      <View
        className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        pointerEvents="none"
      />

      {/* Badge style */}
      {styleLabel ? (
        <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary border border-primary/60">
          <Text
            className="text-white text-[10px] font-bold"
            style={{ fontFamily: TOKENS.font.bold }}
          >
            {styleLabel.toUpperCase()}
          </Text>
        </View>
      ) : null}

      {/* Info */}
      <View className="absolute bottom-3.5 left-3.5 right-3.5 gap-1">
        <Text
          className="text-white text-[15px] font-bold leading-[19px] tracking-tight"
          style={{ fontFamily: TOKENS.font.heading }}
          numberOfLines={2}
        >
          {trip?.title}
        </Text>

        {/* Destinations */}
        {destinationNames.length > 0 ? (
          <Text
            className="text-white/70 text-[11px]"
            style={{ fontFamily: TOKENS.font.medium }}
            numberOfLines={1}
          >
            {destinationNames.join(" · ")}
          </Text>
        ) : null}

        {/* Days + Cost */}
        <View className="flex-row items-center gap-2 mt-0.5">
          {trip?.totalDays ? (
            <View className="px-2 py-0.5 rounded-full bg-white/20 border border-white/20">
              <Text
                className="text-white text-[10px] font-semibold"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("explore.sampleTrip.days", { count: trip.totalDays })}
              </Text>
            </View>
          ) : null}
          {costText ? (
            <View className="px-2 py-0.5 rounded-full bg-white/20 border border-white/20">
              <Text
                className="text-white text-[10px] font-semibold"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("explore.sampleTrip.from", { price: costText })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const SampleTripCard = memo(SampleTripCardInner);
