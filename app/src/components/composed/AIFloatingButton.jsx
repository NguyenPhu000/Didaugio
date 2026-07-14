import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AIEntryButton } from "./AIEntryButton";

const HIDE_PATHS = new Set([
  "/(tabs)/ai",
  "/ai",
  "/ai/chat",
  "/(auth)/login",
  "/login",
  "/(auth)/register",
  "/register",
  "/onboarding",
]);

/**
 * @param {{ router: import('expo-router').Router, pathname: string }} props
 */
export function AIFloatingButton({ router, pathname }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);

  const buttonSize = 52;
  const margin = 16;
  const initialX = screenWidth - 18 - buttonSize;
  const initialY = screenHeight - (insets.bottom + 148) - buttonSize;

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .activeOffsetY([-10, 10])
      .onStart(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
        scale.value = withSpring(1.08);
      })
      .onUpdate((event) => {
        translateX.value = startX.value + event.translationX;
        translateY.value = startY.value + event.translationY;
      })
      .onEnd(() => {
        scale.value = withSpring(1);

        const currentAbsoluteX = initialX + translateX.value;
        const snapToLeftX = margin - initialX;
        const snapToRightX = screenWidth - margin - buttonSize - initialX;

        const midPoint = screenWidth / 2;
        const snapX = currentAbsoluteX < midPoint ? snapToLeftX : snapToRightX;

        const currentAbsoluteY = initialY + translateY.value;
        const snapY = Math.min(
          Math.max(currentAbsoluteY, insets.top + margin),
          screenHeight - insets.bottom - 90 - buttonSize
        ) - initialY;

        translateX.value = withSpring(snapX, { damping: 15, stiffness: 120 });
        translateY.value = withSpring(snapY, { damping: 15, stiffness: 120 });
      });
  }, [screenWidth, screenHeight, insets, initialX, initialY, translateX, translateY, startX, startY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const shouldHide =
    HIDE_PATHS.has(pathname) ||
    pathname.startsWith("/place/") ||
    pathname.startsWith("/booking/") ||
    pathname.startsWith("/profile/booking/") ||
    pathname.startsWith("/trip/");

  if (shouldHide) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            bottom: insets.bottom + 148,
            right: 18,
            zIndex: 99999,
          },
        ]}
      >
        <AIEntryButton
          compact
          onPress={() => router.push("/(tabs)/ai")}
        />
      </Animated.View>
    </GestureDetector>
  );
}
export default AIFloatingButton;
