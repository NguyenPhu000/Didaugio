import { useCallback } from "react";

let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch {
  // expo-haptics chưa install
}

const noop = () => {};

export function useHaptics() {
  const light = useCallback(
    () =>
      Haptics
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : Promise.resolve(),
    [],
  );
  const medium = useCallback(
    () =>
      Haptics
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : Promise.resolve(),
    [],
  );
  const success = useCallback(
    () =>
      Haptics
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Promise.resolve(),
    [],
  );
  const error = useCallback(
    () =>
      Haptics
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Promise.resolve(),
    [],
  );

  return { light, medium, success, error };
}
