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
    <div className="group p-5 rounded-2xl bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 border border-black/[0.04] relative overflow-hidden flex items-center justify-between gap-4">
      {/* Subtle top yellow accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-[#F3E600] transition-colors" />

      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        </div>
        <p className="text-3xl font-extrabold tracking-tight text-slate-950 font-mono tabular-nums">{value}</p>
      </div>

      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#F8F7F3] border border-black/[0.04] flex items-center justify-center shrink-0 text-slate-800 group-hover:bg-slate-950 group-hover:text-[#F3E600] transition-all duration-300 shadow-2xs">
          <Icon className="h-5 w-5 stroke-[1.8]" />
        </div>
      )}
    </div>
  );
}
