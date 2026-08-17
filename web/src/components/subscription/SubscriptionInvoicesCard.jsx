import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatVND, formatDateTime } from "@/components/business/dashboardWidgetHelpers";
import {
  INVOICE_STATUS_STYLES,
  INVOICE_STATUS_KEYS,
} from "./subscriptionConstants";

export const SubscriptionInvoicesCard = memo(
  ({
    invoiceFilters,
    setInvoiceFilters,
    invoiceLoading,
    invoices,
    invoicePagination,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("subscription.invoice.title")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Lịch sử thanh toán và hóa đơn gói đối tác
            </p>
          </div>

          <Select
            value={invoiceFilters.status}
            onValueChange={(value) =>
              setInvoiceFilters((prev) => ({
                ...prev,
                status: value,
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-40 h-8 text-xs rounded-xl bg-slate-50 dark:bg-muted border-slate-200 cursor-pointer">
              <SelectValue placeholder={t("common.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="pending">
                {t(INVOICE_STATUS_KEYS.pending)}
              </SelectItem>
              <SelectItem value="paid">{t(INVOICE_STATUS_KEYS.paid)}</SelectItem>
              <SelectItem value="overdue">
                {t(INVOICE_STATUS_KEYS.overdue)}
              </SelectItem>
              <SelectItem value="canceled">
                {t(INVOICE_STATUS_KEYS.canceled)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          {invoiceLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Đang tải danh sách hóa đơn...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t("subscription.invoice.empty")}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-muted-foreground text-left border-b border-slate-100 dark:border-border/60">
                  <th className="pb-3 font-semibold">
                    {t("subscription.invoice.table.date")}
                  </th>
                  <th className="pb-3 font-semibold">
                    {t("subscription.invoice.table.plan")}
                  </th>
                  <th className="pb-3 font-semibold">
                    {t("subscription.invoice.table.amount")}
                  </th>
                  <th className="pb-3 font-semibold">
                    {t("subscription.invoice.table.transactionRef")}
                  </th>
                  <th className="pb-3 font-semibold text-right">
                    {t("subscription.invoice.table.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/40 font-medium">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3.5 text-slate-500">
                      {formatDateTime(invoice.issuedAt || invoice.createdAt)}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-foreground">
                      {invoice.plan?.name || invoice.description || "-"}
                    </td>
                    <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {formatVND(invoice.amount)}
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      {invoice.transactionRef || invoice.id?.slice(0, 8) || "-"}
                    </td>
                    <td className="py-3.5 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold rounded-lg",
                          INVOICE_STATUS_STYLES[invoice.status] ||
                            INVOICE_STATUS_STYLES.pending
                        )}
                      >
                        {t(
                          INVOICE_STATUS_KEYS[invoice.status] ||
                            "subscription.invoice.status.pending"
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {invoicePagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border/60 text-xs">
            <p className="text-slate-400">
              {t("subscription.invoice.pagination", {
                page: invoicePagination.page,
                totalPages: invoicePagination.totalPages,
                total: invoicePagination.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-bold cursor-pointer"
                disabled={invoiceFilters.page <= 1}
                onClick={() =>
                  setInvoiceFilters((prev) => ({
                    ...prev,
                    page: prev.page - 1,
                  }))
                }
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-xs font-bold cursor-pointer"
                disabled={invoiceFilters.page >= invoicePagination.totalPages}
                onClick={() =>
                  setInvoiceFilters((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
              >
                {t("common.nextPage")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SubscriptionInvoicesCard.displayName = "SubscriptionInvoicesCard";
export default SubscriptionInvoicesCard;
