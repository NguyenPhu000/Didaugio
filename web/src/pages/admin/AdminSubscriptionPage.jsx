import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowDownRight,
  CreditCard,
  DollarSign,
  RefreshCw,
  Search,
  TrendingDown,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { formatVND, formatDate } from "@/components/business/dashboardWidgetHelpers";
import {
  useAdminSubscriptions,
  useAdminSubscriptionStats,
  useAdminUpdateSubStatus,
} from "@/hooks/queries/useSubscriptionQueries";
import PlanBadge from "@/components/subscription/PlanBadge";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  grace: "bg-amber-50 text-amber-700 border-amber-200",
  past_due: "bg-rose-50 text-rose-700 border-rose-200",
  canceled: "bg-zinc-50 text-zinc-700 border-zinc-200",
  paused: "bg-orange-50 text-orange-700 border-orange-200",
  trialing: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_LABELS = {
  active: "Hoạt động",
  grace: "Gia hạn",
  past_due: "Quá hạn",
  canceled: "Đã hủy",
  paused: "Tạm ngưng",
  trialing: "Dùng thử",
};

function StatCard({ title, value, icon, tone = "default", subtitle }) {
  const Icon = icon;
  const toneMap = {
    in: "bg-emerald-50 text-emerald-600",
    out: "bg-rose-50 text-rose-600",
    info: "bg-blue-50 text-blue-600",
    default: "bg-zinc-100 text-zinc-600",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="truncate text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", toneMap[tone] || toneMap.default)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSubscriptionPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    plan: "all",
    status: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [cancelDialog, setCancelDialog] = useState({ open: false, subId: null });
  const [cancelReason, setCancelReason] = useState("");

  const { data: statsRes, isLoading: statsLoading, refetch: refetchStats } =
    useAdminSubscriptionStats();
  const { data: listRes, isLoading: listLoading, refetch: refetchList } =
    useAdminSubscriptions(filters);
  const updateStatusMutation = useAdminUpdateSubStatus();

  const stats = statsRes?.data?.data || statsRes?.data || {};
  const subscriptions = listRes?.data?.data || listRes?.data || [];
  const pagination = listRes?.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const statCards = useMemo(
    () => [
      {
        title: t("subscription.admin.mrr"),
        value: formatVND(stats.mrr),
        icon: DollarSign,
        tone: "in",
      },
      {
        title: t("subscription.admin.activeSubs"),
        value: stats.activeCount ?? 0,
        icon: Users,
        tone: "info",
      },
      {
        title: t("subscription.admin.churnRate"),
        value: `${(stats.churnRate ?? 0).toFixed(1)}%`,
        icon: TrendingDown,
        tone: "out",
      },
      {
        title: t("subscription.admin.revenue"),
        value: formatVND(stats.totalRevenue),
        icon: CreditCard,
        tone: "default",
      },
    ],
    [stats.mrr, stats.activeCount, stats.churnRate, stats.totalRevenue, t],
  );

  const refresh = () => {
    refetchStats();
    refetchList();
  };

  const handleStatusChange = (id, status) => {
    if (status === "canceled") {
      setCancelDialog({ open: true, subId: id });
      setCancelReason("");
      return;
    }
    updateStatusMutation.mutate({ id, status });
  };

  const handleConfirmCancel = () => {
    updateStatusMutation.mutate(
      { id: cancelDialog.subId, status: "canceled", cancelReason: cancelReason.trim() || undefined },
      { onSuccess: () => setCancelDialog({ open: false, subId: null }) },
    );
  };

  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("subscription.admin.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subscription.admin.title")}
          </p>
        </div>
        <Button variant="outline" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : statCards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                    page: 1,
                  }))
                }
                className="pl-9"
              />
            </div>
            <Select
              value={filters.plan}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, plan: value, page: 1 }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Gói" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value, page: 1 }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Activity className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("common.noData")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doanh nghiệp</TableHead>
                  <TableHead>Gói</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="font-medium">
                        {sub.business?.businessName || sub.businessName || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sub.business?.user?.email || sub.email || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlanBadge planSlug={sub.plan?.slug} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(STATUS_STYLES[sub.status])}
                      >
                        {STATUS_LABELS[sub.status] || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {sub.billingCycle || "monthly"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatVND(sub.amount || sub.plan?.priceMonthly)}
                    </TableCell>
                    <TableCell>{formatDate(sub.currentPeriodEnd)}</TableCell>
                    <TableCell className="text-right">
                      {sub.status !== "canceled" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ...
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {sub.status === "active" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(sub.id, "paused")
                                }
                              >
                                Tạm ngưng
                              </DropdownMenuItem>
                            )}
                            {(sub.status === "paused" ||
                              sub.status === "past_due") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(sub.id, "active")
                                }
                              >
                                Kích hoạt lại
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleStatusChange(sub.id, "canceled")
                              }
                            >
                              Hủy subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Trang {pagination.page} / {pagination.totalPages} ({pagination.total})
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

      {/* Cancel Reason Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => !open && setCancelDialog({ open: false, subId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy subscription</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy subscription. Thông báo sẽ được gửi đến doanh nghiệp.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nhập lý do hủy..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, subId: null })}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
