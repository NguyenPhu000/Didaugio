import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileBarChart, CalendarDays } from "lucide-react";
import { BUSINESS_ROUTES } from "@/constants/routes";

export const DashboardHeroHeader = memo(({ displayName }) => {
  const navigate = useNavigate();

  return (
    <div className="relative p-4 sm:p-8 rounded-2xl sm:rounded-[36px] bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200/80 dark:border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Ambient Radial Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Vận Hành Thời Gian Thực
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              • Cần Thơ Smart Tourism
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Bảng Điều Phối — {displayName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Trung tâm kiểm soát toàn diện: theo dõi lượt đặt chỗ, quản lý hàng đợi tức thì, phân tích doanh thu và bản đồ mật độ tương tác du khách.
          </p>
        </div>

        {/* Button-in-Button Action Deck */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKING_SCHEDULE)}
            className="flex-1 sm:flex-initial justify-between group flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 text-slate-900 dark:text-white text-xs font-extrabold shadow-sm transition-all duration-300 active:scale-[0.98]"
          >
            <span>Lịch Tuần</span>
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
              <CalendarDays className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.REPORTS)}
            className="flex-1 sm:flex-initial justify-between group flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 text-slate-900 dark:text-white text-xs font-extrabold shadow-sm transition-all duration-300 active:scale-[0.98]"
          >
            <span>Báo Cáo</span>
            <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
              <FileBarChart className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.SERVICES)}
            className="w-full sm:w-auto justify-between group flex items-center gap-3 pl-5 pr-2 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold shadow-md hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
          >
            <span>Tạo Gói Dịch Vụ</span>
            <span className="w-7 h-7 rounded-full bg-white/20 dark:bg-slate-950/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
              <Plus className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

DashboardHeroHeader.displayName = "DashboardHeroHeader";
export default DashboardHeroHeader;
