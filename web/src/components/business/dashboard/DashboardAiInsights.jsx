import React, { memo } from "react";
import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export const DashboardAiInsights = memo(({ conversionRate, pendingToday }) => {
  return (
    <div className="p-1.5 rounded-[36px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
      <div className="p-6 sm:p-7 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200/40 dark:border-white/[0.04] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/60">
          <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
            Phân Tích AI & Đề Xuất
          </h3>
          <span className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Trợ lý iPoint
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-[22px] bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Tối ưu hóa khung giờ tiếp đón
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Tỷ lệ xác nhận đạt <strong>{conversionRate}%</strong>. Đẩy mạnh các khung giờ sáng sớm để tăng năng suất.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-[22px] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Hàng đợi trực tiếp
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Có <strong>{pendingToday} yêu cầu</strong> cần duyệt trong ngày. Xử lý dưới 15 phút để tăng điểm CSAT.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardAiInsights.displayName = "DashboardAiInsights";
export default DashboardAiInsights;
