import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { NotificationBell } from "../../../components/composed/NotificationBell";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ExploreModernHeaderInner({ onPressSearch }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressSearch?.();
  }, [onPressSearch]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>iPoint Genie</Text>
          <Text style={styles.location}>CẦN THƠ, VIỆT NAM</Text>
        </View>
        <NotificationBell size={42} />
      </View>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t("explore.header.searchPlaceholder")}
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.982, TOKENS.spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, TOKENS.spring.press); }}
        style={[styles.search, animatedStyle]}
      >
        <MaterialIconsRounded name="search" size={20} color="#181819" />
        <Text style={styles.searchText} numberOfLines={1}>
          {t("explore.header.searchPlaceholder")}
        </Text>
        <View style={styles.searchAction}>
          <MaterialIconsRounded name="arrow-forward" size={18} color="#FFFFFF" />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  brand: { color: "#181819", fontSize: 31, lineHeight: 35, fontFamily: TOKENS.font.heading, letterSpacing: -1.1 },
  location: { color: "rgba(24,24,25,0.54)", fontSize: 9, fontFamily: TOKENS.font.bold, letterSpacing: 1.35, marginTop: 1 },
  search: {
    height: 52,
    paddingLeft: 15,
    paddingRight: 6,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(24,24,25,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...TOKENS.shadow.sm,
  },
  searchText: { flex: 1, color: "rgba(24,24,25,0.54)", fontSize: 14, fontFamily: TOKENS.font.medium },
  searchAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#181819", alignItems: "center", justifyContent: "center" },
});

export const ExploreModernHeader = memo(ExploreModernHeaderInner);
