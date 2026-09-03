import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, X as XIcon, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { formatMoney } from "@/utils/formatters";

export const DashboardPendingQueue = memo(
  ({ pendingQueue, queueLoading, approveMutation, rejectMutation }) => {
    const navigate = useNavigate();

    return (
      <div className="p-1.5 rounded-[36px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="p-6 sm:p-7 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200/40 dark:border-white/[0.04] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                  Hàng Đợi Chờ Duyệt Tức Thì
                </h3>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Xác nhận hoặc từ chối nhanh chóng trong 1 thao tác
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(BUSINESS_ROUTES.BOOKING_PROCESS)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-auto"
            >
              Mở chế độ quẹt mã QR & xử lý nhanh <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Queue Grid Cards */}
          {queueLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-[24px]" />
              ))}
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-8 rounded-[24px] bg-slate-50 dark:bg-muted/30 border border-dashed border-slate-200 dark:border-border text-center space-y-1.5">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                Không có đơn nào đang chờ duyệt
              </span>
              <p className="text-xs text-slate-500">
                Tuyệt vời! Tất cả các yêu cầu đặt chỗ đều đã được xử lý hoàn tất.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="p-4 rounded-[26px] bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-white/10 transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-black text-slate-400">
                          #{item.id}
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(price)}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {serviceName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Khách: <strong className="text-slate-800 dark:text-slate-200">{customerName}</strong>
                      </p>
                    </div>

                    {/* Action 1-Click Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => approveMutation.mutate(item.id)}
                        className="h-8 rounded-full bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => rejectMutation.mutate(item.id)}
                        className="h-8 rounded-full bg-slate-200/70 hover:bg-rose-100 hover:text-rose-700 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        <XIcon className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DashboardPendingQueue.displayName = "DashboardPendingQueue";
export default DashboardPendingQueue;
