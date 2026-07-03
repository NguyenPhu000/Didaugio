import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

type BreakpointValue<T> = {
  nano?: T;
  compact?: T;
  medium?: T;
  expanded?: T;
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const mode =
      width < 340
        ? "nano"
        : width < 390
          ? "compact"
          : width < 768
            ? "medium"
            : "expanded";

    const rv = <T,>(values: BreakpointValue<T> | T): T => {
      if (!values || typeof values !== "object") return values as T;
      const map = values as BreakpointValue<T>;
      return (
        map[mode as keyof BreakpointValue<T>] ??
        map.nano ??
        map.medium ??
        map.compact ??
        map.expanded
      ) as T;
    };

    const rf = (size: number) => {
      const scale = Math.min(1.18, Math.max(0.88, width / 390));
      return Math.round(size * scale);
    };

    return {
      width,
      height,
      mode,
      isNano: mode === "nano",
      isCompact: mode === "compact",
      isMedium: mode === "medium",
      isExpanded: mode === "expanded",
      rv,
      rf,
    };
  }, [height, width]);
}
