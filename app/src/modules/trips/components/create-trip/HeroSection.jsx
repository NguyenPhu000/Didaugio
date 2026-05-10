import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BOOKING_APPLE_THEME as APPLE_THEME, TOKENS } from "../../../../constants/design-tokens";

function HeroSectionInner() {
  return (
    <Animated.View
      entering={FadeInDown.delay(80).duration(500)}
      style={styles.container}
    >
      <LinearGradient
        colors={["#2C2C2E", "#1C1C1E", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Top-right icon */}
        <View style={styles.heroTopRow}>
          <View style={styles.heroArrow}>
            <MaterialIcons name="add-location-alt" size={18} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>MỚI</Text>
          </View>
          <Text style={styles.heroTitle}>Tạo chuyến đi mới</Text>
          <Text style={styles.heroSubtitle}>
            Lên kế hoạch cho hành trình tuyệt vời của bạn
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export const HeroSection = memo(HeroSectionInner);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  heroCard: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
  },
  heroTopRow: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: TOKENS.font.heading,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
});
