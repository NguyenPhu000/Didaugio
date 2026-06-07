import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
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
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolveMediaUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const BANNER_H = 180;
const AUTO_SCROLL_INTERVAL = 10000;

// Fallback banner khi admin chưa tạo banner nào
const FALLBACK_BANNER = {
  id: "fallback",
  title: "Đi Đâu Giờ?",
  description: "Khám phá hàng trăm địa điểm hấp dẫn tại Cần Thơ",
  imageUrl: null,
  linkType: "none",
  linkValue: null,
  isFallback: true,
};

function BannerSlide({ banner, width, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (banner.isFallback) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(banner);
  }, [banner, onPress]);

  const rawImage = banner.imageUrl || banner.imageData;
  const imageUri = resolveMediaUrl(rawImage);
  const imageSource = imageUri ? { uri: imageUri } : null;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, { width, height: BANNER_H }]}
      className="rounded-[22px] overflow-hidden bg-[#1D1D1F] relative"
    >
      {imageSource ? (
        <Image
          source={imageSource}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      ) : (
        // Fallback gradient background khi không có ảnh
        <View
          className="absolute inset-0 w-full h-full"
          style={{ backgroundColor: APPLE_THEME.focusBlue }}
        />
      )}

      {/* Dark overlay */}
      <View className="absolute inset-0 bg-black/30" pointerEvents="none" />
      <View
        className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        pointerEvents="none"
      />

      {/* Nội dung */}
      <View className="absolute bottom-4 left-4 right-4">
        {banner.isFallback && (
          <View className="mb-1.5 self-start px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30">
            <Text
              className="text-white text-[10px] font-bold tracking-widest"
              style={{ fontFamily: TOKENS.font.bold }}
            >
              DU LICH CAN THO
            </Text>
          </View>
        )}
        <Text
          className="text-white text-[19px] leading-[24px] font-bold tracking-tight"
          style={{ fontFamily: TOKENS.font.heading }}
          numberOfLines={2}
        >
          {banner.title}
        </Text>
        {banner.description ? (
          <Text
            className="text-white/75 text-[12px] mt-1 font-medium"
            style={{ fontFamily: TOKENS.font.medium }}
            numberOfLines={1}
          >
            {banner.description}
          </Text>
        ) : null}
      </View>

      {/* CTA arrow nếu có link */}
      {banner.linkType && banner.linkType !== "none" ? (
        <View className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/20 border border-white/30 items-center justify-center">
          <Text className="text-white text-[14px]">›</Text>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const keyExtractor = (item) => String(item.id);

function CmsBannerCarouselInner({ banners: rawBanners, onPressBanner }) {
  const { width: screenWidth } = useWindowDimensions();
  const BANNER_W = screenWidth - TAB_SCREEN_PADDING * 2;

  // Nếu không có banner → dùng fallback
  const banners = rawBanners?.length > 0 ? rawBanners : [FALLBACK_BANNER];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoScrollTimer = useRef(null);

  // Auto-scroll mỗi 4 giây
  useEffect(() => {
    if (banners.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(autoScrollTimer.current);
  }, [banners.length]);

  const renderItem = useCallback(
    ({ item }) => (
      <BannerSlide
        banner={item}
        width={BANNER_W}
        onPress={onPressBanner}
      />
    ),
    [BANNER_W, onPressBanner]
  );

  const getItemLayout = useCallback(
    (_, index) => ({ length: BANNER_W, offset: BANNER_W * index, index }),
    [BANNER_W]
  );

  const onMomentumScrollEnd = useCallback((e) => {
    const x = e?.nativeEvent?.contentOffset?.x || 0;
    const next = Math.round(x / BANNER_W);
    setActiveIndex(next);
    // Reset auto-scroll timer khi user tự cuộn
    clearInterval(autoScrollTimer.current);
  }, [BANNER_W]);

  return (
    <View className="mt-3 mb-1">
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_W}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: TAB_SCREEN_PADDING }}
        ItemSeparatorComponent={null}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      {/* Dot indicator */}
      {banners.length > 1 ? (
        <View className="mt-2.5 flex-row items-center justify-center gap-1.5">
          {banners.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                className={`h-1.5 rounded-full ${
                  active ? "w-5 bg-[#0071E3]" : "w-1.5 bg-black/12"
                }`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const CmsBannerCarousel = memo(CmsBannerCarouselInner);
