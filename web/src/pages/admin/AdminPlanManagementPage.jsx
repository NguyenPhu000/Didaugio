import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Edit,
  Loader2,
  RefreshCw,
  Users,
  MapPin,
  CalendarDays,
  UserCheck,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import {
  useAdminPlans,
  useAdminUpdatePlan,
} from "@/hooks/queries/useSubscriptionQueries";
import PlanBadge from "@/components/subscription/PlanBadge";

const planSchema = z.object({
  name: z.string().min(1, "Tên gói là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0, "Giá phải >= 0"),
  priceYearly: z.coerce.number().min(0, "Giá phải >= 0"),
  maxPlaces: z.coerce.number().min(-1, "-1 = không giới hạn").optional(),
  maxBookings: z.coerce.number().min(-1, "-1 = không giới hạn").optional(),
  maxStaff: z.coerce.number().min(0).optional(),
  features: z.string().optional(),
  sortOrder: z.coerce.number().min(0).optional(),
});

const DEFAULT_VALUES = {
  name: "",
  slug: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  maxPlaces: 0,
  maxBookings: 0,
  maxStaff: 0,
  features: "",
  sortOrder: 0,
};

function toFormValues(plan) {
  if (!plan) return DEFAULT_VALUES;
  const features = Array.isArray(plan.features)
    ? plan.features.join("\n")
    : typeof plan.features === "string"
      ? plan.features
      : "";
  return {
    name: plan.name || "",
    slug: plan.slug || "",
    description: plan.description || "",
    priceMonthly: plan.priceMonthly || 0,
    priceYearly: plan.priceYearly || 0,
    maxPlaces: plan.maxPlaces ?? 0,
    maxBookings: plan.maxBookings ?? 0,
    maxStaff: plan.maxStaff ?? 0,
    features,
    sortOrder: plan.sortOrder ?? 0,
  };
}

function calcYearlySavings(monthly, yearly) {
  if (!monthly || !yearly) return 0;
  const yearlyIfMonthly = monthly * 12;
  return Math.round(((yearlyIfMonthly - yearly) / yearlyIfMonthly) * 100);
}

function LimitBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{value === -1 ? "∞" : value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function PlanFormDialog({ open, onOpenChange, plan, onSubmit, isLoading }) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const priceMonthly = watch("priceMonthly");
  const priceYearly = watch("priceYearly");
  const savings = calcYearlySavings(priceMonthly, priceYearly);

  useEffect(() => {
    if (open && plan) {
      reset(toFormValues(plan));
    } else if (!open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, plan, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      features: data.features
        ? data.features.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlanBadge planSlug={plan?.slug} />
            Chỉnh sửa gói {plan?.name}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin và giới hạn gói dịch vụ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tên gói *</Label>
              <Input {...register("name")} placeholder="Plus" />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input {...register("slug")} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea {...register("description")} rows={2} placeholder="Mô tả ngắn về gói dịch vụ" />
          </div>

          <div className="space-y-3">
            <Label>Giá dịch vụ</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Giá / tháng (VND)</Label>
                <Input type="number" {...register("priceMonthly")} />
                {errors.priceMonthly && (
                  <p className="text-xs text-destructive">{errors.priceMonthly.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Giá / năm (VND)</Label>
                <Input type="number" {...register("priceYearly")} />
                {savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Tiết kiệm {savings}% khi thanh toán theo năm
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Giới hạn sử dụng</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Địa điểm tối đa</Label>
                <Input type="number" {...register("maxPlaces")} />
                <p className="text-[10px] text-muted-foreground">-1 = không giới hạn</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Booking / tháng</Label>
                <Input type="number" {...register("maxBookings")} />
                <p className="text-[10px] text-muted-foreground">-1 = không giới hạn</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nhân viên tối đa</Label>
                <Input type="number" {...register("maxStaff")} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Thứ tự hiển thị</Label>
              <Input type="number" {...register("sortOrder")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tính năng (mỗi dòng một tính năng)</Label>
            <Textarea
              {...register("features")}
              rows={4}
              placeholder={"Quản lý 5 địa điểm\nHỗ trợ ưu tiên\nBáo cáo nâng cao"}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({ plan, onEdit, onToggleActive }) {
  const savings = calcYearlySavings(plan.priceMonthly, plan.priceYearly);
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${!plan.isActive ? "opacity-60" : ""}`}>
      {!plan.isActive && (
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Tạm ẩn
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <PlanBadge planSlug={plan.slug} />
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono">{plan.slug}</p>
          </div>
        </div>
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">{formatVND(plan.priceMonthly)}</span>
            <span className="text-xs text-muted-foreground">/ tháng</span>
          </div>
          {plan.priceYearly > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {formatVND(plan.priceYearly)} / năm
              </span>
              {savings > 0 && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">
                  -{savings}%
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Limits */}
        <div className="flex flex-wrap gap-2">
          <LimitBadge icon={MapPin} value={plan.maxPlaces} label="địa điểm" />
          <LimitBadge icon={CalendarDays} value={plan.maxBookings} label="booking" />
          <LimitBadge icon={UserCheck} value={plan.maxStaff} label="NV" />
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Tính năng</p>
            <div className="space-y-1">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats & Actions */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{plan._count?.subscriptions || 0} subscriber</span>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={plan.isActive}
              onCheckedChange={(checked) => onToggleActive(plan.id, checked)}
              className="h-5 w-9"
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPlanManagementPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const { data: plansRes, isLoading, refetch } = useAdminPlans();
  const updateMutation = useAdminUpdatePlan();

  const plans = plansRes?.data?.data || plansRes?.data || [];

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleToggleActive = (planId, isActive) => {
    updateMutation.mutate({ id: planId, data: { isActive } });
  };

  const handleSubmit = (data) => {
    if (editingPlan) {
      updateMutation.mutate(
        { id: editingPlan.id, data },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý gói dịch vụ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉnh sửa thông tin, giới hạn và trạng thái các gói subscription
          </p>
        </div>
        <Button variant="outline" onClick={refetch} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
