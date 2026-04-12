import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function AIEntryButton({
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel = "Mo AI Assistant",
  badge = "A.i",
  title,
  style,
  compact = false,
}) {
  const resolvedAccessibilityLabel = title || accessibilityLabel || badge;
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
        false,
      ),
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = compact ? 1.04 : 1.06;

    return {
      transform: [{ scale: 1 + pulse.value * (scale - 1) }],
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.14,
    transform: [{ scale: 1.02 + pulse.value * 0.18 }],
  }));

  return (
    <Animated.View
      style={[
        styles.root,
        compact && styles.rootCompact,
        pulseStyle,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          compact && styles.haloCompact,
          haloStyle,
        ]}
      />

      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={resolvedAccessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          compact && styles.buttonCompact,
          pressed && styles.buttonPressed,
          style,
        ]}
      >
        <View style={[styles.buttonGradient, compact && styles.buttonGradientCompact]}>
          <View style={styles.buttonGradientGlow} />

          <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
            <View style={styles.iconGradientBase} />
            <View style={styles.iconGradientHighlight} />
            <Image
              source={require("../../../assets/technical-support.png")}
              style={[styles.iconImage, compact && styles.iconImageCompact]}
              contentFit="contain"
              transition={120}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "relative",
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 12,
  },
  buttonCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  buttonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.97 }],
  },
  halo: {
    position: "absolute",
    top: -8,
    right: -8,
    bottom: -8,
    left: -8,
    borderRadius: 35,
    backgroundColor: "rgba(59,130,246,0.24)",
  },
  haloCompact: {
    top: -7,
    right: -7,
    bottom: -7,
    left: -7,
    borderRadius: 31,
  },
  buttonGradient: {
    overflow: "hidden",
    width: "100%",
    height: "100%",
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FAFF",
  },
  buttonGradientCompact: {
    borderRadius: 26,
  },
  buttonGradientGlow: {
    position: "absolute",
    top: -10,
    left: -8,
    width: 46,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    transform: [{ rotate: "-18deg" }],
  },
  iconWrap: {
    overflow: "hidden",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "#4DA8FF",
  },
  iconGradientBase: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#2A8CFF",
  },
  iconGradientHighlight: {
    position: "absolute",
    top: -8,
    left: -6,
    width: 34,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#A8E1FF",
    opacity: 0.95,
    transform: [{ rotate: "-20deg" }],
  },
  iconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconImage: {
    zIndex: 2,
    width: 26,
    height: 26,
  },
  iconImageCompact: {
    width: 24,
    height: 24,
  },
  root: {
    position: "relative",
    alignSelf: "flex-start",
    width: 58,
    height: 58,
    flexShrink: 0,
  },
  rootCompact: {
    width: 52,
    height: 52,
  },
});
