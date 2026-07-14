import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useCurrentSubscription,
  useSubscriptionPlans,
} from "@/hooks/queries/useSubscriptionQueries";
import PlanCard from "@/components/subscription/PlanCard";
import UpgradeModal from "@/components/subscription/UpgradeModal";

export default function PricingPage() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: plansRes, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentRes } = useCurrentSubscription();

  const plans = plansRes?.data?.data || plansRes?.data || [];
  const currentSub = currentRes?.data?.data || currentRes?.data || {};
  const currentPlanSlug = currentSub.status && currentSub.status !== "canceled" ? currentSub.plan?.slug : null;

  const sortedPlans = [...plans].sort(
    (a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0),
  );

  if (plansLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px]" />
          ))}
        </div>
      </div>
    );
  }

  const popularSlug = sortedPlans.length >= 2 ? sortedPlans[1]?.slug : null;

  const allFeatures = [
    ...new Set(sortedPlans.flatMap((p) => p.features || [])),
  ];

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("subscription.plans.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("subscription.plans.subtitle")}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            billingCycle === "monthly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
          onClick={() => setBillingCycle("monthly")}
        >
          {t("subscription.plans.monthly")}
        </button>
        <button
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            billingCycle === "yearly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
          onClick={() => setBillingCycle("yearly")}
        >
          {t("subscription.plans.yearly")}
          <Badge variant="secondary" className="ml-1.5 text-xs">
            -20%
          </Badge>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {sortedPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrent={plan.slug === currentPlanSlug}
            canChangeBillingCycle={
              plan.slug === currentPlanSlug
              && billingCycle !== (currentSub.billingCycle || "monthly")
            }
            isPopular={plan.slug === popularSlug}
            onSelect={setSelectedPlan}
          />
        ))}
      </div>

      {/* Feature comparison */}
      {allFeatures.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-xl font-semibold">{t("subscription.plans.compareFeatures")}</h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">{t("subscription.plans.feature")}</TableHead>
                  {sortedPlans.map((plan) => (
                    <TableHead key={plan.id} className="text-center">
                      {plan.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFeatures.map((feature) => (
                  <TableRow key={feature}>
                    <TableCell className="text-sm">{feature}</TableCell>
                    {sortedPlans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        {(plan.features || []).includes(feature) ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      <UpgradeModal
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
        targetPlan={selectedPlan}
        currentPlan={currentSub.plan}
        billingCycle={billingCycle}
      />
    </div>
  );
}
