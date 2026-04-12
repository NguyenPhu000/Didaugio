import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { TOKENS } from "../../constants/design-tokens";

/**
 * Primitive Icon — MaterialIcons wrapper.
 * Change this file only if switching icon library.
 */
export function Icon({ name, size = 24, color, style }) {
  const { isDark } = useTheme();
  const defaultColor = isDark
    ? TOKENS.color.neutral[0]
    : TOKENS.color.neutral[900];

  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color ?? defaultColor}
      style={style}
    />
  );
}
