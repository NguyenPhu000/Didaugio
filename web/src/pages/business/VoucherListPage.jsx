import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Power,
  Calendar,
  TrendingUp,
  Users,
  X,
  CheckSquare,
  Square,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/business/ui/MetricCard";
import { EmptyState } from "@/components/business/ui/EmptyState";
import { StatusBadge } from "@/components/business/ui/StatusBadge";
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
  useBulkDeactivateVouchers,
  useBulkUpdateVouchers,
  useDuplicateVoucher,
} from "@/hooks/queries";
import { createVoucherSchema } from "@/schemas/voucher";

// ─── Constants (functions of t) ───────────────────────────────────────────────

const getStatusOptions = (t) => [
  { value: "all", label: t("business.vouchers.status.all") },
  { value: "active", label: t("business.vouchers.status.active") },
  { value: "draft", label: t("business.vouchers.status.draft") },
  { value: "scheduled", label: t("business.vouchers.status.scheduled") },
  { value: "expired", label: t("business.vouchers.status.expired") },
];

const getDiscountTypeOptions = (t) => [
  { value: "percentage", label: t("business.vouchers.discountTypes.percentage") },
  { value: "fixed", label: t("business.vouchers.discountTypes.fixed") },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveVoucherStatus = (voucher) => {
  const now = new Date();
  if (!voucher.isActive) return "draft";
  if (voucher.endDate && new Date(voucher.endDate) < now) return "expired";
  if (voucher.startDate && new Date(voucher.startDate) > now) return "scheduled";
  return "active";
};

const getStatusBadgeMap = (t) => ({
  active: { label: t("business.vouchers.statusBadge.active"), bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  draft: { label: t("business.vouchers.statusBadge.draft"), bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
  scheduled: { label: t("business.vouchers.statusBadge.scheduled"), bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  expired: { label: t("business.vouchers.statusBadge.expired"), bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
});

const getFormDefaults = (voucher) => ({
  code: voucher?.code || "",
  name: voucher?.name || "",
  description: voucher?.description || "",
  discountType: voucher?.discountType || "percentage",
  discountValue: voucher?.discountValue ?? "",
  minOrderValue: voucher?.minOrderValue ?? "",
  maxDiscount: voucher?.maxDiscount ?? "",
  maxUsage: voucher?.maxUsage ?? 100,
  maxUsagePerUser: voucher?.maxUsagePerUser ?? 1,
  appliesToPlaceId:
    voucher?.applicableServices?.placeIds?.[0] != null
      ? String(voucher.applicableServices.placeIds[0])
      : "all",
  startDate: voucher?.startDate ? String(voucher.startDate).split("T")[0] : "",
  endDate: voucher?.endDate ? String(voucher.endDate).split("T")[0] : "",
  isActive: voucher?.isActive ?? true,
});

const discountPreview = (type, value) => {
  const num = Number(value);
  if (!num || num <= 0) return "—";
  return type === "percentage" ? `${num}%` : formatVND(num);
};

// ─── Voucher Form Modal ──────────────────────────────────────────────────────

const VoucherFormModal = ({ open, voucher, places = [], onSave, onClose }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => getFormDefaults(voucher));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(getFormDefaults(voucher));
    setErrors({});
  }, [open, voucher]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const parsed = createVoucherSchema.safeParse({
      ...form,
      discountValue: Number(form.discountValue) || 0,
      minOrderValue: Number(form.minOrderValue) || 0,
      maxDiscountAmount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: Number(form.maxUsage) || undefined,
      applicablePlaceIds:
        form.appliesToPlaceId !== "all"
          ? [Number(form.appliesToPlaceId)]
          : undefined,
    });

    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUsage: Number(form.maxUsage),
        maxUsagePerUser: Number(form.maxUsagePerUser),
        applicableServices:
          form.appliesToPlaceId !== "all"
            ? { placeIds: [Number(form.appliesToPlaceId)] }
            : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      await onSave(data);
      onClose();
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.error"));
    } finally {
      setSaving(false);
    }
  };

  const preview = discountPreview(form.discountType, form.discountValue);
  const discountTypeOptions = getDiscountTypeOptions(t);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className={cn(BUSINESS_TOKENS.iconBox("violet"))}>
              <Ticket className="h-4 w-4" />
            </div>
            {voucher ? t("business.vouchers.form.editTitle") : t("business.vouchers.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {voucher ? t("business.vouchers.form.editSubtitle") : t("business.vouchers.form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="voucher-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-6 py-2 pr-1"
        >
          {/* ── Section: Basic Info ── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 text-zinc-400" />
              {t("business.vouchers.form.basicInfo")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vc-code">
                  {t("business.vouchers.form.voucherCode")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vc-code"
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                  required
                  disabled={!!voucher}
                  className={cn("uppercase", errors.code && "border-destructive")}
                  placeholder="VD: SUMMER2026"
                />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-name">{t("business.vouchers.form.voucherName")}</Label>
                <Input
                  id="vc-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder={t("business.vouchers.form.namePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vc-desc">{t("business.vouchers.form.description")}</Label>
              <Textarea
                id="vc-desc"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={2}
                placeholder={t("business.vouchers.form.descriptionPlaceholder")}
                className={cn(errors.description && "border-destructive")}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
          </fieldset>

          {/* ── Section: Discount ── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
              {t("business.vouchers.form.discountSection")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("business.vouchers.form.discountType")}</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => updateField("discountType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {discountTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-val">
                  {t("business.vouchers.form.discountValue")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vc-val"
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => updateField("discountValue", e.target.value)}
                  min="0"
                  required
                  className={cn(errors.discountValue && "border-destructive")}
                />
                {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("business.vouchers.form.preview")}</Label>
                <div className="flex h-9 items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 text-sm font-semibold text-emerald-600 dark:bg-zinc-900 dark:border-zinc-700 dark:text-emerald-400">
                  -{preview}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Section: Limits ── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              {t("business.vouchers.form.limitsSection")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vc-min">{t("business.vouchers.form.minOrder")}</Label>
                <Input
                  id="vc-min"
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => updateField("minOrderValue", e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-maxd">{t("business.vouchers.form.maxDiscount")}</Label>
                <Input
                  id="vc-maxd"
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => updateField("maxDiscount", e.target.value)}
                  min="0"
                  placeholder={t("business.vouchers.form.maxDiscountPlaceholder")}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vc-maxu">{t("business.vouchers.form.maxUsage")}</Label>
                <Input
                  id="vc-maxu"
                  type="number"
                  value={form.maxUsage}
                  onChange={(e) => updateField("maxUsage", e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-peruser">{t("business.vouchers.form.maxPerUser")}</Label>
                <Input
                  id="vc-peruser"
                  type="number"
                  value={form.maxUsagePerUser}
                  onChange={(e) => updateField("maxUsagePerUser", e.target.value)}
                  min="1"
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Schedule & Places ── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              {t("business.vouchers.form.scheduleSection")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vc-start">{t("business.vouchers.form.startDate")}</Label>
                <Input
                  id="vc-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className={cn(errors.startDate && "border-destructive")}
                />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vc-end">{t("business.vouchers.form.endDate")}</Label>
                <Input
                  id="vc-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className={cn(errors.endDate && "border-destructive")}
                />
                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("business.vouchers.form.applyToPlace")}</Label>
              <Select
                value={form.appliesToPlaceId}
                onValueChange={(v) => updateField("appliesToPlaceId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("business.vouchers.form.allPlaces")}</SelectItem>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          {/* ── Active toggle ── */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="vc-active"
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", !!checked)}
            />
            <Label htmlFor="vc-active" className="cursor-pointer text-sm">
              {t("business.vouchers.form.activateImmediately")}
            </Label>
          </div>
        </form>

        <DialogFooter className="shrink-0 gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t("business.vouchers.form.cancel")}
          </Button>
          <Button type="submit" form="voucher-form" disabled={saving}>
            {saving ? t("business.vouchers.form.saving") : voucher ? t("business.vouchers.form.update") : t("business.vouchers.form.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Voucher Card ────────────────────────────────────────────────────────────

const VoucherCard = memo(({
  voucher,
  places,
  selected,
  onSelect,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}) => {
  const { t } = useTranslation();
  const status = resolveVoucherStatus(voucher);
  const usagePct = voucher.maxUsage > 0 ? (voucher.usageCount / voucher.maxUsage) * 100 : 0;
  const statusConfig = getStatusBadgeMap(t)[status];

  const discountLabel =
    voucher.discountType === "percentage"
      ? `${voucher.discountValue}%`
      : formatVND(voucher.discountValue);

  const placeNames =
    Array.isArray(voucher?.applicableServices?.placeIds) &&
    voucher.applicableServices.placeIds.length > 0
      ? voucher.applicableServices.placeIds
          .map((id) => places.find((p) => p.id === id)?.name || `#${id}`)
          .join(", ")
      : t("business.vouchers.filters.allPlaces");

  return (
    <Card className={cn(BUSINESS_TOKENS.card, "transition-shadow hover:shadow-md")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(voucher.id)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top row: code + badges + actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold tracking-wider text-sm text-zinc-950 dark:text-zinc-100">
                    {voucher.code}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50"
                  >
                    -{discountLabel}
                  </Badge>
                  {statusConfig && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusConfig.bg,
                        statusConfig.text,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                      {statusConfig.label}
                    </span>
                  )}
                </div>
                {voucher.name && (
                  <p className="text-xs text-muted-foreground truncate">{voucher.name}</p>
                )}
              </div>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(voucher)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {t("business.vouchers.actions.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(voucher.id)}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    {t("business.vouchers.actions.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(voucher)}>
                    <Power className="mr-2 h-3.5 w-3.5" />
                    {voucher.isActive ? t("business.vouchers.actions.pause") : t("business.vouchers.actions.activate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(voucher)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    {t("business.vouchers.actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Usage progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t("business.vouchers.card.usedLabel", { used: voucher.usageCount || 0, max: voucher.maxUsage })}
                </span>
                <span className={cn("font-medium", usagePct > 80 ? "text-rose-500" : "text-emerald-500")}>
                  {usagePct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    usagePct > 80 ? "bg-rose-500" : usagePct > 50 ? "bg-amber-500" : "bg-emerald-500",
                  )}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
            </div>

            {/* Footer: place + date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Eye className="h-3 w-3 shrink-0" />
                {placeNames}
              </span>
              {voucher.startDate && voucher.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(voucher.startDate)} — {formatDate(voucher.endDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
VoucherCard.displayName = "VoucherCard";

// ─── Voucher Card Skeleton ───────────────────────────────────────────────────

const VoucherCardSkeleton = memo(() => (
  <Card className={BUSINESS_TOKENS.card}>
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-4 w-4 rounded mt-1" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));
VoucherCardSkeleton.displayName = "VoucherCardSkeleton";

// ─── Confirm Delete Modal ────────────────────────────────────────────────────

const ConfirmDeleteModal = ({ open, voucher, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t("business.vouchers.deleteModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("business.vouchers.deleteModal.description", { code: voucher?.code })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>{t("business.vouchers.deleteModal.cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t("business.vouchers.deleteModal.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Bulk Action Bar ─────────────────────────────────────────────────────────

const BulkActionBar = memo(({ count, onDeactivate, onClearSelection }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-3 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-sm">
        <CheckSquare className="h-4 w-4 text-violet-600" />
        <span className="font-medium">{t("business.vouchers.bulkBar.selected", { count })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDeactivate} className="gap-1.5">
          <Power className="h-3.5 w-3.5" />
          {t("business.vouchers.bulkBar.pause")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
          {t("business.vouchers.bulkBar.clearSelection")}
        </Button>
      </div>
    </div>
  );
});
BulkActionBar.displayName = "BulkActionBar";

// ─── Main Page ───────────────────────────────────────────────────────────────

const VoucherListPage = () => {
  const { t } = useTranslation();

  // ── Filters state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── UI state ──
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState(null);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Data ──
  const [places, setPlaces] = useState([]);
  const queryParams = useMemo(() => ({ search, page: 1, limit: 50 }), [search]);
  const { data: vouchersResponse, isLoading } = useVouchers(queryParams);
  const { data: statsResponse } = useVoucherStats();
  const vouchers = vouchersResponse?.data || [];
  const stats = statsResponse?.data || {};

  // ── Mutations ──
  const createMutation = useCreateVoucher();
  const updateMutation = useUpdateVoucher();
  const deleteMutation = useDeleteVoucher();
  const bulkDeactivateMutation = useBulkDeactivateVouchers();
  const bulkUpdateMutation = useBulkUpdateVouchers();
  const duplicateMutation = useDuplicateVoucher();

  // ── Load places ──
  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  // ── Derived: filtered vouchers ──
  const filteredVouchers = useMemo(() => {
    let result = vouchers;

    if (statusFilter !== "all") {
      result = result.filter((v) => resolveVoucherStatus(v) === statusFilter);
    }

    if (placeFilter !== "all") {
      result = result.filter((v) => {
        const placeIds = v?.applicableServices?.placeIds || [];
        if (!Array.isArray(placeIds) || placeIds.length === 0) return true;
        return placeIds.includes(Number(placeFilter));
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((v) => v.endDate && new Date(v.endDate) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      result = result.filter((v) => v.startDate && new Date(v.startDate) <= to);
    }

    return result;
  }, [vouchers, statusFilter, placeFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter !== "all" || placeFilter !== "all" || dateFrom || dateTo;

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setPlaceFilter("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  // ── Handlers ──
  const handleCreate = useCallback(async (data) => {
    await createMutation.mutateAsync(data);
    toast.success(t("business.vouchers.toasts.createSuccess"));
  }, [createMutation, t]);

  const handleUpdate = useCallback(async (data) => {
    if (!editVoucher) return;
    await updateMutation.mutateAsync({ id: editVoucher.id, data });
    toast.success(t("business.vouchers.toasts.updateSuccess"));
    setEditVoucher(null);
  }, [updateMutation, editVoucher, t]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(t("business.vouchers.toasts.deleteSuccess"));
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.deleteFailed"));
    }
    setDeleteTarget(null);
  }, [deleteMutation, deleteTarget, t]);

  const handleDuplicate = useCallback(async (id) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success(t("business.vouchers.toasts.duplicateSuccess"));
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.duplicateFailed"));
    }
  }, [duplicateMutation, t]);

  const handleToggleActive = useCallback(async (voucher) => {
    try {
      await updateMutation.mutateAsync({
        id: voucher.id,
        data: { isActive: !voucher.isActive },
      });
      toast.success(voucher.isActive ? t("business.vouchers.toasts.paused") : t("business.vouchers.toasts.activated"));
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.statusChangeFailed"));
    }
  }, [updateMutation, t]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selected.length === 0) return;
    try {
      await bulkDeactivateMutation.mutateAsync(selected);
      toast.success(t("business.vouchers.toasts.bulkPaused", { count: selected.length }));
      setSelected([]);
    } catch (error) {
      toastApiErrorIfNeeded(error, t("business.vouchers.toasts.bulkPauseFailed"));
    }
  }, [bulkDeactivateMutation, selected, t]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const clearSelection = useCallback(() => setSelected([]), []);

  const openCreate = useCallback(() => {
    setEditVoucher(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((v) => {
    setEditVoucher(v);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditVoucher(null);
  }, []);

  const statusOptions = getStatusOptions(t);

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8 min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            {t("business.vouchers.page.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("business.vouchers.page.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {t("business.vouchers.createBtn")}
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title={t("business.vouchers.stats.active")}
          value={stats.activeCount ?? filteredVouchers.filter((v) => resolveVoucherStatus(v) === "active").length}
          icon={Ticket}
          loading={isLoading}
        />
        <MetricCard
          title={t("business.vouchers.stats.usage")}
          value={stats.totalRedeemed ?? filteredVouchers.reduce((sum, v) => sum + (v.usageCount || 0), 0)}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title={t("business.vouchers.stats.revenueImpact")}
          value={stats.revenueImpact ? formatVND(stats.revenueImpact) : formatVND(0)}
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          title={t("business.vouchers.stats.budgetUsed")}
          value={stats.budgetUsed ? formatVND(stats.budgetUsed) : formatVND(0)}
          icon={Calendar}
          loading={isLoading}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className={cn(BUSINESS_TOKENS.filterBar)}>
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("business.vouchers.filters.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className="gap-1.5 shrink-0"
          >
            <Filter className="h-3.5 w-3.5" />
            {t("business.vouchers.filters.filter")}
            {hasActiveFilters && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-violet-500" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Expanded Filters ── */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3 rounded-xl border border-zinc-200/80 bg-white p-4 dark:bg-zinc-950 dark:border-zinc-800">
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs">{t("business.vouchers.filters.status")}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs">{t("business.vouchers.filters.place")}</Label>
            <Select value={placeFilter} onValueChange={setPlaceFilter}>
              <SelectTrigger className="h-9 w-full sm:w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("business.vouchers.filters.allPlaces")}</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs">{t("business.vouchers.filters.fromDate")}</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-full sm:w-40 text-sm"
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs">{t("business.vouchers.filters.toDate")}</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-full sm:w-40 text-sm"
            />
          </div>
          {hasActiveFilters && (
            <div className="col-span-2 sm:col-span-1 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9">
                <X className="h-3.5 w-3.5" />
                {t("business.vouchers.filters.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Actions ── */}
      {selected.length > 0 && (
        <BulkActionBar
          count={selected.length}
          onDeactivate={handleBulkDeactivate}
          onClearSelection={clearSelection}
        />
      )}

      {/* ── Voucher List ── */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <VoucherCardSkeleton key={i} />)
        ) : filteredVouchers.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={hasActiveFilters ? t("business.vouchers.empty.noMatchTitle") : t("business.vouchers.empty.noVouchersTitle")}
            description={
              hasActiveFilters
                ? t("business.vouchers.empty.noMatchDesc")
                : t("business.vouchers.empty.noVouchersDesc")
            }
            actionLabel={hasActiveFilters ? t("business.vouchers.empty.noMatchAction") : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
            variant="default"
          />
        ) : (
          filteredVouchers.map((v) => (
            <VoucherCard
              key={v.id}
              voucher={v}
              places={places}
              selected={selected.includes(v.id)}
              onSelect={toggleSelect}
              onEdit={openEdit}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </div>

      {/* ── Modals ── */}
      <VoucherFormModal
        open={showForm}
        voucher={editVoucher}
        places={places}
        onSave={editVoucher ? handleUpdate : handleCreate}
        onClose={closeForm}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        voucher={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default VoucherListPage;
