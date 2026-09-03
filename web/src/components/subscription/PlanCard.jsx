import { Check, Crown, Zap, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";

const PLAN_ICONS = {
  basic: Zap,
  plus: Sparkles,
  pro: Crown,
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

  return (
    <Card
      className={cn(
        "relative flex flex-col rounded-3xl border transition-all duration-300 backdrop-blur-xl",
        isPopular
          ? "border-primary/60 bg-card/95 shadow-xl shadow-primary/5 hover:border-primary hover:-translate-y-1"
          : "border-border/80 bg-card/75 hover:border-border hover:bg-card/90 hover:-translate-y-1 hover:shadow-lg",
        isCurrent && "ring-2 ring-primary border-primary",
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground font-extrabold uppercase text-[10px] tracking-wider px-3 py-1 shadow-md border border-primary-foreground/20">
            {t("subscription.plans.popular")}
          </Badge>
        </div>
      )}

      <CardHeader className="items-center space-y-3 pb-2 pt-6">
        <div
          className={cn(
            "rounded-2xl p-3.5 transition-transform group-hover:scale-110",
            isPopular
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border/50",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">{plan.name}</h3>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-2">
        <div className="text-center space-y-1">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              {formatMoney(price)}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground block">
            /{billingCycle === "yearly" ? t("subscription.plans.yearly") : t("subscription.plans.monthly")}
          </span>
        </div>

        {plan.description && (
          <p className="text-center text-xs text-muted-foreground leading-relaxed px-2">
            {plan.description}
          </p>
        )}

        <div className="h-px bg-border/60 w-full" />

        <ul className="space-y-3 px-1">
          {(plan.features || []).map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-snug">
              <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-2 pb-6 px-6">
        {isCurrent && !canChangeBillingCycle ? (
          <Button variant="outline" className="w-full rounded-2xl h-11 font-bold border-border/80" disabled>
            {t("subscription.plans.current")}
          </Button>
        ) : isCurrent && canChangeBillingCycle ? (
          <Button
            className="w-full rounded-2xl h-11 font-bold transition-transform active:scale-[0.98]"
            variant={isPopular ? "default" : "outline"}
            onClick={() => onSelect?.(plan)}
            disabled={!isAvailableForCycle}
          >
            {isAvailableForCycle
              ? t("subscription.plans.changeCycle")
              : t("subscription.plans.unavailable")}
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full rounded-2xl h-11 font-bold transition-transform active:scale-[0.98]",
              isPopular ? "shadow-md shadow-primary/20" : "",
            )}
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
