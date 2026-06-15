import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";

export function Skeleton({
  width,
  height,
  borderRadius = TOKENS.radius.lg,
  style,
  className,
}) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 700 }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={cn("bg-primary-100", className)}
      style={[{ width, height, borderRadius }, animStyle, style]}
    />
  );
}

export function PlaceCardSkeleton() {
  return (
    <View
      className="rounded-[28px] overflow-hidden mb-4"
      style={[
        TOKENS.shadow.sm,
        {
          backgroundColor: "#111111",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <Skeleton
        width="100%"
        height={188}
        borderRadius={0}
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      />
      <View className="p-4 gap-2">
        <Skeleton width="32%" height={26} borderRadius={999} />
        <Skeleton width="74%" height={18} borderRadius={8} />
        <Skeleton width="58%" height={14} borderRadius={8} />
        <View className="flex-row gap-2 mt-2">
          <Skeleton width={72} height={14} borderRadius={8} />
          <Skeleton width={60} height={14} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}
