import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Receipt, WalletCards, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatVND, formatDateTime } from "@/components/business/dashboardWidgetHelpers";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import {
  usePayInvoiceFromWallet,
  useSubscriptionInvoices,
} from "@/hooks/queries/useSubscriptionQueries";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  canceled: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

const STATUS_LABELS = {
  pending: "subscription.invoice.status.pending",
  paid: "subscription.invoice.status.paid",
  overdue: "subscription.invoice.status.overdue",
  canceled: "subscription.invoice.status.canceled",
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

  // Client-side search fallback if server search isn't performed
  const invoices = rawInvoices.filter((inv) => {
    if (!filters.search.trim()) return true;
    const query = filters.search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(query) ||
      inv.transactionRef?.toLowerCase().includes(query) ||
      inv.notes?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("subscription.invoice.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subscription.invoice.subtitle")}
          </p>
        </div>
      </div>

      <FinancialSubNav activeTab="invoices" />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
                placeholder="Tìm theo số hóa đơn, mã đối soát..."
                className="pl-9"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value, page: 1 }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("common.filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="pending">{t(STATUS_LABELS.pending)}</SelectItem>
                <SelectItem value="paid">{t(STATUS_LABELS.paid)}</SelectItem>
                <SelectItem value="overdue">{t(STATUS_LABELS.overdue)}</SelectItem>
                <SelectItem value="canceled">{t(STATUS_LABELS.canceled)}</SelectItem>
              </SelectContent>
            </Select>
            {(filters.status !== "all" || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ status: "all", search: "", page: 1, limit: 20 })}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Xóa lọc
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("subscription.invoice.empty")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscription.invoice.table.date")}</TableHead>
                  <TableHead>{t("subscription.invoice.table.plan")}</TableHead>
                  <TableHead className="text-right">{t("subscription.invoice.table.amount")}</TableHead>
                  <TableHead>{t("subscription.invoice.table.status")}</TableHead>
                  <TableHead>{t("subscription.invoice.table.transactionRef")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(invoice.issuedAt || invoice.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.plan?.name || invoice.description || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatVND(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          STATUS_STYLES[invoice.status] || STATUS_STYLES.pending,
                        )}
                      >
                        {t(STATUS_LABELS[invoice.status] || "subscription.invoice.status.pending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {invoice.transactionRef || invoice.id?.slice(0, 8) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status === "pending" ? (
                        <Button
                          size="sm"
                          disabled={payFromWallet.isPending}
                          onClick={() => payFromWallet.mutate(invoice.id)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {payFromWallet.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <WalletCards className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {payFromWallet.isPending
                            ? t("subscription.invoice.paying")
                            : t("subscription.invoice.payWithWallet")}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {t("subscription.invoice.pagination", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  {t("common.nextPage")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
