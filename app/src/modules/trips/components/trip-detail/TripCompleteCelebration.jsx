import { memo, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CONFETTI_COUNT = 32;

const COLORS = ["#FF9F0A", "#34C759", "#007AFF", "#FF3B30", "#AF52DE", "#FF2D55"];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function ConfettiPiece({ index, onComplete }) {
  const startX = randomBetween(-20, SCREEN_W + 20);
  const startY = randomBetween(-80, -20);
  const endX = startX + randomBetween(-120, 120);
  const endY = SCREEN_H + 80;
  const color = COLORS[index % COLORS.length];
  const size = randomBetween(6, 14);
  const rotation = randomBetween(0, 360);
  const duration = randomBetween(2000, 3500);
  const delay = randomBetween(0, 800);
  const isCircle = index % 3 === 0;
  const isRect = index % 3 === 1;

  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(endY, { duration, easing: Easing.out(Easing.quad) }),
    );
    translateX.value = withDelay(
      delay,
      withTiming(endX, { duration, easing: Easing.inOut(Easing.sin) }),
    );
    rotate.value = withDelay(
      delay,
      withTiming(rotation + randomBetween(360, 720), { duration }),
    );
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 80 }));
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          width: isCircle ? size : size,
          height: isCircle ? size : isRect ? size * 0.5 : size * 1.5,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

const CONFETTI_PIECES = Array.from({ length: CONFETTI_COUNT }, (_, i) => i);

export const TripCompleteCelebration = memo(function TripCompleteCelebration({
  visible,
  tripTitle,
  onDismiss,
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 120 }),
        withSpring(1, { damping: 12, stiffness: 150 }),
      );
      opacity.value = withTiming(1, { duration: 200 });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 }, () => {
          runOnJS(onDismiss)();
        });
        scale.value = withTiming(0.9, { duration: 400 });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, containerStyle]} pointerEvents="box-none">
      {CONFETTI_PIECES.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialIconsRounded name="check" size={36} color="#34C759" />
          </View>
        </View>

        <Animated.Text style={styles.title}>{t("trip.celebration.title")}</Animated.Text>
        {tripTitle ? (
          <Animated.Text style={styles.subtitle} numberOfLines={2}>
            {tripTitle}
          </Animated.Text>
        ) : null}
        <Animated.Text style={styles.hint}>{t("trip.celebration.hint")}</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    maxWidth: 300,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(52,199,89,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1D1F",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: "rgba(0,0,0,0.3)",
    textAlign: "center",
  },
});
