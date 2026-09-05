import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Thẻ thống kê chuẩn Soft Neumorphic-Minimal SaaS (Warm Minimalist Dashboard)
 * 70% Trắng ngà / 20% Đen / 10% Vàng thương hiệu
 */
export default function TimStatsCard({
  title,
  value,
  icon: Icon,
  serial,
  color,
  textColor,
}) {
  return (
    <div className="group p-5 rounded-2xl bg-white transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/80 relative overflow-hidden flex items-center justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        </div>
        <p className="text-3xl font-extrabold tracking-tight text-slate-950 font-mono tabular-nums">{value}</p>
      </div>

      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs">
          <Icon className="h-5 w-5 stroke-[1.8]" />
        </div>
      )}
    </div>
  );
}
