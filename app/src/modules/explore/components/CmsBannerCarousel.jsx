import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolveMediaUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const BANNER_H = 200;
const AUTO_SCROLL_INTERVAL = 10000;

const GRADIENT_COLORS = {
  background: ["#1B4332", "#0F1419"],
  overlay: ["rgba(15,23,42,0)", "rgba(15,23,42,0.85)"],
  imageFade: ["rgba(15,20,25,1)", "rgba(15,20,25,0.5)", "rgba(15,20,25,0)"],
};

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
  const { t } = useTranslation();
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
  const hasImage = !!imageUri;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        animatedStyle,
        {
          width,
          height: BANNER_H,
          borderRadius: TOKENS.radius.xl,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: GRADIENT_COLORS.background[0],
          ...(Platform.OS === "ios" ? TOKENS.shadow.lg : null),
        },
      ]}
    >
      {/* Deep forest green → black gradient background */}
      <LinearGradient
        colors={GRADIENT_COLORS.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Right-side image blended into dark background */}
      {hasImage ? (
        <>
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "55%",
              height: "100%",
            }}
          />
          {/* Image fade — blends image into dark background from right to left */}
          <LinearGradient
            colors={GRADIENT_COLORS.imageFade}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", inset: 0 }}
            pointerEvents="none"
          />
        </>
      ) : null}

      {/* Bottom-up shadow overlay for text readability */}
      <LinearGradient
        colors={GRADIENT_COLORS.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
        pointerEvents="none"
      />

      {/* Fallback badge */}
      {banner.isFallback ? (
        <View
          style={{
            position: "absolute",
            top: TOKENS.space[4],
            left: TOKENS.space[4],
            paddingHorizontal: TOKENS.space[3],
            paddingVertical: TOKENS.space[1],
            borderRadius: TOKENS.radius.full,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <Text
            style={{
              color: APPLE_THEME.white,
              fontSize: TOKENS.fontSize.xs,
              fontFamily: TOKENS.font.semibold,
              letterSpacing: 1.5,
            }}
          >
            ĐI ĐÂU GIỜ
          </Text>
        </View>
      ) : null}

      {/* Content — left-aligned */}
      <View
        style={{
          position: "absolute",
          bottom: TOKENS.space[5],
          left: TOKENS.space[5],
          right: hasImage ? "50%" : TOKENS.space[5],
        }}
      >
        <Text
          style={{
            color: APPLE_THEME.white,
            fontSize: TOKENS.fontSize["2xl"],
            lineHeight: 28,
            fontFamily: TOKENS.font.heading,
            letterSpacing: -0.3,
          }}
          numberOfLines={2}
        >
          {banner.title}
        </Text>

        {banner.description ? (
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: TOKENS.fontSize.sm,
              lineHeight: 18,
              fontFamily: TOKENS.font.medium,
              marginTop: TOKENS.space[1.5] || 6,
            }}
            numberOfLines={2}
          >
            {banner.description}
          </Text>
        ) : null}

        {/* CTA Button — beige rounded with dark text + arrow */}
        {banner.linkType && banner.linkType !== "none" ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: TOKENS.space[3],
              paddingHorizontal: TOKENS.space[4],
              paddingVertical: TOKENS.space[2],
              borderRadius: TOKENS.radius.button,
              borderCurve: "continuous",
              backgroundColor: "#F5F0E8",
              gap: TOKENS.space[1.5] || 6,
            }}
          >
            <Text
              style={{
                color: APPLE_THEME.primary,
                fontSize: TOKENS.fontSize.sm,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("explore.heroBanner.cta")}
            </Text>
            <MaterialIconsRounded
              name="arrow-forward"
              size={14}
              color={APPLE_THEME.primary}
            />
          </View>
        ) : null}
      </View>
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
        <View style={{ marginTop: TOKENS.space[2.5] || 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {banners.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                style={{
                  height: 6,
                  borderRadius: TOKENS.radius.full,
                  width: active ? 20 : 6,
                  backgroundColor: active ? APPLE_THEME.focusBlue : "rgba(0,0,0,0.12)",
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const CmsBannerCarousel = memo(CmsBannerCarouselInner);
