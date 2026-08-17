import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

const STATUS_CONFIG = {
  [BOOKING_STATUS.PENDING]: {
    label: "Chờ xác nhận",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60",
    dotClass: "bg-amber-500",
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: "Đã xác nhận",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60",
    dotClass: "bg-blue-500",
  },
  [BOOKING_STATUS.COMPLETED]: {
    label: "Hoàn tất",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60",
    dotClass: "bg-emerald-500",
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: "Đã hủy",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60",
    dotClass: "bg-rose-500",
  },
  [BOOKING_STATUS.NO_SHOW]: {
    label: "Vắng mặt",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export const DashboardRecentBookings = memo(({ recentBookings, bookingsLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="p-1.5 rounded-[36px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
      <div className="p-6 sm:p-7 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200/40 dark:border-white/[0.04] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
              Sổ Cái Giao Dịch Gần Nhất
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              5 lượt đặt chỗ phát sinh mới nhất trong hệ thống
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKINGS)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {bookingsLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-2xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Chưa có dữ liệu đặt chỗ phát sinh
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 font-bold border-b border-slate-100 dark:border-white/[0.04]">
                <tr>
                  <th className="pb-3 font-semibold">Mã</th>
                  <th className="pb-3 font-semibold">Khách hàng</th>
                  <th className="pb-3 font-semibold">Dịch vụ</th>
                  <th className="pb-3 font-semibold">Ngày sử dụng</th>
                  <th className="pb-3 font-semibold">Giá trị</th>
                  <th className="pb-3 font-semibold text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {recentBookings.map((b) => {
                  const status = STATUS_CONFIG[b.status] || STATUS_CONFIG[BOOKING_STATUS.PENDING];
                  const customerName =
                    b.customerName ||
                    b.user?.name ||
                    b.user?.fullName ||
                    `Khách #${b.id}`;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/business/bookings/${b.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        #{b.id}
                      </td>
                      <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {customerName}
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {b.service?.name || b.serviceName || "Gói tham quan"}
                      </td>
                      <td className="py-3.5 text-slate-500 font-mono">
                        {b.useDate ? b.useDate.slice(0, 10) : "Chưa xác định"}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                        {formatVND(b.finalPrice ?? b.totalPrice ?? 0)}
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                            status.badgeClass
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
});

DashboardRecentBookings.displayName = "DashboardRecentBookings";
export default DashboardRecentBookings;
