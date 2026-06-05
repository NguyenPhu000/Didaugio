import { memo, useCallback, useState, useMemo } from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
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

const SCREEN_W = Dimensions.get("window").width;
const BANNER_W = SCREEN_W - 32; // margin 16 mỗi bên
const BANNER_H = 170;
const ITEM_LENGTH = BANNER_W + 12; // banner + separator

const SPRING_CONFIG = TOKENS.spring.press;

function BannerItem({ event, onPress }) {
  const scale = useSharedValue(1);

  const rawImage = event?.thumbnail || event?.imageUrl;
  const imageUri = rawImage ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 800) : "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80";

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
  const now = new Date();
  const start = event?.startDate ? new Date(event.startDate) : null;
  const end = event?.endDate ? new Date(event.endDate) : null;

  let statusText = "Sắp diễn ra";
  if (start && end) {
    if (now >= start && now <= end) {
      statusText = "Đang diễn ra";
    } else if (now > end) {
      statusText = "Đã kết thúc";
    }
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { width: BANNER_W, height: BANNER_H }]}
      className="rounded-[24px] overflow-hidden bg-[#EDEDF2] shadow-sm relative border border-black/5"
    >
      {/* Background Image */}
      <Image
        source={{ uri: imageUri }}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" }}
      />

      {/* Shadows */}
      <View className="absolute inset-0 bg-black/10" pointerEvents="none" />
      <View className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" pointerEvents="none" />

      {/* Top Banner Badges */}
      <View className="absolute top-3.5 left-3.5 flex-row items-center gap-2 z-[2]">
        <View className="px-2.5 py-1 rounded-full bg-red-600 border border-red-500 flex-row items-center gap-1 shadow-sm">
          <MaterialIconsRounded name="campaign" size={12} color="#FFFFFF" />
          <Text className="text-white text-[10px] font-bold tracking-wider" style={{ fontFamily: TOKENS.font.bold }}>
            SỰ KIỆN NỔI BẬT
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
          <View className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
          <Text className="text-white text-[9px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
            {event.activeCompanionCount} ĐANG ONLINE
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
                {event?._count?.participants || event?.participantCount || 0} đã tham gia
              </Text>
            </View>
            
            {event?.trip?.destinations?.length > 0 ? (
              <View className="flex-row items-center gap-1">
                <MaterialIconsRounded name="navigation" size={13} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/90 text-[11px] font-bold" style={{ fontFamily: TOKENS.font.semibold }}>
                  {event.trip.destinations.length} chặng
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Button */}
          <View className="px-3.5 h-7 rounded-full bg-white flex-row items-center justify-center gap-1 shadow-sm">
            <Text className="text-black text-[11px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>
              Xem ngay
            </Text>
            <MaterialIconsRounded name="arrow-forward" size={12} color="#000000" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const getItemLayout = (_, index) => ({
  length: ITEM_LENGTH,
  offset: ITEM_LENGTH * index,
  index,
});

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `banner-${index}`;

function EventBannerCarouselInner({ events, onPressEvent }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = useMemo(() => Math.min(events?.length || 0, 5), [events]);

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressEvent(item);
      return <BannerItem event={item} onPress={handlePress} />;
    },
    [onPressEvent],
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
