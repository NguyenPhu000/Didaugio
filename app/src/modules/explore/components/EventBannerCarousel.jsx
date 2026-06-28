import { memo, useCallback, useState, useMemo } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BANNER_H = 170;
const SPRING_CONFIG = TOKENS.spring.press;

function BannerItem({ event, onPress, bannerWidth }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const [imgError, setImgError] = useState(false);

  const rawImage = event?.thumbnail || event?.imageUrl;
  const resolvedUri = rawImage ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 800) : null;
  const imageUri = imgError ? null : resolvedUri;

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

  // Trạng thái thời gian
  const statusText = useMemo(() => {
    const now = Date.now();
    const start = event?.startDate ? new Date(event.startDate).getTime() : null;
    const end = event?.endDate ? new Date(event.endDate).getTime() : null;
    if (start && end) {
      if (now >= start && now <= end) return t("explore.event.ongoing");
      if (now > end) return t("explore.event.ended");
    }
    return t("explore.event.upcoming");
  }, [event?.startDate, event?.endDate, t]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { width: bannerWidth, height: BANNER_H }]}
      className="rounded-[24px] overflow-hidden bg-[#EDEDF2] shadow-sm relative border border-black/5"
    >
      {/* Background Image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          onError={() => setImgError(true)}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <View className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 items-center justify-center">
          <MaterialIconsRounded name="celebration" size={48} color="rgba(255,255,255,0.3)" />
        </View>
      )}

      {/* Shadows */}
      <View className="absolute inset-0 bg-black/10" pointerEvents="none" />
      <View className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" pointerEvents="none" />

      {/* Top Banner Badges */}
      <View className="absolute top-3.5 left-3.5 flex-row items-center gap-2 z-[2]">
        <View className="px-2.5 py-1 rounded-full bg-red-600 border border-red-500 flex-row items-center gap-1 shadow-sm">
          <MaterialIconsRounded name="campaign" size={12} color="#FFFFFF" />
          <Text className="text-white text-[10px] font-bold tracking-wider" style={{ fontFamily: TOKENS.font.bold }}>
            {t("explore.event.featuredBadge")}
          </Text>
        </View>

        <View className="px-2 py-0.5 rounded-full bg-black/40 border border-white/20">
          <Text className="text-white text-[10px] font-semibold" style={{ fontFamily: TOKENS.font.semibold }}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Companion Neon Dot */}
      {event?.activeCompanionCount > 0 ? (
        <View className="absolute top-3.5 right-3.5 z-[2] px-2 py-1 rounded-full bg-black/60 border border-white/10 flex-row items-center gap-1">
          <View className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
          <Text className="text-white text-[9px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
            {t("explore.event.onlineCount", { count: event.activeCompanionCount })}
          </Text>
        </View>
      ) : null}

      {/* Banner Text Info */}
      <View className="absolute bottom-4 left-4 right-4 z-[2] gap-1.5">
        <Text className="text-white text-[18px] leading-[22px] font-bold tracking-tight" style={{ fontFamily: TOKENS.font.heading }} numberOfLines={2}>
          {event?.title}
        </Text>
        
        {event?.description ? (
          <Text className="text-white/80 text-[12px] font-medium" style={{ fontFamily: TOKENS.font.medium }} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-0.5">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <MaterialIconsRounded name="people" size={13} color="rgba(255,255,255,0.8)" />
              <Text className="text-white/90 text-[11px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                {t("explore.event.participants", { count: event?._count?.participants || event?.participantCount || 0 })}
              </Text>
            </View>

            {event?.trip?.destinations?.length > 0 ? (
              <View className="flex-row items-center gap-1">
                <MaterialIconsRounded name="navigation" size={13} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-[11px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {t("explore.event.legs", { count: event.trip.destinations.length })}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Button */}
          <View className="px-3.5 h-7 rounded-full bg-white flex-row items-center justify-center gap-1 shadow-sm">
            <Text className="text-black text-[11px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
              {t("explore.event.viewNow")}
            </Text>
            <MaterialIconsRounded name="arrow-forward" size={12} color="#000000" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `banner-${index}`;

function EventBannerCarouselInner({ events, onPressEvent }) {
  const { width: SCREEN_W } = useWindowDimensions();
  const BANNER_W = SCREEN_W - 32;
  const ITEM_LENGTH = BANNER_W + 12;

  const getItemLayout = (_, index) => ({
    length: ITEM_LENGTH,
    offset: ITEM_LENGTH * index,
    index,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = useMemo(() => Math.min(events?.length || 0, 5), [events]);

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressEvent(item);
      return <BannerItem event={item} onPress={handlePress} bannerWidth={BANNER_W} />;
    },
    [onPressEvent, BANNER_W],
  );

  if (!events?.length) return null;

  return (
    <View className="mt-3 mb-1">
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={Separator}
        onMomentumScrollEnd={(event) => {
          const x = event?.nativeEvent?.contentOffset?.x || 0;
          const nextIndex = Math.max(0, Math.round(x / ITEM_LENGTH));
          setActiveIndex(nextIndex);
        }}
      />

      {dotCount > 1 ? (
        <View className="mt-2.5 flex-row items-center justify-center gap-1.5">
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                className={`h-1.5 rounded-full transition-all duration-150 ${
                  active ? "w-5 bg-[#0071E3]" : "w-1.5 bg-black/10"
                }`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function Separator() {
  return <View className="w-3" />;
}

export const EventBannerCarousel = memo(EventBannerCarouselInner);
