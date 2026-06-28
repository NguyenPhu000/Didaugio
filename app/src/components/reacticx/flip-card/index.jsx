import React, { createContext, memo, useContext, useState } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedProps,
  Easing,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const FlipCardContext = createContext(null);

const useFlipCard = () => {
  const context = useContext(FlipCardContext);
  if (!context) {
    throw new Error("FlipCard compound components must be used within FlipCard");
  }
  return context;
};

export function FlipCard({
  children,
  width = 340,
  height = 480,
  borderRadius = 24,
  blurIntensity = 90,
  containerStyle,
  animationDuration = 600,
  enableHaptics = true,
  onFlip,
  blurTint,
  scaleOnPress = true,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const flip = () => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    rotation.value = withTiming(newFlippedState ? 180 : 0, {
      duration: animationDuration,
      easing: Easing.inOut(Easing.cubic),
    });
    onFlip?.(newFlippedState);
  };

  return (
    <FlipCardContext.Provider
      value={{
        isFlipped,
        flip,
        width,
        height,
        borderRadius,
        blurIntensity,
        animationDuration,
        rotation,
        scale,
        tint: blurTint || "light",
        scaleEnabled: scaleOnPress,
      }}
    >
      <View style={[styles.container, containerStyle, { width, height }]}>
        {children}
      </View>
    </FlipCardContext.Provider>
  );
}

const Front = memo(function Front({ children, style }) {
  const { rotation, scale, width, height, borderRadius, blurIntensity, tint } = useFlipCard();

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    const opacity = interpolate(rotation.value, [0, 90, 90.01, 180], [1, 1, 0, 0], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { scale: scale.value },
      ],
      opacity,
    };
  });

  const frontBlurProps = useAnimatedProps(() => {
    const intensity =
      rotation.value <= 20
        ? withSpring(interpolate(rotation.value, [0, 20], [0, blurIntensity], Extrapolation.CLAMP))
        : rotation.value >= 160
          ? withSpring(interpolate(rotation.value, [160, 180], [blurIntensity, 0], Extrapolation.CLAMP))
          : blurIntensity;
    return { blurAmount: intensity };
  });

  return (
    <Animated.View style={[styles.card, { width, height, borderRadius }, frontAnimatedStyle, style]}>
      {children}
      {Platform.OS === "ios" && (
        <AnimatedBlurView
          blurType={tint}
          animatedProps={frontBlurProps}
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }]}
        />
      )}
    </Animated.View>
  );
});

const Back = memo(function Back({ children, style }) {
  const { rotation, scale, width, height, borderRadius, blurIntensity, tint } = useFlipCard();

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    const opacity = interpolate(rotation.value, [0, 89.99, 90, 180], [0, 0, 1, 1], Extrapolation.CLAMP);
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { scale: scale.value },
      ],
      opacity,
    };
  });

  const backBlurProps = useAnimatedProps(() => {
    const intensity =
      rotation.value >= 160
        ? withSpring(interpolate(rotation.value, [180, 160], [0, blurIntensity], Extrapolation.CLAMP))
        : rotation.value <= 20
          ? withSpring(interpolate(rotation.value, [20, 0], [blurIntensity, 0], Extrapolation.CLAMP))
          : blurIntensity;
    return { blurAmount: intensity };
  });

  return (
    <Animated.View style={[styles.card, { width, height, borderRadius }, backAnimatedStyle, style]}>
      {children}
      {Platform.OS === "ios" && (
        <AnimatedBlurView
          blurType={tint}
          animatedProps={backBlurProps}
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: "hidden" }]}
        />
      )}
    </Animated.View>
  );
});

const Trigger = memo(function Trigger({ children, asChild, ...props }) {
  const { flip, scale, scaleEnabled } = useFlipCard();

  const onPressIn = () => {
    if (!scaleEnabled) return;
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const onPressOut = () => {
    if (!scaleEnabled) return;
    scale.value = withTiming(1, { duration: 200 });
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: flip,
      onPressIn,
      onPressOut,
      ...props,
    });
  }

  return (
    <Pressable onPress={flip} onPressIn={onPressIn} onPressOut={onPressOut} style={StyleSheet.absoluteFill} {...props}>
      {children}
    </Pressable>
  );
});

FlipCard.Front = Front;
FlipCard.Back = Back;
FlipCard.Trigger = Trigger;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: Platform.select({
    android: {
      position: "absolute",
      backgroundColor: "#1a1a1a",
      overflow: "hidden",
      backfaceVisibility: "hidden",
    },
    default: {
      position: "absolute",
      backgroundColor: "#1a1a1a",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
      overflow: "hidden",
      backfaceVisibility: "hidden",
    },
  }),
});
