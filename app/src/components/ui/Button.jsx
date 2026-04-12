import { ActivityIndicator, Pressable, Text } from "react-native";
import { cn } from "../../lib/cn";
import {
  btnVariantCls,
  btnTextVariantCls,
  btnSizeCls,
  btnTextSizeCls,
  primaryShadow,
} from "./Button.styles";
import { COLORS } from "../../constants/colors";

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  startIcon,
  style,
  textStyle,
}) {
  const containerCls = cn(
    "flex-row items-center justify-center gap-2",
    btnVariantCls[variant] ?? btnVariantCls.primary,
    btnSizeCls[size] ?? btnSizeCls.md,
    (disabled || loading) && "opacity-55",
  );

  const textCls = cn(
    "font-bold uppercase tracking-[1.2px]",
    btnTextVariantCls[variant] ?? btnTextVariantCls.primary,
    btnTextSizeCls[size] ?? btnTextSizeCls.md,
  );

  const baseStyle = variant === "primary" ? primaryShadow : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={containerCls}
      style={({ pressed }) => [
        baseStyle,
        variant === "secondary" && {
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
          elevation: 3,
        },
        pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#fff" : COLORS.primary}
        />
      ) : (
        <>
          {startIcon}
          <Text className={textCls} style={textStyle}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
