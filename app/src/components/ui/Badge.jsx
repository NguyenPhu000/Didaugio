/**
 * Badge — small status indicator pill.
 * Variants: primary | success | warning | error | neutral | gold
 */
import { Text, View } from "react-native";
import { cn } from "../../lib/cn";

/** Tailwind class strings per variant (bg + text paired) */
const VARIANT_CLS = {
  primary: "bg-primary-light text-primary",
  success: "bg-green-100 text-[#16a34a]",
  warning: "bg-yellow-100 text-[#ca8a04]",
  error: "bg-red-100 text-red-600",
  neutral: "bg-slate-100 text-slate-600",
  gold: "bg-amber-100 text-amber-700",
};

export function Badge({ children, variant = "primary", style }) {
  const varCls = VARIANT_CLS[variant] ?? VARIANT_CLS.neutral;
  // Extract bg (first word) for the container, the rest goes to Text
  const [bgCls, ...textClsParts] = varCls.split(" ");
  const textCls = textClsParts.join(" ");

  return (
    <View
      className={cn("self-start px-2.5 py-[3px] rounded-full", bgCls)}
      style={style}
    >
      <Text className={cn("text-[11px] font-semibold", textCls)}>
        {children}
      </Text>
    </View>
  );
}
