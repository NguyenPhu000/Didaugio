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
    <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-down text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("subscription.plans.title")}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          {t("subscription.plans.subtitle")}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="animate-fade-up [animation-delay:100ms] flex items-center justify-center gap-3">
        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center shadow-inner">
          <button
            className={cn(
              "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-300",
              billingCycle === "monthly"
                ? "bg-emerald-500 text-slate-950 shadow-md scale-105"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            {t("subscription.plans.monthly")}
          </button>
          <button
            className={cn(
              "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5",
              billingCycle === "yearly"
                ? "bg-emerald-500 text-slate-950 shadow-md scale-105"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
            )}
            onClick={() => setBillingCycle("yearly")}
          >
            {t("subscription.plans.yearly")}
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold">
              {t("subscription.plans.yearlyDiscount")}
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="animate-fade-up [animation-delay:200ms] grid gap-6 md:grid-cols-3">
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
        <div className="animate-fade-up [animation-delay:300ms] mx-auto max-w-5xl pt-6">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t("subscription.plans.compareFeatures")}</h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <TableHead className="w-[280px] font-bold text-slate-900 dark:text-white">{t("subscription.plans.feature")}</TableHead>
                  {sortedPlans.map((plan) => (
                    <TableHead key={plan.id} className="text-center font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFeatures.map((feature) => (
                  <TableRow key={feature} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</TableCell>
                    {sortedPlans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        {(plan.features || []).includes(feature) ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
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
