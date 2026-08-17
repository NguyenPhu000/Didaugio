import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { cn } from "@/lib/utils";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import { formatVND, formatDateTime } from "@/components/business/dashboardWidgetHelpers";

const TYPE_CONFIG = {
  money_in: {
    label: "Tiền vào",
    className: "bg-[#F0FDF4] text-emerald-800 border-[#BBF7D0]",
    dot: "bg-emerald-500",
  },
  refund: {
    label: "Hoàn tiền",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  payout: {
    label: "Rút tiền",
    className: "bg-[#F2F7FF] text-blue-800 border-[#BED6FF]",
    dot: "bg-blue-500",
  },
  ledger: {
    label: "Sổ cái",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
};

export default function CashflowLedgerPage({
  title,
  description,
  useSummary,
  useRows,
  exportFilename = "cashflow",
}) {
  const [filters, setFilters] = useState({
    type: "all",
    gateway: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });

  const { data: summaryRes, isLoading: summaryLoading, refetch: refetchSummary } =
    useSummary(filters);
  const { data: rowsRes, isLoading: rowsLoading, refetch: refetchRows } =
    useRows(filters);

  const summary = summaryRes?.data?.data || summaryRes?.data || {};
  const rawRowsData = rowsRes?.data?.data || rowsRes?.data || {};
  const rows = Array.isArray(rawRowsData)
    ? rawRowsData
    : Array.isArray(rawRowsData?.rows)
      ? rawRowsData.rows
      : [];
  const pagination =
    rowsRes?.data?.pagination ||
    rawRowsData?.pagination || {
      page: 1,
      totalPages: 1,
      total: rows.length,
    };

  const statCards = useMemo(
    () => [
      {
        title: "Tổng tiền vào",
        value: formatVND(summary.totalIn),
        bgClass: "bg-[#DCFCE7] dark:bg-emerald-950/30 border-[#BBF7D0] dark:border-emerald-900/40 text-slate-800 dark:text-emerald-200",
        dotColor: "bg-emerald-500",
        subtitle: `${summary.counts?.paidPayments || 0} giao dịch nhận tiền`,
      },
      {
        title: "Hoàn tiền",
        value: formatVND(summary.totalRefunded),
        bgClass: "bg-[#FFE4E6] dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-rose-200",
        dotColor: "bg-rose-500",
        subtitle: `${summary.counts?.refunds || 0} giao dịch hoàn trả`,
      },
      {
        title: "Đã rút / Chuyển",
        value: formatVND(summary.totalPayouts),
        bgClass: "bg-[#D7E5FF] dark:bg-blue-950/30 border-[#BED6FF] dark:border-blue-900/40 text-slate-800 dark:text-blue-200",
        dotColor: "bg-blue-500",
        subtitle: `${summary.counts?.transferredPayouts || 0} lần payout`,
      },
      {
        title: "Số dư ví khả dụng",
        value: formatVND(summary.walletBalance),
        bgClass: "bg-[#FEE8D3] dark:bg-amber-950/30 border-[#FCD4AF] dark:border-amber-900/40 text-slate-800 dark:text-amber-200",
        dotColor: "bg-amber-500",
        subtitle: `Tạm giữ: ${formatVND(summary.frozenBalance || 0)}`,
      },
    ],
    [
      summary.totalIn,
      summary.totalRefunded,
      summary.totalPayouts,
      summary.walletBalance,
      summary.frozenBalance,
      summary.counts?.paidPayments,
      summary.counts?.refunds,
      summary.counts?.transferredPayouts,
    ]
  );

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const refresh = () => {
    refetchSummary();
    refetchRows();
  };

  const handleExport = () => {
    exportToCsv({
      filename: slugifyFilename(exportFilename),
      columns: [
        { key: "occurredAt", label: "Thời gian" },
        { key: "type", label: "Loại" },
        { key: "amount", label: "Số tiền" },
        { key: "status", label: "Trạng thái" },
        { key: "gateway", label: "Kênh" },
        { key: "transactionRef", label: "Mã đối soát" },
        { key: "description", label: "Mô tả" },
      ],
      data: rows.map((row) => ({
        ...row,
        occurredAt: formatDateTime(row.occurredAt),
      })),
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Làm mới
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* ── Sub Navigation ── */}
      <FinancialSubNav activeTab="cashflow" />

      {/* ── Top Bento KPI Metrics (Signature Notched Corners) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-[32px]" />
            ))
          : (
              <>
                <AetherBentoCard
                  title="Tổng tiền vào"
                  subtitle={`${summary.counts?.paidPayments || 0} giao dịch nhận tiền`}
                  value={formatVND(summary.totalIn)}
                  variant="mint"
                />
                <AetherBentoCard
                  title="Hoàn tiền"
                  subtitle={`${summary.counts?.refunds || 0} giao dịch hoàn trả`}
                  value={formatVND(summary.totalRefunded)}
                  variant="rose"
                />
                <AetherBentoCard
                  title="Đã rút / Chuyển"
                  subtitle={`${summary.counts?.transferredPayouts || 0} lần payout`}
                  value={formatVND(summary.totalPayouts)}
                  variant="blue"
                />
                <AetherBentoCard
                  title="Số dư ví khả dụng"
                  subtitle={`Tạm giữ: ${formatVND(summary.frozenBalance || 0)}`}
                  value={formatVND(summary.walletBalance)}
                  variant="peach"
                />
              </>
            )}
      </div>

      {/* ── Cashflow Transactions Stream ── */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Sổ Nhật Ký Giao Dịch
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Theo dõi chi tiết tất cả biến động số dư và nguồn thu chi trong hệ thống
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filters.type}
              onValueChange={(value) => setFilter("type", value)}
            >
              <SelectTrigger className="w-[140px] h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
                <SelectValue placeholder="Loại dòng tiền" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="money_in">Tiền vào</SelectItem>
                <SelectItem value="refund">Hoàn tiền</SelectItem>
                <SelectItem value="payout">Rút tiền</SelectItem>
                <SelectItem value="ledger">Sổ cái</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.gateway}
              onValueChange={(value) => setFilter("gateway", value)}
            >
              <SelectTrigger className="w-[140px] h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
                <SelectValue placeholder="Cổng thanh toán" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả cổng</SelectItem>
                <SelectItem value="SEPAY">SePay</SelectItem>
                <SelectItem value="VNPAY">VNPay</SelectItem>
                <SelectItem value="MOMO">MoMo</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilter("startDate", e.target.value)}
              className="h-9 w-36 rounded-2xl text-xs border-slate-200 dark:border-border/80"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilter("endDate", e.target.value)}
              className="h-9 w-36 rounded-2xl text-xs border-slate-200 dark:border-border/80"
            />
          </div>
        </div>

        {/* Content list */}
        {rowsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-muted animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            Chưa có dòng tiền phù hợp với bộ lọc này.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {rows.map((row) => {
              const config = TYPE_CONFIG[row.type] || TYPE_CONFIG.ledger;
              const isOut = row.direction === "out";

              return (
                <div
                  key={row.id}
                  className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-50 dark:hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                          config.className
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                        {config.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {row.transactionRef || row.transactionId || "—"}
                      </span>
                      {row.booking?.bookingCode && (
                        <span className="text-[10px] font-bold bg-slate-200 dark:bg-muted px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                          #{row.booking.bookingCode}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {row.description || "Giao dịch thanh toán dịch vụ"}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(row.occurredAt)} • Kênh: <strong className="text-slate-700 dark:text-slate-300">{row.gateway || "Nội bộ"}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={cn(
                        "text-lg sm:text-xl font-black tracking-tight",
                        isOut ? "text-rose-600" : "text-emerald-600"
                      )}
                    >
                      {isOut ? "-" : "+"}
                      {formatVND(row.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border/60">
            <p className="text-xs text-slate-400">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} giao dịch)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="rounded-2xl h-8 px-4 text-xs font-bold"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="rounded-2xl h-8 px-4 text-xs font-bold"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
