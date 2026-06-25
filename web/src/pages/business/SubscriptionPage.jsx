import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  Users,
  Building2,
  Receipt,
  XCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { formatVND, formatDate, formatDateTime } from "@/components/business/dashboardWidgetHelpers";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { useCurrentSubscription, useSubscriptionInvoices, useCancelSubscription } from "@/hooks/queries/useSubscriptionQueries";
import PlanBadge from "@/components/subscription/PlanBadge";
import GracePeriodBanner from "@/components/subscription/GracePeriodBanner";

const STATUS_LABELS = {
  active: "subscription.status.active",
  grace: "subscription.status.grace",
  past_due: "subscription.status.past_due",
  canceled: "subscription.status.canceled",
  trialing: "subscription.status.active",
};

const INVOICE_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  canceled: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

const INVOICE_STATUS_KEYS = {
  pending: "subscription.invoice.status.pending",
  paid: "subscription.invoice.status.paid",
  overdue: "subscription.invoice.status.overdue",
  canceled: "subscription.invoice.status.canceled",
};

function UsageItem({ icon, label, used, limit }) {
  const Icon = icon;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">
            {used}
            {limit ? ` / ${limit}` : ""}
          </span>
        </div>
        {limit > 0 && (
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CancelDialog({ open, onOpenChange, planName, onConfirm, isLoading }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {t("subscription.cancel.title")}
          </DialogTitle>
          <DialogDescription>
            {t("subscription.cancel.confirm", { planName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              <strong>{t("subscription.cancel.warningLabel")}</strong> {t("subscription.cancel.warningText")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("subscription.cancel.reasonLabel")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("subscription.cancel.reasonPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("subscription.cancel.keepPlan")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("subscription.cancel.confirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCurrentSubscription();
  const [invoiceFilters, setInvoiceFilters] = useState({ status: "all", page: 1, limit: 10 });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: invoiceData, isLoading: invoiceLoading } = useSubscriptionInvoices(invoiceFilters);
  const cancelMutation = useCancelSubscription();

  const sub = data?.data?.data || data?.data || {};
  const plan = sub.plan || {};
  const usage = sub.usage || {};

  const invoices = invoiceData?.data?.data || invoiceData?.data || [];
  const invoicePagination = invoiceData?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleCancel = (reason) => {
    cancelMutation.mutate(reason, {
      onSuccess: () => setCancelDialogOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  const isCanceled = sub.status === "canceled";

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("subscription.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subscription.currentPlan")}
          </p>
        </div>
        <div className="flex gap-2">
          {!isCanceled && (
            <>
              <Button asChild className="gap-1.5">
                <Link to={BUSINESS_ROUTES.SUBSCRIPTION_PLANS}>
                  <ArrowUpRight className="h-4 w-4" />
                  {t("subscription.upgradeBtn")}
                </Link>
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                {t("subscription.cancel.cancelPlan")}
              </Button>
            </>
          )}
        </div>
      </div>

      <GracePeriodBanner subscription={sub} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("subscription.currentPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlanBadge planSlug={plan.slug} />
                <span className="text-lg font-semibold">{plan.name}</span>
              </div>
              <span className="text-xl font-bold">
                {formatVND(plan.priceMonthly)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{t("subscription.plans.monthly")}
                </span>
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t("common.status")}</p>
                <p className="font-medium capitalize">
                  {t(STATUS_LABELS[sub.status] || "common.statusActive")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("subscription.expiresAt")}</p>
                <p className="font-medium">{formatDate(sub.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("subscription.billingCycle")}</p>
                <p className="font-medium capitalize">
                  {sub.billingCycle || "monthly"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("subscription.startDate")}</p>
                <p className="font-medium">{formatDate(sub.createdAt)}</p>
              </div>
            </div>

            {isCanceled && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive font-medium">
                  {t("subscription.canceledNotice")}
                </p>
                {sub.cancelReason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("subscription.cancelReason")}: {sub.cancelReason}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("subscription.usage")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <UsageItem
              icon={MapPin}
              label={t("subscription.usageItems.places")}
              used={usage.places ?? 0}
              limit={plan.maxPlaces}
            />
            <UsageItem
              icon={Calendar}
              label={t("subscription.usageItems.bookingsPerMonth")}
              used={usage.bookings ?? 0}
              limit={plan.maxBookingsPerMonth}
            />
            <UsageItem
              icon={Users}
              label={t("subscription.usageItems.staff")}
              used={usage.staff ?? 0}
              limit={plan.maxStaff}
            />
            <UsageItem
              icon={Building2}
              label={t("subscription.usageItems.services")}
              used={usage.services ?? 0}
              limit={plan.maxServices}
            />
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("subscription.invoice.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={invoiceFilters.status}
              onValueChange={(value) =>
                setInvoiceFilters((prev) => ({ ...prev, status: value, page: 1 }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("common.filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="pending">{t(INVOICE_STATUS_KEYS.pending)}</SelectItem>
                <SelectItem value="paid">{t(INVOICE_STATUS_KEYS.paid)}</SelectItem>
                <SelectItem value="overdue">{t(INVOICE_STATUS_KEYS.overdue)}</SelectItem>
                <SelectItem value="canceled">{t(INVOICE_STATUS_KEYS.canceled)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoiceLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
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
                          INVOICE_STATUS_STYLES[invoice.status] || INVOICE_STATUS_STYLES.pending,
                        )}
                      >
                        {t(INVOICE_STATUS_KEYS[invoice.status] || "subscription.invoice.status.pending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {invoice.transactionRef || invoice.id?.slice(0, 8) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {invoicePagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {t("subscription.invoice.pagination", { page: invoicePagination.page, totalPages: invoicePagination.totalPages, total: invoicePagination.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invoiceFilters.page <= 1}
                  onClick={() =>
                    setInvoiceFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={invoiceFilters.page >= invoicePagination.totalPages}
                  onClick={() =>
                    setInvoiceFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  {t("common.nextPage")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planName={plan.name}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
