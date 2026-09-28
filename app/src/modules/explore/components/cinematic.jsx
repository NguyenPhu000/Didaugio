/**
 * cinematic.jsx — Design bible dùng chung cho toàn bộ card của Explore.
 *
 * Nguyên tắc: card LÀ tấm ảnh. Ảnh chiếm 100% khung card, chữ nổi trên một
 * scrim gradient nhiều chặng thay vì nằm trong một khối trắng riêng — nhờ vậy
 * diện tích ảnh gần như gấp đôi so với layout "ảnh trên / thông tin dưới".
 *
 * Cố tình KHÔNG dùng BlurView cho các chip trong danh sách cuộn: blur là filter
 * GPU, đặt trong FlatList/ScrollView sẽ repaint liên tục và tụt frame trên
 * Android. Chip dùng nền rgba + hairline trắng, cho cảm giác kính mà rẻ hơn.
 */
import { memo, useCallback, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { EXPLORE_THEME as C } from "./exploreTheme";
import {
  PLACE_IMAGE_BLURHASH,
  getOptimizedCloudinaryUrl,
} from "../../../lib/media-url";

/** Mực in của hệ thống — sâu hơn #181819 để scrim không bị ngả xám. */
export const INK = C.ink;
export const CREAM = C.sand;
export const STAR = C.gold;

/** Bán kính đồng tâm: media = outer - INSET để hai đường cong song song. */
export const POSTER_RADIUS = 20;
export const POSTER_INSET = 4;
export const POSTER_MEDIA_RADIUS = POSTER_RADIUS - POSTER_INSET;

export const CHIP_FILL = "rgba(11,11,12,0.52)";
export const CHIP_HAIRLINE = "rgba(255,255,255,0.24)";

const SPRING = TOKENS.spring.press;

/**
 * Vòm sáng dưới card. Dùng shadow mềm, khuếch tán rộng — không dùng
 * shadow tối gắt kiểu shadow-md.
 */
export const posterShadow = Platform.select({
  ios: {
    shadowColor: INK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  android: { elevation: 4 },
  default: {},
});

/**
 * Scale khi nhấn cho card + counter-scale cho ảnh bên trong, tạo cảm giác
 * ảnh "đẩy tới" (Ken Burns) chứ không phải cả khối bị co lại.
 *
 */
export function usePressScale({ to = 0.965, mediaTo = 1.05 } = {}) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const onPressIn = useCallback(() => {
    if (!reduceMotion) progress.set(withSpring(1, SPRING));
  }, [progress, reduceMotion]);

  const onPressOut = useCallback(() => {
    if (!reduceMotion) progress.set(withSpring(0, SPRING));
  }, [progress, reduceMotion]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : 1 - (1 - to) * progress.value }],
  }));

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : 1 + (mediaTo - 1) * progress.value }],
  }));

  return { onPressIn, onPressOut, cardStyle, mediaStyle };
}

/**
 * Ảnh full-bleed + placeholder blurhash. `width` là bề rộng render thật để
 * xin Cloudinary đúng cỡ (tiết kiệm băng thông, nét trên màn hình retina).
 */
export const PosterMedia = memo(function PosterMedia({
  uri,
  width = 800,
  fallbackIcon = "travel-explore",
  fallbackBackground = CREAM,
  fallbackIconColor = "rgba(11,11,12,0.28)",
  style,
}) {
  const [failedUri, setFailedUri] = useState(null);
  const optimized = uri?.includes("res.cloudinary.com")
    ? getOptimizedCloudinaryUrl(uri, Math.round(width * 2))
    : uri;

  if (!optimized || optimized === failedUri) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: fallbackBackground, alignItems: "center", justifyContent: "center" },
          style,
        ]}
      >
        <MaterialIconsRounded
          name={fallbackIcon}
          size={34}
          color={fallbackIconColor}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: optimized }}
      contentFit="cover"
      transition={320}
      placeholder={{ blurhash: PLACE_IMAGE_BLURHASH }}
      placeholderContentFit="cover"
      cachePolicy="memory-disk"
      onError={() => setFailedUri(optimized)}
      style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }, style]}
    />
  );
});

/**
 * Scrim hai đầu. Chặng dưới đi 4 bước để mép trên của gradient tan hẳn vào
 * ảnh — gradient 2 stop luôn để lại một đường viền xám thấy rõ.
 */
export const PosterScrim = memo(function PosterScrim({
  bottomHeight = "72%",
  topHeight = "34%",
  strength = 0.9,
  withTop = true,
}) {
  return (
    <>
      {withTop ? (
        <LinearGradient
          colors={["rgba(11,11,12,0.42)", "rgba(11,11,12,0.10)", "transparent"]}
          locations={[0, 0.6, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: topHeight }}
          pointerEvents="none"
        />
      ) : null}
      <LinearGradient
        colors={[
          "transparent",
          `rgba(11,11,12,${(strength * 0.16).toFixed(3)})`,
          `rgba(11,11,12,${(strength * 0.58).toFixed(3)})`,
          `rgba(11,11,12,${strength.toFixed(3)})`,
        ]}
        locations={[0, 0.34, 0.68, 1]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottomHeight }}
        pointerEvents="none"
      />
    </>
  );
});

/** Chip kính-giả: nền mực trong + hairline trắng. */
export const MetaChip = memo(function MetaChip({
  icon,
  iconColor,
  label,
  compact = false,
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        height: compact ? 24 : 27,
        paddingHorizontal: compact ? 8 : 9,
        borderRadius: 999,
        backgroundColor: CHIP_FILL,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: CHIP_HAIRLINE,
      }}
    >
      {icon ? (
        <MaterialIconsRounded
          name={icon}
          size={compact ? 11 : 13}
          color={iconColor || "#FFFFFF"}
        />
      ) : null}
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: compact ? 10.5 : 11.5,
          fontFamily: TOKENS.font.semibold,
          letterSpacing: -0.1,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

/** Eyebrow: nhãn cực nhỏ, chữ hoa, giãn ký tự — dấu hiệu của layout editorial. */
export const Eyebrow = memo(function Eyebrow({ children, color = "rgba(255,255,255,0.72)" }) {
  return (
    <Text
      style={{
        color,
        fontSize: 10,
        lineHeight: 13,
        fontFamily: TOKENS.font.semibold,
        letterSpacing: 1.1,
        textTransform: "uppercase",
      }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
});

/** Nút tròn "button-in-button" — luôn nằm flush với padding phải của khối. */
export const ArrowCircle = memo(function ArrowCircle({
  size = 34,
  tone = "light",
}) {
  const light = tone === "light";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: light ? "rgba(255,255,255,0.94)" : INK,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: light ? "rgba(11,11,12,0.06)" : "rgba(255,255,255,0.16)",
      }}
    >
      <MaterialIconsRounded
        name="arrow-forward"
        size={size * 0.47}
        color={light ? INK : "#FFFFFF"}
      />
    </View>
  );
});

/** Shared heading for Explore sections. */
export const SectionHeading = memo(function SectionHeading({ title, icon, right }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        {icon ? (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CREAM,
            }}
          >
            {icon}
          </View>
        ) : null}
        <Text
          style={{
            flex: 1,
            fontSize: 21,
            lineHeight: 29,
            letterSpacing: -0.35,
            color: INK,
            fontFamily: C.font.semibold,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
});

export const AnimatedView = Animated.View;
