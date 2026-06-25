import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
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
const BANNER_H = 220;
const AUTO_SCROLL_INTERVAL = 10000;

const FALLBACK_BANNER = {
  id: "fallback",
  title: null,
  description: null,
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
          borderRadius: 24,
          borderCurve: "continuous",
          overflow: "hidden",
          backgroundColor: APPLE_THEME.surfaceMuted,
        },
      ]}
    >
      {/* Full image - no gradient overlay */}
      {hasImage ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <MaterialIconsRounded name="image" size={48} color={APPLE_THEME.textMuted} />
        </View>
      )}

      {/* Solid dark overlay at bottom for text - only if has content */}
      {banner.title ? (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
      ) : null}

      {/* Fallback badge */}
      {banner.isFallback ? (
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 10,
              fontFamily: TOKENS.font.bold,
              letterSpacing: 1.5,
            }}
          >
            {t("explore.cmsBrandBadge")}
          </Text>
        </View>
      ) : null}

      {/* Content - bottom left */}
      {(banner.title || banner.isFallback) ? (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 22,
              lineHeight: 28,
              fontFamily: TOKENS.font.bold,
              letterSpacing: -0.4,
            }}
            numberOfLines={2}
          >
            {banner.title || t("explore.cmsFallbackTitle")}
          </Text>

          {(banner.description || banner.isFallback) ? (
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                lineHeight: 18,
                fontFamily: TOKENS.font.medium,
                marginTop: 6,
              }}
              numberOfLines={2}
            >
              {banner.description || t("explore.cmsFallbackDesc")}
            </Text>
          ) : null}

          {banner.linkType && banner.linkType !== "none" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: "#FFF",
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: APPLE_THEME.text,
                  fontSize: 13,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {t("explore.heroBanner.cta")}
              </Text>
              <MaterialIconsRounded name="arrow-forward" size={14} color={APPLE_THEME.text} />
            </View>
          ) : null}
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const keyExtractor = (item) => String(item.id);

function CmsBannerCarouselInner({ banners: rawBanners, onPressBanner }) {
  const { width: screenWidth } = useWindowDimensions();
  const BANNER_W = screenWidth - TAB_SCREEN_PADDING * 2;

  const banners = rawBanners?.length > 0 ? rawBanners : [FALLBACK_BANNER];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoScrollTimer = useRef(null);

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
      <BannerSlide banner={item} width={BANNER_W} onPress={onPressBanner} />
    ),
    [BANNER_W, onPressBanner],
  );

  const getItemLayout = useCallback(
    (_, index) => ({ length: BANNER_W, offset: BANNER_W * index, index }),
    [BANNER_W],
  );

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const x = e?.nativeEvent?.contentOffset?.x || 0;
      const next = Math.round(x / BANNER_W);
      setActiveIndex(next);
      clearInterval(autoScrollTimer.current);
    },
    [BANNER_W],
  );

  return (
    <View style={{ marginTop: 12, marginBottom: 4 }}>
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
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      {banners.length > 1 ? (
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {banners.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                style={{
                  height: 6,
                  borderRadius: 3,
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
