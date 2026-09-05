import React, { memo } from "react";
import { Sparkles } from "lucide-react";

export const DashboardAiInsights = memo(({ conversionRate, pendingToday }) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.04]">
        <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
          Phân Tích & Đề Xuất
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3 h-3 text-amber-500" /> Trợ lý Genie
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-[#F9F9FB] dark:bg-slate-800/40 border border-black/[0.02] dark:border-white/[0.04] space-y-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Tối ưu hóa khung giờ đón khách
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Tỷ lệ duyệt đạt <strong className="text-slate-900 dark:text-white font-semibold">{conversionRate}%</strong>. Đẩy mạnh các khung giờ sáng sớm để tăng năng suất khai thác địa điểm.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F9F9FB] dark:bg-slate-800/40 border border-black/[0.02] dark:border-white/[0.04] space-y-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Nhịp độ xử lý hàng đợi
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Hiện có <strong className="text-slate-900 dark:text-white font-semibold">{pendingToday} đơn</strong> cần duyệt trong ngày. Xác nhận nhanh dưới 15 phút để tăng tỷ lệ hài lòng của du khách.
          </p>
        </div>
      </div>
    </div>
  );
});

DashboardAiInsights.displayName = "DashboardAiInsights";
export default DashboardAiInsights;
