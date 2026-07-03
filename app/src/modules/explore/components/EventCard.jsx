import { memo, useCallback, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
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
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../../lib/media-url";
import { formatDayMonthNumeric, formatDayMonth } from "@/utils/dateFormat";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = Math.min(280, SCREEN_W - 48);
const CARD_H = 220;

const SPRING_CONFIG = TOKENS.spring.press;

function EventCardInner({ event, onPress }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const [imgError, setImgError] = useState(false);

  const rawImage = event?.thumbnail || event?.imageUrl;
  const resolvedUri = rawImage ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 600) : null;
  const imageUri = imgError ? null : resolvedUri;

  const startDateStr = event?.startDate ? formatDayMonthNumeric(event.startDate) : "";
  const endDateStr = event?.endDate ? formatDayMonth(event.endDate) : "";

  const dateRange = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : "";

  const now = new Date();
  const start = event?.startDate ? new Date(event.startDate) : null;
  const end = event?.endDate ? new Date(event.endDate) : null;

  let statusText = t("explore.event.upcoming");
  let statusColor = APPLE_THEME.focusBlue;
  let statusBg = "rgba(0, 113, 227, 0.15)";

  if (start && end) {
    if (now >= start && now <= end) {
      statusText = t("explore.event.ongoing");
      statusColor = APPLE_THEME.success;
      statusBg = "rgba(52, 199, 89, 0.15)";
    } else if (now > end) {
      statusText = t("explore.event.ended");
      statusColor = APPLE_THEME.textMuted;
      statusBg = "rgba(142, 142, 147, 0.15)";
    }
  }

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

  const participantCount = event?._count?.participants || event?.participantCount || 0;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { width: CARD_W, height: CARD_H }]}
      className="rounded-[24px] overflow-hidden bg-[#EDEDF2] shadow-sm relative border border-black/5"
    >
      {/* Background Image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setImgError(true)}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <View className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 items-center justify-center">
          <MaterialIconsRounded name="celebration" size={36} color="rgba(255,255,255,0.3)" />
        </View>
      )}

      {/* Shadows */}
      <View className="absolute inset-0 bg-black/20" pointerEvents="none" />
      <View className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/80 via-black/40 to-transparent" pointerEvents="none" />

      {/* Top badges */}
      <View className="absolute top-3 left-3 right-3 flex-row justify-between items-center z-[2]">
        {/* Status Badge */}
        <View 
          className="px-2.5 py-1 rounded-full items-center justify-center border border-white/20"
          style={{ backgroundColor: statusBg }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: statusColor, fontFamily: TOKENS.font.semibold }}>
            {statusText}
          </Text>
        </View>

        {/* Companion count */}
        {event?.activeCompanionCount > 0 ? (
          <View className="px-2 py-1 rounded-full bg-black/60 border border-white/10 flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-success" />
            <Text className="text-white text-[10px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
              {event.activeCompanionCount} online
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Information */}
      <View className="absolute bottom-3.5 left-3.5 right-3.5 z-[2] gap-1">
        {/* Date Range */}
        {dateRange ? (
          <View className="flex-row items-center gap-1">
            <MaterialIconsRounded name="calendar-today" size={10} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/70 text-[11px] font-medium" style={{ fontFamily: TOKENS.font.medium }}>
              {dateRange}
            </Text>
          </View>
        ) : null}

        {/* Title */}
        <Text className="text-white text-base leading-[20px] font-bold tracking-tight" style={{ fontFamily: TOKENS.font.heading }} numberOfLines={2}>
          {event?.title}
        </Text>

        {/* Stats Row */}
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-0.5">
              <MaterialIconsRounded name="people" size={12} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/90 text-[11px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
                {t("explore.event.participants", { count: participantCount })}
              </Text>
            </View>

            {event?.trip?.destinations?.length > 0 ? (
              <View className="flex-row items-center gap-0.5">
                <MaterialIconsRounded name="map" size={12} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-[11px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {t("explore.event.legs", { count: event.trip.destinations.length })}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="w-6 h-6 rounded-full bg-white/20 items-center justify-center border border-white/30">
            <MaterialIconsRounded name="chevron-right" size={16} color={APPLE_THEME.white} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const EventCard = memo(EventCardInner);
export { CARD_W as EVENT_CARD_W, CARD_H as EVENT_CARD_H };
