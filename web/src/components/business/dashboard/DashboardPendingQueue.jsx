import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, X as XIcon, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { formatMoney } from "@/utils/formatters";

export const DashboardPendingQueue = memo(
  ({ pendingQueue = [], queueLoading, approveMutation, rejectMutation }) => {
    const navigate = useNavigate();
    const count = pendingQueue.length;

    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_rgba(0,0,0,0.02)] space-y-6">
        {/* Header bar: Không dùng icon trang trí thừa, dùng typography sắc sảo & action pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Hàng Đợi Chờ Duyệt Tức Thì
              </h3>
              {count > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                  {count} đơn
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Xác nhận hoặc từ chối nhanh chóng trong 1 thao tác
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(BUSINESS_ROUTES.BOOKING_PROCESS)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-semibold shadow-sm hover:shadow transition-all active:scale-95 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mở chế độ quẹt mã QR & xử lý nhanh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Queue Grid Cards */}
        {queueLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="py-12 px-6 rounded-2xl bg-[#F9F9FB] dark:bg-slate-800/40 border border-black/[0.02] dark:border-white/[0.04] text-center space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Không có đơn nào đang chờ duyệt
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
              Tất cả các yêu cầu đặt chỗ của du khách đều đã được xử lý hoàn tất.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingQueue.map((item) => {
              const customerName =
                item.customerName ||
                item.user?.name ||
                item.user?.fullName ||
                `Khách #${item.id}`;
              const serviceName =
                item.service?.name || item.serviceName || "Dịch vụ tham quan";
              const price = item.finalPrice ?? item.totalPrice ?? 0;
              const isProcessing =
                approveMutation.isPending || rejectMutation.isPending;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#F9F9FB] dark:bg-slate-800/40 hover:bg-[#F4F4F7] dark:hover:bg-slate-800/70 border border-black/[0.03] dark:border-white/[0.04] hover:border-black/[0.08] dark:hover:border-white/10 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        #{item.id}
                      </span>
                      <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                        {formatMoney(price)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {serviceName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Khách: <span className="font-medium text-slate-800 dark:text-slate-200">{customerName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action 1-Click Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => approveMutation.mutate(item.id)}
                      className="h-8 rounded-full bg-slate-900 hover:bg-emerald-600 text-white dark:bg-zinc-800 dark:hover:bg-emerald-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Duyệt</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => rejectMutation.mutate(item.id)}
                      className="h-8 rounded-full bg-muted/80 hover:bg-destructive/15 text-muted-foreground hover:text-destructive text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

DashboardPendingQueue.displayName = "DashboardPendingQueue";
export default DashboardPendingQueue;
