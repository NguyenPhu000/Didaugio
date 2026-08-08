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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import {
  useAdminPlans,
  useAdminUpdatePlan,
} from "@/hooks/queries/useSubscriptionQueries";
import PlanBadge from "@/components/subscription/PlanBadge";

function LimitBadge({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-medium">{value === -1 ? "∞" : value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function buildPlanSchema(t) {
  return z.object({
    name: z.string().min(1, t("subscription.admin.validation.nameRequired")),
    slug: z.string().min(1, t("subscription.admin.validation.slugRequired")),
    description: z.string().optional(),
    priceMonthly: z.coerce.number().min(0, t("subscription.admin.validation.priceNonNegative")),
    priceYearly: z.coerce.number().min(0, t("subscription.admin.validation.priceNonNegative")),
    maxPlaces: z.coerce
      .number()
      .min(-1, t("subscription.admin.validation.minOneUnlimited"))
      .optional(),
    maxBookings: z.coerce
      .number()
      .min(-1, t("subscription.admin.validation.minOneUnlimited"))
      .optional(),
    maxStaff: z.coerce.number().min(0).optional(),
    features: z.string().optional(),
    sortOrder: z.coerce.number().min(0).optional(),
  });
}

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

function PlanFormDialog({ open, onOpenChange, plan, onSubmit, isLoading }) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildPlanSchema(t)),
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
            {t("subscription.admin.form.title", { name: plan?.name || "" })}
          </DialogTitle>
          <DialogDescription>
            {t("subscription.admin.form.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("subscription.admin.form.nameLabel")}</Label>
              <Input {...register("name")} placeholder={t("subscription.admin.form.namePlaceholder")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("subscription.admin.form.slugLabel")}</Label>
              <Input {...register("slug")} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("subscription.admin.form.descriptionLabel")}</Label>
            <Textarea
              {...register("description")}
              rows={2}
              placeholder={t("subscription.admin.form.descriptionPlaceholder")}
            />
          </div>

          <div className="space-y-3">
            <Label>{t("subscription.admin.form.pricingLabel")}</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("subscription.admin.form.monthlyLabel")}
                </Label>
                <Input type="number" {...register("priceMonthly")} />
                {errors.priceMonthly && (
                  <p className="text-xs text-destructive">{errors.priceMonthly.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("subscription.admin.form.yearlyLabel")}
                </Label>
                <Input type="number" {...register("priceYearly")} />
                {savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium">
                    {t("subscription.admin.form.yearlySavings", { percent: savings })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("subscription.admin.form.limitsLabel")}</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("subscription.admin.form.placesFieldLabel")}
                </Label>
                <Input type="number" {...register("maxPlaces")} />
                <p className="text-[10px] text-muted-foreground">
                  {t("subscription.admin.form.unlimitedHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("subscription.admin.form.bookingsFieldLabel")}
                </Label>
                <Input type="number" {...register("maxBookings")} />
                <p className="text-[10px] text-muted-foreground">
                  {t("subscription.admin.form.unlimitedHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("subscription.admin.form.staffFieldLabel")}
                </Label>
                <Input type="number" {...register("maxStaff")} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("subscription.admin.form.sortOrderLabel")}</Label>
              <Input type="number" {...register("sortOrder")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("subscription.admin.form.featuresLabel")}</Label>
            <Textarea
              {...register("features")}
              rows={4}
              placeholder={t("subscription.admin.form.featuresPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t("subscription.admin.form.submitting") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({ plan, onEdit, onToggleActive }) {
  const { t } = useTranslation();
  const savings = calcYearlySavings(plan.priceMonthly, plan.priceYearly);
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md ${!plan.isActive ? "opacity-60" : ""}`}>
      {!plan.isActive && (
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {t("subscription.admin.card.hidden")}
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
            <span className="text-xs text-muted-foreground">{t("subscription.admin.card.perMonth")}</span>
          </div>
          {plan.priceYearly > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {formatVND(plan.priceYearly)} {t("subscription.admin.card.perYear")}
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
          <LimitBadge icon={MapPin} value={plan.maxPlaces} label={t("subscription.admin.card.placesLabel")} />
          <LimitBadge icon={CalendarDays} value={plan.maxBookings} label={t("subscription.admin.card.bookingsLabel")} />
          <LimitBadge icon={UserCheck} value={plan.maxStaff} label={t("subscription.admin.card.staffLabel")} />
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("subscription.admin.card.featuresLabel")}</p>
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
            <span>{t("subscription.admin.card.subscribers", { count: plan._count?.subscriptions || 0 })}</span>
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
