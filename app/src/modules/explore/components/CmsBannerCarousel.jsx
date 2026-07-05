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
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolveMediaUrl, getOptimizedCloudinaryUrl } from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const BANNER_H = 196;
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

  const rawImage = banner.imageUrl || banner.imageData;
  const imageUri = rawImage ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 900) : null;
  const canNavigate = !banner.isFallback && banner.linkType && banner.linkType !== "none";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (banner.isFallback) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(banner);
  }, [banner, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          width,
          height: BANNER_H,
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: APPLE_THEME.surfaceMuted,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.7)",
          ...TOKENS.shadow.md,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <LinearGradient
          colors={["#0F766E", "#007BFF", "#1E3A8A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <LinearGradient
        colors={["rgba(5,10,20,0.08)", "rgba(5,10,20,0.36)", "rgba(5,10,20,0.86)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {banner.isFallback ? "iPOINT GENIE" : "ĐỀ XUẤT"}
          </Text>
        </View>
        {canNavigate ? (
          <View style={styles.arrowCircle}>
            <MaterialIconsRounded name="arrow-forward" size={17} color="#111827" />
          </View>
        ) : null}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {banner.title || t("explore.cmsFallbackTitle")}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {banner.description || t("explore.cmsFallbackDesc")}
        </Text>
        <View style={styles.ctaPill}>
          <MaterialIconsRounded name={canNavigate ? "touch-app" : "auto-awesome"} size={14} color="#FFF" />
          <Text style={styles.ctaText}>
            {canNavigate ? "Chạm để xem chi tiết" : "Gợi ý nổi bật hôm nay"}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const keyExtractor = (item) => String(item.id);

function CmsBannerCarouselInner({ banners: rawBanners, onPressBanner }) {
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = screenWidth - TAB_SCREEN_PADDING * 2;
  const banners = rawBanners?.length > 0 ? rawBanners : [FALLBACK_BANNER];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoScrollTimer = useRef(null);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

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
      <BannerSlide banner={item} width={bannerWidth} onPress={onPressBanner} />
    ),
    [bannerWidth, onPressBanner],
  );

  const getItemLayout = useCallback(
    (_, index) => ({ length: bannerWidth, offset: bannerWidth * index, index }),
    [bannerWidth],
  );

  const onMomentumScrollEnd = useCallback(
    (event) => {
      const x = event?.nativeEvent?.contentOffset?.x || 0;
      const next = Math.round(x / bannerWidth);
      setActiveIndex(next);
      clearInterval(autoScrollTimer.current);
    },
    [bannerWidth],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: TAB_SCREEN_PADDING }}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  active ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    marginBottom: 4,
  },
  topRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.36)",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1.2,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    lineHeight: 29,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.7,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: TOKENS.font.medium,
    marginTop: 6,
  },
  ctaPill: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
  },
  dots: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: APPLE_THEME.focusBlue,
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});

export const CmsBannerCarousel = memo(CmsBannerCarouselInner);
