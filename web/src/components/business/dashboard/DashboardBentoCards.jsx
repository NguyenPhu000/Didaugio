import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { formatMoney } from "@/utils/formatters";

export const DashboardBentoCards = memo(
  ({
    totalBookings,
    placesCount,
    servicesCount,
    netRevenue,
    conversionRate,
    newThisWeek,
    pendingToday,
  }) => {
    const navigate = useNavigate();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Warm Peach Card - Tổng Đơn Đặt Chỗ */}
        <AetherBentoCard
          title="Tổng Lượt Đặt Chỗ"
          subtitle="Tất cả các dịch vụ đã tiếp nhận"
          value={totalBookings.toLocaleString()}
          variant="peach"
          onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
        />

        {/* Card 2: Soft Periwinkle Blue Card - Địa Điểm & Dịch Vụ */}
        <AetherBentoCard
          title="Cơ Sở & Gói Dịch Vụ"
          subtitle={`${placesCount} cơ sở • ${servicesCount} gói trải nghiệm`}
          value={(placesCount + servicesCount).toLocaleString()}
          variant="blue"
          onClick={() => navigate(BUSINESS_ROUTES.PLACES)}
        />

        {/* Card 3: Soft Muted White/Stone Card - Doanh Thu Thực Nhận */}
        <AetherBentoCard
          title="Doanh Thu Thực Nhận"
          subtitle={`Tỷ lệ chuyển đổi: ${conversionRate}%`}
          value={formatMoney(netRevenue)}
          variant="gray"
          onClick={() => navigate(BUSINESS_ROUTES.REVENUE)}
        />

        {/* Card 4: Executive Double-Pod Stack (Balanced & Proportioned) */}
        <div className="flex flex-col justify-between gap-3 h-full min-h-[165px]">
          {/* Pod 1: Live Telemetry & Queue Pulse */}
          <div className="flex-1 p-4 rounded-[26px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Nhịp độ tiếp nhận
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Trực tuyến
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
              <div>
                <span className="font-mono text-xl font-black text-slate-900 dark:text-white leading-none block">
                  {newThisWeek}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                  Đơn tuần này
                </span>
              </div>
              <div className="border-l border-slate-100 dark:border-white/[0.06] pl-2.5">
                <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400 leading-none block">
                  {pendingToday}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                  Chờ duyệt ngay
                </span>
              </div>
            </div>
          </div>

          {/* Pod 2: Subscription Package & Tier Upgrade Banner */}
          <div
            onClick={() => navigate(BUSINESS_ROUTES.SUBSCRIPTION_PLANS)}
            className="group p-4 rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border border-slate-800 dark:border-white/10 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 flex items-center justify-between gap-3 active:scale-[0.98]"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-400/[0.12] text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#BDE0FE] border border-sky-300/20 backdrop-blur-xs">
                  Gói Doanh Nghiệp
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200/90 truncate group-hover:text-white transition-colors">
                Quản lý & nâng cấp giải pháp
              </p>
            </div>

            <span className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:bg-[#BDE0FE] group-hover:text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    );
  }
);

DashboardBentoCards.displayName = "DashboardBentoCards";
export default DashboardBentoCards;
