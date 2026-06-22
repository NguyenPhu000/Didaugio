import { memo, useCallback } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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

const HERO_HEIGHT = 280;
const DEFAULT_IMAGE_URI =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80&auto=format";

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
      style={[
        styles.container,
        { width: containerWidth },
        Platform.OS === "ios" && TOKENS.shadow.xl,
      ]}
    >
      <Image
        source={{ uri: resolvedImageUrl }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.badge}>
        <MaterialIconsRounded
          name="local-fire-department"
          size={14}
          color="#FFF"
        />
        <Text style={styles.badgeText}>
          {t("explore.heroBanner.badge") || "ĐỀ XUẤT CHO BẠN"}
        </Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {displayDescription}
          </Text>
        </View>

        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>
            {t("explore.heroBanner.cta") || "Khám phá"}
          </Text>
          <View style={styles.ctaIconWrapper}>
            <MaterialIconsRounded
              name="arrow-forward-ios"
              size={12}
              color="#000"
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    borderRadius: 24,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: APPLE_THEME.background || "#F3F4F6",
  },
  badge: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  contentWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 32,
    fontFamily: TOKENS.font.bold,
    letterSpacing: -0.5,
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: TOKENS.font.medium,
    marginTop: 6,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  ctaIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const HeroBanner = memo(HeroBannerInner);
