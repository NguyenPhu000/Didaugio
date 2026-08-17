import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatVND, formatDateTime } from "@/components/business/dashboardWidgetHelpers";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import {
  usePayInvoiceFromWallet,
  useSubscriptionInvoices,
} from "@/hooks/queries/useSubscriptionQueries";

const STATUS_CONFIGS = {
  pending: {
    label: "Chờ thanh toán",
    className: "bg-[#FFF9F2] text-amber-800 border-[#FCD4AF]",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-[#F0FDF4] text-emerald-800 border-[#BBF7D0]",
    dot: "bg-emerald-500",
  },
  overdue: {
    label: "Quá hạn",
    className: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  canceled: {
    label: "Đã hủy",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export default function InvoiceHistoryPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    page: 1,
    limit: 20,
  });

  const { data, isLoading, refetch } = useSubscriptionInvoices(filters);
  const payFromWallet = usePayInvoiceFromWallet();
  const rawInvoices = data?.data?.data || data?.data || [];
  const pagination = data?.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const invoices = useMemo(() => {
    return rawInvoices.filter((inv) => {
      if (!filters.search.trim()) return true;
      const query = filters.search.toLowerCase();
      return (
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.transactionRef?.toLowerCase().includes(query) ||
        inv.notes?.toLowerCase().includes(query)
      );
    });
  }, [rawInvoices, filters.search]);

  const stats = useMemo(() => {
    return {
      total: rawInvoices.length,
      pending: rawInvoices.filter((i) => i.status === "pending").length,
      paid: rawInvoices.filter((i) => i.status === "paid").length,
      overdue: rawInvoices.filter((i) => i.status === "overdue" || i.status === "canceled").length,
    };
  }, [rawInvoices]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("subscription.invoice.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            {t("subscription.invoice.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Sub Navigation ── */}
      <FinancialSubNav activeTab="invoices" />

      {/* ── Top Bento KPI Metrics (Signature Notched Corners) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Tổng hóa đơn"
          subtitle="Toàn bộ kỳ hóa đơn dịch vụ"
          value={stats.total}
          variant="gray"
        />

        <AetherBentoCard
          title="Chờ thanh toán"
          subtitle="Cần thanh toán để duy trì gói"
          value={stats.pending}
          variant="peach"
        />

        <AetherBentoCard
          title="Đã thanh toán"
          subtitle="Hóa đơn hợp lệ hoàn tất"
          value={stats.paid}
          variant="mint"
        />

        <AetherBentoCard
          title="Quá hạn / Hủy"
          subtitle="Hóa đơn không phát sinh nợ"
          value={stats.overdue}
          variant="rose"
        />
      </div>

      {/* ── Invoices Bento Section ── */}
      <div className="p-6 sm:p-7 rounded-[36px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Danh Sách Hóa Đơn Dịch Vụ
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Chi tiết phí gói dịch vụ, hạn sử dụng và đối soát chứng từ thanh toán
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                placeholder="Tìm mã hóa đơn, đối soát..."
                className="pl-8 h-9 rounded-2xl text-xs w-full sm:w-64 border-slate-200 dark:border-border/80"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ thanh toán</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
                <SelectItem value="canceled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {(filters.status !== "all" || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ status: "all", search: "", page: 1, limit: 20 })}
                className="h-9 px-2 rounded-2xl text-xs text-slate-500"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Xóa lọc
              </Button>
            )}
          </div>
        </div>

        {/* Content stream */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-muted animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            {t("subscription.invoice.empty")}
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {invoices.map((invoice) => {
              const statusCfg = STATUS_CONFIGS[invoice.status] || STATUS_CONFIGS.pending;

              return (
                <div
                  key={invoice.id}
                  className="p-4 sm:p-5 rounded-[26px] border border-slate-100 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 hover:bg-slate-50 dark:hover:bg-muted/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {invoice.plan?.name || invoice.description || "Gói dịch vụ"}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{invoice.invoiceNumber || invoice.id?.slice(0, 8)}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1",
                          statusCfg.className
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium">
                      Ngày lập: {formatDateTime(invoice.issuedAt || invoice.createdAt)} • Mã đối soát: <strong className="font-mono text-slate-700 dark:text-slate-300">{invoice.transactionRef || "—"}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                      {formatVND(invoice.amount)}
                    </span>

                    {invoice.status === "pending" && (
                      <Button
                        size="sm"
                        disabled={payFromWallet.isPending}
                        onClick={() => payFromWallet.mutate(invoice.id)}
                        className="rounded-2xl h-8 px-4 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                      >
                        {payFromWallet.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : null}
                        Thanh toán bằng ví
                      </Button>
                    )}
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
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} hóa đơn)
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
