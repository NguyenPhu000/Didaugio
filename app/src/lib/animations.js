import { withSpring, withTiming, withDelay } from "react-native-reanimated";

export const ANIMATIONS = {
  slideUp: (toValue) => withSpring(toValue, { damping: 18, stiffness: 220 }),

  fadeIn: (delay = 0) =>
    withDelay(delay, withTiming(1, { duration: 300 })),

  fadeOut: (delay = 0) =>
    withDelay(delay, withTiming(0, { duration: 200 })),

  voicePulse: withSpring(1.08, { damping: 6, stiffness: 300 }),

  staggered: (index) =>
    withDelay(index * 60, withTiming(1, { duration: 250 })),

  cardPressIn: withTiming(0.96, { duration: 80 }),
  cardPressOut: withSpring(1, { damping: 12 }),

  springConfig: {
    default: { damping: 18, stiffness: 220 },
    bouncy: { damping: 6, stiffness: 300 },
    smooth: { damping: 20, stiffness: 150 },
  },
};
