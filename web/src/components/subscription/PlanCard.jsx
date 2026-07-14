import { Check, Crown, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";

const PLAN_ICONS = {
  basic: Zap,
  plus: Crown,
  pro: Crown,
};

const PLAN_ACCENT = {
  basic: "border-zinc-200",
  plus: "border-blue-300 ring-2 ring-blue-100",
  pro: "border-violet-300 ring-2 ring-violet-100",
};

export default function PlanCard({
  plan,
  isCurrent,
  canChangeBillingCycle = false,
  isPopular,
  billingCycle = "monthly",
  onSelect,
}) {
  const { t } = useTranslation();
  const Icon = PLAN_ICONS[plan.slug] || Zap;
  const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const isAvailableForCycle = billingCycle !== "yearly" || Number.isFinite(plan.priceYearly);
  const accent = PLAN_ACCENT[plan.slug] || PLAN_ACCENT.basic;

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-shadow hover:shadow-lg",
        isCurrent && "ring-2 ring-primary",
        isPopular && !isCurrent && accent,
      )}
    >
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white">
            {t("subscription.plans.popular")}
          </Badge>
        </div>
      )}

      <CardHeader className="items-center space-y-3 pb-0">
        <div
          className={cn(
            "rounded-full p-3",
            plan.slug === "pro"
              ? "bg-violet-100 text-violet-600"
              : plan.slug === "plus"
                ? "bg-blue-100 text-blue-600"
                : "bg-zinc-100 text-zinc-600",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </CardHeader>

      <CardContent className="flex-1 space-y-5 pt-4">
        <div className="text-center">
          <span className="text-3xl font-bold tracking-tight">
            {formatVND(price)}
          </span>
          <span className="text-sm text-muted-foreground">
            /{billingCycle === "yearly" ? t("subscription.plans.yearly") : t("subscription.plans.monthly")}
          </span>
        </div>

        {plan.description && (
          <p className="text-center text-sm text-muted-foreground">
            {plan.description}
          </p>
        )}

        <ul className="space-y-2.5">
          {(plan.features || []).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2">
        {isCurrent && !canChangeBillingCycle ? (
          <Button variant="outline" className="w-full" disabled>
            {t("subscription.plans.current")}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPopular ? "default" : "outline"}
            onClick={() => onSelect?.(plan)}
            disabled={!isAvailableForCycle}
          >
            {isAvailableForCycle ? t("subscription.plans.select") : t("subscription.plans.unavailable")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
