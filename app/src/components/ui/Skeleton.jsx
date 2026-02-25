/**
 * Skeleton — animated loading placeholder.
 * Uses Animated.Value for opacity pulse; className for bg & shape.
 */
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { cn } from "../../lib/cn";

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
  className,
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      className={cn("bg-slate-200", className)}
      style={[{ width, height, borderRadius, opacity }, style]}
    />
  );
}

/** Composite skeleton that matches a PlaceCard */
export function PlaceCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-3">
      <Skeleton width="100%" height={140} borderRadius={12} />
      <View className="p-3 gap-1">
        <Skeleton width="75%" height={14} borderRadius={6} />
        <Skeleton width="50%" height={11} borderRadius={6} className="mt-1.5" />
        <View className="flex-row gap-2 mt-1">
          <Skeleton width={48} height={11} borderRadius={6} />
          <Skeleton width={48} height={11} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}
