import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../constants/design-tokens";

const HERO_FEATURES = [
  { icon: "event", label: "Thời gian" },
  { icon: "bookmark", label: "Đã lưu" },
  { icon: "route", label: "Lộ trình" },
];

const FeaturePill = memo(function FeaturePill({ icon, label, delay }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)} style={styles.featurePill}>
      <MaterialIconsRounded name={icon} size={13} color="rgba(255,255,255,0.9)" />
      <Text style={styles.featureText}>{label}</Text>
    </Animated.View>
  );
});

function HeroSectionInner() {
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(480)} style={styles.wrap}>
      <LinearGradient
        colors={["#1a1a1c", "#121214", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <LinearGradient
          colors={["rgba(0,122,255,0.22)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Decorative orbs */}
        <View style={styles.orbLarge} pointerEvents="none" />
        <View style={styles.orbSmall} pointerEvents="none" />
        <View style={styles.orbAccent} pointerEvents="none" />

        {/* Map grid pattern */}
        <View style={styles.patternRow} pointerEvents="none">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.patternDot} />
          ))}
        </View>

        {/* Top icon */}
        <Animated.View entering={FadeIn.delay(180).duration(350)} style={styles.topIcon}>
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)"]}
            style={styles.topIconGradient}
          >
            <MaterialIconsRounded name="add-location-alt" size={22} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Chuyến đi mới</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(160).duration(420)}
            style={styles.title}
          >
            Tạo hành trình{"\n"}của bạn
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(420)}
            style={styles.subtitle}
          >
            Đặt tên, chọn ngày và gắn những địa điểm đã lưu — chỉ vài bước là xong.
          </Animated.Text>

          <View style={styles.featureRow}>
            {HERO_FEATURES.map((item, index) => (
              <FeaturePill
                key={item.icon}
                icon={item.icon}
                label={item.label}
                delay={260 + index * 60}
              />
            ))}
          </View>
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.45)"]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </LinearGradient>
    </Animated.View>
  );
}

export const HeroSection = memo(HeroSectionInner);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  gradient: {
    minHeight: 212,
    position: "relative",
  },
  orbLarge: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  orbSmall: {
    position: "absolute",
    top: 48,
    left: -20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,122,255,0.08)",
  },
  orbAccent: {
    position: "absolute",
    bottom: 60,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,122,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
  },
  patternRow: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    gap: 6,
    opacity: 0.35,
  },
  patternDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  topIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
  },
  topIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 8,
    zIndex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APPLE_THEME.success,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 34,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.72)",
    letterSpacing: -0.2,
    lineHeight: 20,
    maxWidth: 300,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  featureText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: -0.1,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
  },
});
