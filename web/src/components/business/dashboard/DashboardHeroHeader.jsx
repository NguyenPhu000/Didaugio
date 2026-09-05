import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { BUSINESS_ROUTES } from "@/constants/routes";

export const DashboardHeroHeader = memo(({ displayName }) => {
  const navigate = useNavigate();

  return (
    <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Vận Hành Thời Gian Thực
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Hệ sinh thái Du lịch Cần Thơ
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Bảng điều phối — {displayName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
            Trung tâm kiểm soát đơn đặt chỗ, hàng đợi duyệt tức thì, doanh thu và dữ liệu tương tác du khách.
          </p>
        </div>

        {/* Minimalist Action Deck: Giảm bớt icon rườm rà, nút dứt khoát */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKING_SCHEDULE)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Lịch tuần
          </button>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.REPORTS)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Báo cáo
          </button>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.SERVICES)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo gói dịch vụ</span>
          </button>
        </div>
      </div>
    </div>
  );
});

DashboardHeroHeader.displayName = "DashboardHeroHeader";
export default DashboardHeroHeader;
