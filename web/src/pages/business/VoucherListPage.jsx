import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Ticket,
  Plus,
  Search,
  Copy,
  Trash2,
  Power,
  Pencil,
  Calendar,
  Users,
  TrendingUp,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/business/ui/MetricCard";
import { EmptyState } from "@/components/business/ui/EmptyState";
import { BUSINESS_TOKENS } from "@/components/business/tokens";
import { formatVND, formatDate } from "@/components/business/dashboardWidgetHelpers";
import { cn } from "@/lib/utils";
import { getMyPlaces } from "@/apis/businessApi";
import {
  useVouchers,
  useVoucherStats,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  useDuplicateVoucher,
} from "@/hooks/queries";
import { VoucherFormModal } from "@/components/voucher/VoucherFormModal";

const getStatusBadgeMap = (t) => ({
  active: { label: t("business.vouchers.statusBadge.active"), bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  draft: { label: t("business.vouchers.statusBadge.draft"), bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
  scheduled: { label: t("business.vouchers.statusBadge.scheduled"), bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  expired: { label: t("business.vouchers.statusBadge.expired"), bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
});

const resolveVoucherStatus = (voucher) => {
  const now = new Date();
  if (!voucher.isActive) return "draft";
  if (voucher.endDate && new Date(voucher.endDate) < now) return "expired";
  if (voucher.startDate && new Date(voucher.startDate) > now) return "scheduled";
  return "active";
};

export default function VoucherListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [places, setPlaces] = useState([]);

  const { data: vouchersRes, isLoading } = useVouchers({ search, status: statusFilter });
  const { data: statsRes } = useVoucherStats();

  const createMutation = useCreateVoucher();
  const updateMutation = useUpdateVoucher();
  const deleteMutation = useDeleteVoucher();
  const duplicateMutation = useDuplicateVoucher();

  const vouchers = vouchersRes?.data?.data || vouchersRes?.data || [];
  const stats = statsRes?.data?.data || statsRes?.data || {};

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  const handleSave = async (formData) => {
    if (editingVoucher) {
      await updateMutation.mutateAsync({ id: editingVoucher.id, ...formData });
      toast.success(t("business.vouchers.toasts.editSuccess"));
    } else {
      await createMutation.mutateAsync(formData);
      toast.success(t("business.vouchers.toasts.createSuccess"));
    }
  };

  const handleToggleActive = async (voucher) => {
    try {
      await updateMutation.mutateAsync({ id: voucher.id, isActive: !voucher.isActive });
      toast.success(t("business.vouchers.toasts.statusSuccess"));
    } catch (err) {
      toastApiErrorIfNeeded(err, t("business.vouchers.toasts.error"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("business.vouchers.toasts.deleteSuccess"));
    } catch (err) {
      toastApiErrorIfNeeded(err, t("business.vouchers.toasts.error"));
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success(t("business.vouchers.toasts.duplicateSuccess"));
    } catch (err) {
      toastApiErrorIfNeeded(err, t("business.vouchers.toasts.error"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            {t("business.vouchers.title")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">
            {t("business.vouchers.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVoucher(null);
            setModalOpen(true);
          }}
          className="w-full sm:w-auto justify-center gap-2 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          {t("business.vouchers.createBtn")}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={t("business.vouchers.metrics.totalActive")}
          value={stats.activeCount ?? 0}
          icon={Ticket}
          color="emerald"
        />
        <MetricCard
          title={t("business.vouchers.metrics.totalUsed")}
          value={stats.usedCount ?? 0}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title={t("business.vouchers.metrics.totalDiscounted")}
          value={formatVND(stats.totalDiscountAmount ?? 0)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200/80 dark:bg-zinc-950 dark:border-zinc-800">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("business.vouchers.searchPlaceholder")}
            className="pl-9 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <SelectValue placeholder={t("common.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("business.vouchers.status.all")}</SelectItem>
            <SelectItem value="active">{t("business.vouchers.status.active")}</SelectItem>
            <SelectItem value="draft">{t("business.vouchers.status.draft")}</SelectItem>
            <SelectItem value="scheduled">{t("business.vouchers.status.scheduled")}</SelectItem>
            <SelectItem value="expired">{t("business.vouchers.status.expired")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t("business.vouchers.empty.title")}
          description={t("business.vouchers.empty.description")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((vc) => {
            const statusKey = resolveVoucherStatus(vc);
            const badgeMap = getStatusBadgeMap(t);
            const badge = badgeMap[statusKey] || badgeMap.active;

            return (
              <Card key={vc.id} className="bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-zinc-950 dark:text-zinc-100">
                          {vc.code}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", badge.bg, badge.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
                        {vc.name || vc.description || "—"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingVoucher(vc); setModalOpen(true); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(vc.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          {t("business.vouchers.actions.duplicate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(vc)}>
                          <Power className="h-4 w-4 mr-2" />
                          {vc.isActive ? t("business.vouchers.actions.deactivate") : t("business.vouchers.actions.activate")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(vc.id)} className="text-red-600 dark:text-red-400">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {vc.discountType === "percentage" ? `${vc.discountValue}%` : formatVND(vc.discountValue)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span>{t("business.vouchers.used")}: {vc.usedCount ?? 0} / {vc.maxUsage ?? "∞"}</span>
                    <span>{vc.endDate ? formatDate(vc.endDate) : t("business.vouchers.noExpiry")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <VoucherFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        voucher={editingVoucher}
        places={places}
        onSave={handleSave}
      />
    </div>
  );
}
