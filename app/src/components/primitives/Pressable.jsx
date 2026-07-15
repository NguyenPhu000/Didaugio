import { Pressable as RNPressable } from "react-native";

let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch {
  // Haptics is optional, fallback to null in web or non-supported environments
}

export function Pressable({
  className = "",
  style,
  children,
  haptic = "light",
  onPress,
  ...props
}) {
  const handlePress = async (e) => {
    if (Haptics) {
      if (haptic === "light") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (haptic === "medium") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    }
    onPress?.(e);
  };

  return (
    <RNPressable
      className={className}
      style={({ pressed }) => [
        typeof style === "function" ? style({ pressed }) : style,
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
      onPress={handlePress}
      {...props}
    >
      {children}
    </RNPressable>
  );
}
