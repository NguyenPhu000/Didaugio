import { Text, View } from "react-native";
import { cn } from "../../lib/cn";

const VARIANT_CLS = {
  primary: "bg-primary-50 border border-primary-200 text-primary-700",
  success: "bg-emerald-50 border border-emerald-200 text-emerald-700",
  warning: "bg-amber-50 border border-amber-200 text-amber-700",
  error: "bg-rose-50 border border-rose-200 text-rose-600",
  neutral: "bg-slate-50 border border-slate-200 text-slate-600",
  gold: "bg-amber-50 border border-amber-200 text-amber-700",
};

export function Badge({ children, variant = "primary", style }) {
  const varCls = VARIANT_CLS[variant] ?? VARIANT_CLS.neutral;
  const [bgCls, borderCls, textCls] = varCls.split(" ");

  return (
    <View
      className={cn(
        "self-start px-3 py-1.5 rounded-full",
        bgCls,
        borderCls,
      )}
      style={style}
    >
      <Text className={cn("text-[11px] font-semibold uppercase tracking-[0.8px]", textCls)}>
        {children}
      </Text>
    </View>
  );
}
