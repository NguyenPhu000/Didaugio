import { memo, useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { NotificationBell } from "../../../components/composed/NotificationBell";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ExploreModernHeaderInner({ onPressSearch }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    onPressSearch?.();
  }, [onPressSearch]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: 14 },
      ]}
    >
      {/* Glass backdrop layer — iOS dùng BlurView, Android fallback nền trắng
          trong suốt để vẫn giữ được cảm giác "frosted" khi scroll dưới. */}
      <BlurView
        intensity={Platform.OS === "ios" ? 90 : 100}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor:
              Platform.OS === "ios" ? "rgba(255,255,255,0.55)" : "#FFFFFFEE",
          },
        ]}
      />

      {/* Hairline dưới đáy — dấu hiệu editorial của header nổi trên content. */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: StyleSheet.hairlineWidth,
          backgroundColor: "rgba(24,24,25,0.08)",
        }}
        pointerEvents="none"
      />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.brand}>{t("common.appName")}</Text>
          <View style={styles.locationRow}>
            <MaterialIconsRounded
              name="location-on"
              size={12}
              color="#0F766E"
            />
            <Text style={styles.location}>
              {t("explore.header.location")}
            </Text>
          </View>
        </View>
        <NotificationBell size={42} />
      </View>

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={t("explore.header.searchPlaceholder")}
        accessibilityHint={t("explore.header.searchHint")}
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.982, TOKENS.spring.press);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, TOKENS.spring.press);
        }}
        style={[styles.search, animatedStyle]}
      >
        <View style={styles.searchIconWrap}>
          <MaterialIconsRounded name="search" size={18} color="#FFFFFF" />
        </View>
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
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  brand: {
    color: "#181819",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -1.1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  location: {
    color: "rgba(24,24,25,0.62)",
    fontSize: 11,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1.1,
  },
  search: {
    height: 52,
    paddingLeft: 8,
    paddingRight: 6,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(24,24,25,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
    }),
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#181819",
    alignItems: "center",
    justifyContent: "center",
  },
  searchText: {
    flex: 1,
    color: "rgba(24,24,25,0.54)",
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  searchAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(24,24,25,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const ExploreModernHeader = memo(ExploreModernHeaderInner);
