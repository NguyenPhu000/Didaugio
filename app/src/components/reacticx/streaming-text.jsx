import React, { useEffect, useState, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

const CHAR_DELAY = 18;
const FADE_DURATION = 250;

function FadeChar({ char, delay }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: FADE_DURATION, easing: Easing.out(Easing.ease) })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.char, animatedStyle]}>
      {char}
    </Animated.Text>
  );
}

export function StreamingText({ text, style, onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    hasCompleted.current = false;
    setVisibleCount(0);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= text.length) {
        clearInterval(interval);
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onComplete?.();
        }
      }
    }, CHAR_DELAY);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <Text style={[styles.text, style]}>
      {text
        .slice(0, visibleCount)
        .split("")
        .map((char, index) => (
          <FadeChar key={`${index}-${char}`} char={char} delay={0} />
        ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  char: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
});
