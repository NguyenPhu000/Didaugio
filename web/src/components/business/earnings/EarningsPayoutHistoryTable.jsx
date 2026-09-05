import React, { memo } from "react";
import { Search, X } from "lucide-react";
import { formatMoney } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-[#FFF9F2] text-amber-800 border-[#FCD4AF]",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-[#F2F7FF] text-blue-800 border-[#BED6FF]",
    dot: "bg-blue-500",
  },
  transferred: {
    label: "Đã chuyển tiền",
    className: "bg-[#F0FDF4] text-emerald-800 border-[#BBF7D0]",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Bị từ chối",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export const EarningsPayoutHistoryTable = memo(
  ({
    payoutFilter,
    setPayoutFilter,
    historyLoading,
    filteredPayouts,
    onCancelPayout,
    cancelPending,
  }) => {
    return (
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Lịch Sử Yêu Cầu Rút Tiền
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Danh sách các giao dịch rút tiền về tài khoản ngân hàng của đối tác
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={payoutFilter.search}
                onChange={(e) =>
                  setPayoutFilter((f) => ({ ...f, search: e.target.value }))
                }
                placeholder="Tìm ngân hàng, số TK..."
                className="pl-8 h-9 rounded-2xl text-xs w-48 sm:w-60 border-slate-200 dark:border-border/80"
              />
            </div>

            <Select
              value={payoutFilter.status}
              onValueChange={(val) =>
                setPayoutFilter((f) => ({ ...f, status: val }))
              }
            >
              <SelectTrigger className="w-[150px] h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="transferred">Đã chuyển tiền</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
              </SelectContent>
            </Select>

            {(payoutFilter.status !== "all" || payoutFilter.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPayoutFilter({ status: "all", search: "" })}
                className="h-9 px-2 rounded-2xl text-xs text-slate-500"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Xóa lọc
              </Button>
            )}
          </div>
        </div>

        {/* Content list */}
        {historyLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-100 dark:bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            Chưa có yêu cầu rút tiền nào trong khoảng thời gian này.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {filteredPayouts.map((p) => {
              const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.pending;
              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-50 dark:hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {p.bankName || "Ngân hàng"}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {p.bankAccountNumber || p.bankAccount || ""}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                          statusInfo.className
                        )}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dot)}
                        />
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">
                      Chủ TK:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {p.bankAccountName || "—"}
                      </strong>{" "}
                      • Ngày yêu cầu:{" "}
                      {new Date(p.requestedAt || p.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                      {p.note && <span> • {p.note}</span>}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      {formatMoney(p.amount)}
                    </span>

                    {p.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancelPayout(p.id)}
                        disabled={cancelPending}
                        className="rounded-2xl h-8 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Hủy yêu cầu
                      </Button>
                    )}
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

EarningsPayoutHistoryTable.displayName = "EarningsPayoutHistoryTable";
export default EarningsPayoutHistoryTable;
