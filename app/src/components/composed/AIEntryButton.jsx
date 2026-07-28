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
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1400 }),
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
    opacity: 0.15 + pulse.value * 0.16,
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
            <Image
              source={require("../../../assets/technical-support.png")}
              style={[styles.iconImage, compact && styles.iconImageCompact]}
              contentFit="cover"
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(52, 120, 246, 0.25)",
    shadowColor: "#3478F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
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
    top: -6,
    right: -6,
    bottom: -6,
    left: -6,
    borderRadius: 35,
    backgroundColor: "rgba(52, 120, 246, 0.15)",
  },
  haloCompact: {
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
    borderRadius: 31,
  },
  buttonGradient: {
    overflow: "hidden",
    width: "100%",
    height: "100%",
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradientHighlight: {
    position: "absolute",
    top: -8,
    left: -6,
    width: 34,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.95,
    transform: [{ rotate: "-20deg" }],
  },
  iconWrapCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  iconImage: {
    zIndex: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  iconImageCompact: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    borderRadius: 26,
  },
});
export default AIEntryButton;
