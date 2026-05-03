import { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import { TripCard } from "./TripCard";

/**
 * Wraps TripCard with a stable onPress so FlatList renders are optimized.
 * Without this, a new function is created on every render, defeating memo.
 */
export const TripItem = memo(function TripItem({ item, onPress }) {
  const handlePress = useCallback(() => onPress(item.id), [onPress, item.id]);
  return <TripCard trip={item} onPress={handlePress} />;
});
