// MAP: SubscriptionPage
// ├── UI: @/components/subscription/{CurrentPlanCard, SubscriptionInvoicesCard, CancelSubscriptionDialog, GracePeriodBanner}
// └── API: @/hooks/queries/useSubscriptionQueries

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import {
  useCancelScheduledDowngrade,
  useCancelSubscription,
  useCurrentSubscription,
  useSubscriptionInvoices,
} from "@/hooks/queries/useSubscriptionQueries";
import GracePeriodBanner from "@/components/subscription/GracePeriodBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PricingPage from "./PricingPage";

// Extracted Sub-Components
import CancelSubscriptionDialog from "@/components/subscription/CancelSubscriptionDialog";
import CurrentPlanCard from "@/components/subscription/CurrentPlanCard";
import SubscriptionInvoicesCard from "@/components/subscription/SubscriptionInvoicesCard";

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCurrentSubscription();
  const [invoiceFilters, setInvoiceFilters] = useState({
    status: "all",
    page: 1,
    limit: 10,
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: invoiceData, isLoading: invoiceLoading } =
    useSubscriptionInvoices(invoiceFilters);
  const cancelMutation = useCancelSubscription();
  const cancelDowngradeMutation = useCancelScheduledDowngrade();

  const sub = data?.data?.data || data?.data || {};
  const plan = sub.plan || {};
  const usage = sub.usage || {};
  const scheduledDowngrade = sub.metadata?.scheduledDowngrade;

  const invoices = invoiceData?.data?.data || invoiceData?.data || [];
  const invoicePagination = invoiceData?.data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const handleCancel = (reason) => {
    cancelMutation.mutate(reason, {
      onSuccess: () => setCancelDialogOpen(false),
    });
  };

  const handleCancelDowngrade = () => {
    cancelDowngradeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  const isCanceled = sub.status === "canceled";

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("subscription.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
          {t("subscription.description")}
        </p>
      </div>

      <Tabs defaultValue="plans" className="w-full space-y-6">
        <TabsList className="bg-white dark:bg-card p-1 rounded-2xl border border-slate-200/80 dark:border-border/80 shadow-sm flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger
            value="plans"
            className="flex-1 sm:flex-initial rounded-xl px-5 py-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground cursor-pointer"
          >
            {t("subscription.tabPlans")}
          </TabsTrigger>
          <TabsTrigger
            value="current"
            className="flex-1 sm:flex-initial rounded-xl px-5 py-2 text-xs font-bold uppercase transition-all data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground cursor-pointer"
          >
            {t("subscription.tabCurrent")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="focus-visible:ring-0">
          <PricingPage />
        </TabsContent>

        <TabsContent value="current" className="space-y-6 focus-visible:ring-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t("subscription.currentPlan")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                {t("subscription.currentPlanDesc")}
              </p>
            </div>
            {!isCanceled && (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto justify-center rounded-xl text-xs font-bold text-destructive hover:text-destructive border-destructive/30 cursor-pointer"
                onClick={() => setCancelDialogOpen(true)}
              >
                {t("subscription.cancel.cancelPlan")}
              </Button>
            )}
          </div>

          <GracePeriodBanner subscription={sub} />

          {scheduledDowngrade && !isCanceled && (
            <div className="p-5 rounded-3xl border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="font-bold text-sm text-sky-950 dark:text-sky-200">
                  {t("subscription.pendingDowngrade.title", {
                    plan:
                      scheduledDowngrade.targetPlanName ||
                      scheduledDowngrade.targetPlanSlug,
                  })}
                </p>
                <p className="text-xs text-sky-800 dark:text-sky-300/80 mt-0.5">
                  {t("subscription.pendingDowngrade.description", {
                    date: formatDate(scheduledDowngrade.effectiveAt),
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-sky-300 bg-white text-sky-800 hover:bg-sky-100 dark:bg-sky-900/50 dark:text-sky-200 text-xs font-bold shrink-0 cursor-pointer"
                onClick={handleCancelDowngrade}
                disabled={cancelDowngradeMutation.isPending}
              >
                {cancelDowngradeMutation.isPending && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {t("subscription.pendingDowngrade.cancel")}
              </Button>
            </div>
          )}

          {/* ── Top Bento: Plan Info + Resource Usage ── */}
          <CurrentPlanCard
            plan={plan}
            sub={sub}
            usage={usage}
            isCanceled={isCanceled}
          />

          {/* ── Invoice History Table ── */}
          <SubscriptionInvoicesCard
            invoiceFilters={invoiceFilters}
            setInvoiceFilters={setInvoiceFilters}
            invoiceLoading={invoiceLoading}
            invoices={invoices}
            invoicePagination={invoicePagination}
          />
        </TabsContent>
      </Tabs>

      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        planName={plan.name}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
