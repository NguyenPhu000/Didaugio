import { useColorScheme } from "nativewind";
import { useUIStore } from "../stores/uiStore";

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const preference = useUIStore((s) => s.themePreference);

  const isDark =
    preference === "auto" ? colorScheme === "dark" : preference === "dark";

  return { isDark, colorScheme: isDark ? "dark" : "light" };
}
