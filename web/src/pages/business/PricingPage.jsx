import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, ShieldCheck, Zap, TrendingUp, HelpCircle } from "lucide-react";
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
      <div className="space-y-8 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="space-y-3 text-center max-w-xl mx-auto">
          <Skeleton className="h-10 w-3/4 mx-auto rounded-2xl" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-xl" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64 rounded-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[480px] rounded-3xl" />
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
    <main className="space-y-12 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto overflow-x-hidden">
      {/* Header with Wide Cinematic Typography */}
      <div className="animate-fade-down text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase shadow-sm">
          <Zap className="w-3.5 h-3.5" />
          Gói Dịch Vụ Đối Tác Doanh Nghiệp
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          {t("subscription.plans.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {t("subscription.plans.subtitle")}
        </p>
      </div>

      {/* Billing Cycle Switcher */}
      <div className="animate-fade-up [animation-delay:100ms] flex items-center justify-center">
        <div className="p-1 rounded-full bg-muted/80 border border-border flex items-center shadow-inner">
          <button
            type="button"
            className={cn(
              "rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300",
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            {t("subscription.plans.monthly")}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2",
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setBillingCycle("yearly")}
          >
            <span>{t("subscription.plans.yearly")}</span>
            <Badge variant="outline" className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground text-[10px] uppercase font-extrabold">
              {t("subscription.plans.yearlyDiscount")}
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="animate-fade-up [animation-delay:200ms] grid gap-6 md:grid-cols-3 items-stretch">
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

      {/* ROI & Merchant Trust Value Prop (AIDA Desire & Trust) */}
      <div className="animate-fade-up [animation-delay:250ms] grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto pt-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Tối Ưu Lượng Khách AI
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thuật toán tự động xếp quán ăn, khách sạn của bạn vào lộ trình tour thông minh của du khách Cần Thơ.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Không Ràng Buộc Dài Hạn
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dễ dàng nâng cấp, hạ gói hoặc hủy gia hạn bất kỳ lúc nào ngay trên trang quản trị đối tác.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            Hỗ Trợ Kỹ Thuật 24/7
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Đội ngũ tư vấn thiết lập thực đơn, chụp ảnh và tối ưu hiển thị GPS địa điểm hoàn toàn miễn phí.
          </p>
        </div>
      </div>

      {/* Feature Comparison Table */}
      {allFeatures.length > 0 && (
        <div className="animate-fade-up [animation-delay:300ms] mx-auto max-w-5xl pt-8 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t("subscription.plans.compareFeatures")}
            </h2>
            <p className="text-xs text-muted-foreground">
              Chi tiết đặc quyền giữa các gói dịch vụ
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[300px] font-bold text-foreground py-4">
                    {t("subscription.plans.feature")}
                  </TableHead>
                  {sortedPlans.map((plan) => (
                    <TableHead key={plan.id} className="text-center font-bold text-foreground py-4">
                      {plan.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFeatures.map((feature) => (
                  <TableRow key={feature} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell className="text-sm font-medium text-foreground/90 py-3.5">
                      {feature}
                    </TableCell>
                    {sortedPlans.map((plan) => (
                      <TableCell key={plan.id} className="text-center py-3.5">
                        {(plan.features || []).includes(feature) ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground/40">
                            <X className="h-3.5 w-3.5" />
                          </div>
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

      {/* Upgrade Modal */}
      <UpgradeModal
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
        targetPlan={selectedPlan}
        currentPlan={currentSub.plan}
        billingCycle={billingCycle}
      />
    </main>
  );
}
