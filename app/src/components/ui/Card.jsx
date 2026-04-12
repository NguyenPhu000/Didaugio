import { View } from "react-native";
import { cn } from "../../lib/cn";
import { TOKENS } from "../../constants/design-tokens";

const VARIANT_STYLES = {
  default: "bg-white dark:bg-card-dark rounded-[28px] border border-slate-100 dark:border-slate-800",
  elevated: "bg-white dark:bg-card-dark rounded-[28px] border border-slate-100 dark:border-slate-800",
  outlined: "bg-white dark:bg-card-dark rounded-[28px] border border-primary-100 dark:border-slate-700",
  glass: "rounded-[28px] overflow-hidden border border-primary-100",
};

const VARIANT_SHADOW = {
  default: TOKENS.shadow.sm,
  elevated: TOKENS.shadow.md,
  outlined: null,
  glass: TOKENS.shadow.sm,
};

export function Card({
  children,
  variant = "default",
  className = "",
  style,
  ...props
}) {
  return (
    <View
      className={cn(VARIANT_STYLES[variant] ?? VARIANT_STYLES.default, className)}
      style={[VARIANT_SHADOW[variant], style]}
      {...props}
    >
      {children}
    </View>
  );
}
