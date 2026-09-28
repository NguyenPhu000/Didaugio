import { memo, useCallback, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { EXPLORE_THEME as C } from "./exploreTheme";
import {
  getOptimizedCloudinaryUrl,
  resolveMediaUrl,
} from "../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const BANNER_H = 196;

function BannerSlide({ banner, width, onPress }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const [failedUri, setFailedUri] = useState(null);

  const rawImage = banner.imageUrl || banner.imageData;
  const imageUri = rawImage
    ? getOptimizedCloudinaryUrl(resolveMediaUrl(rawImage), 900)
    : null;
  const displayUri = imageUri && imageUri !== failedUri ? imageUri : null;
  const canNavigate = Boolean(banner.linkType && banner.linkType !== "none" && banner.linkValue);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
scale.set(withSpring(0.985, TOKENS.spring.press));
  }, [scale]);

  const handlePressOut = useCallback(() => {
scale.set(withSpring(1, TOKENS.spring.press));
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!canNavigate) return;
    onPress?.(banner);
  }, [banner, canNavigate, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={!canNavigate}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={canNavigate ? "button" : undefined}
      accessibilityLabel={banner.title || t("explore.cmsFallbackTitle")}
      accessibilityHint={canNavigate ? t("explore.accessibility.openBanner") : undefined}
      style={[
        animatedStyle,
        {
          width,
          height: BANNER_H,
          borderRadius: C.radius,
          overflow: "hidden",
          backgroundColor: C.sand,
        },
      ]}
    >
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
          onError={() => setFailedUri(displayUri)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.ink, alignItems: "center", justifyContent: "center" }]}>
          <MaterialIconsRounded name="landscape" size={32} color="rgba(255,255,255,0.28)" />
        </View>
      )}

      <LinearGradient
        colors={[
          "rgba(5,10,20,0.08)",
          "rgba(5,10,20,0.36)",
          "rgba(5,10,20,0.86)",
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {canNavigate ? (
        <View style={styles.topRow}>
          <View style={styles.arrowCircle}>
            <MaterialIconsRounded
              name="arrow-forward"
              size={17}
              color={C.ink}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {banner.title || t("explore.cmsFallbackTitle")}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {banner.description || t("explore.cmsFallbackDesc")}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const keyExtractor = (item) => String(item.id);

function CmsBannerCarouselInner({ banners: rawBanners, onPressBanner }) {
  const { width: screenWidth } = useWindowDimensions();
  const bannerWidth = screenWidth - TAB_SCREEN_PADDING * 2;
  const banners = rawBanners?.length > 0 ? rawBanners : [];

  const [activeIndex, setActiveIndex] = useState(0);

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
    },
    [bannerWidth],
  );

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
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
                style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
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
    marginTop: 28,
    marginBottom: 4,
  },
  topRow: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 21,
    lineHeight: 27,
    fontFamily: C.font.semibold,
    letterSpacing: -0.35,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: C.font.medium,
    marginTop: 6,
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
    backgroundColor: C.river,
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});

export const CmsBannerCarousel = memo(CmsBannerCarouselInner);
