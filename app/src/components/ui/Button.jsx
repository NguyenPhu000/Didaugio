/**
 * Button — reusable pressable button with variant support.
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | md | lg
 */
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
    "flex-row items-center justify-center gap-2 rounded-2xl",
    btnVariantCls[variant] ?? btnVariantCls.primary,
    btnSizeCls[size] ?? btnSizeCls.md,
    (disabled || loading) && "opacity-55",
  );

  const textCls = cn(
    "font-bold",
    btnTextVariantCls[variant] ?? btnTextVariantCls.primary,
    btnTextSizeCls[size] ?? btnTextSizeCls.md,
  );

  // Native shadow + pressed scale — these can’t be expressed in Tailwind on RN
  const baseStyle = variant === "primary" ? primaryShadow : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={containerCls}
      style={({ pressed }) => [
        baseStyle,
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#fff" : COLORS.primary}
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
