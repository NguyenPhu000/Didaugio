import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";

export const DashboardTopServices = memo(({ topServices }) => {
  if (!topServices || topServices.length === 0) return null;

  const maxCount = Math.max(...topServices.map((s) => s.bookingCount || 0), 1);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/[0.04]">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
              Top Dịch Vụ Tiếp Nhận
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Xếp hạng gói trải nghiệm được yêu thích nhất
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
            {topServices.length} gói
          </span>
        </div>

        {/* Soft Ranked List with Elegant Progress Bars */}
        <div className="space-y-2.5 pt-1">
          {topServices.slice(0, 5).map((s, idx) => {
            const percent = Math.min(
              Math.round(((s.bookingCount || 0) / maxCount) * 100),
              100
            );
            const rankColors = [
              "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60",
              "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200/60",
              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60",
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
            ];
            const rankStyle = rankColors[idx] || rankColors[3];

            return (
              <div
                key={s.id || idx}
                className="p-3 rounded-[22px] bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2 hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border",
                        rankStyle
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {s.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white block">
                      {s.bookingCount || 0} lượt
                    </span>
                  </div>
                </div>

                {/* Soft Progress Track */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200/60 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500/80 via-sky-400 to-indigo-500 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 font-mono shrink-0">
                    {formatMoney(s.revenue || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
});

DashboardTopServices.displayName = "DashboardTopServices";
export default DashboardTopServices;
