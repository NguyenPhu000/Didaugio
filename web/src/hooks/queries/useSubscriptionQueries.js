import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import subscriptionService from "@/apis/subscriptionService";

const STALE_TIME = 60 * 1000;

// ── Queries ─────────────────────────────────────────────────────────

export function useCurrentSubscription() {
  return useApiQuery(
    queryKeys.subscriptions.current(),
    () => subscriptionService.getCurrentSubscription(),
    { staleTime: STALE_TIME },
  );
}

export function useSubscriptionPlans() {
  return useApiQuery(
    queryKeys.subscriptions.plans(),
    () => subscriptionService.getPlans(),
    { staleTime: 5 * 60 * 1000 },
  );
}

export function useProration(targetPlanId, billingCycle = "monthly") {
  return useApiQuery(
    queryKeys.subscriptions.proration(targetPlanId, billingCycle),
    () => subscriptionService.getProration(targetPlanId, billingCycle),
    { enabled: !!targetPlanId, staleTime: 30 * 1000 },
  );
}

export function useSubscriptionInvoices(params = {}) {
  return useApiQuery(
    queryKeys.subscriptions.invoices(params),
    () => subscriptionService.getInvoices(params),
    { placeholderData: (prev) => prev },
  );
}

export function useAdminSubscriptions(params = {}) {
  return useApiQuery(
    queryKeys.subscriptions.adminList(params),
    () => subscriptionService.getAdminSubscriptions(params),
    { placeholderData: (prev) => prev },
  );
}

export function useAdminSubscriptionStats() {
  return useApiQuery(
    queryKeys.subscriptions.adminStats(),
    () => subscriptionService.getAdminStats(),
    { staleTime: STALE_TIME },
  );
}

export function useAdminPlans() {
  return useApiQuery(
    queryKeys.subscriptions.adminPlans(),
    () => subscriptionService.getAdminPlans(),
    { staleTime: 5 * 60 * 1000 },
  );
}

// ── Mutations ───────────────────────────────────────────────────────

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    ({ targetPlanId, billingCycle }) =>
      subscriptionService.upgrade(targetPlanId, billingCycle),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
          queryKeys.subscriptions.invoices(),
        ]);
        toast.success(t("subscription.toast.upgradeScheduled"));
      },
    },
  );
}

export function useDowngradeSubscription() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    (targetPlanId) => subscriptionService.downgrade(targetPlanId),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
          queryKeys.subscriptions.invoices(),
        ]);
        toast.success(t("subscription.toast.downgradeScheduled"));
      },
    },
  );
}

export function useCancelScheduledDowngrade() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    () => subscriptionService.cancelScheduledDowngrade(),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
        ]);
        toast.success(t("subscription.toast.downgradeCanceled"));
      },
    },
  );
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    (reason) => subscriptionService.cancelSubscription(reason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
        ]);
        toast.success(t("subscription.toast.subscriptionCanceled"));
      },
    },
  );
}

export function usePayInvoiceFromWallet() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    (invoiceId) => subscriptionService.payInvoiceFromWallet(invoiceId),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
          queryKeys.subscriptions.invoices(),
        ]);
        toast.success(t("subscription.toast.invoicePaidFromWallet"));
      },
    },
  );
}

export function useAdminCreatePlan() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    (data) => subscriptionService.createAdminPlan(data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminPlans(),
          queryKeys.subscriptions.plans(),
        ]);
        toast.success(t("subscription.toast.adminPlanCreated"));
      },
    },
  );
}

export function useAdminUpdatePlan() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    ({ id, data }) => subscriptionService.updateAdminPlan(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminPlans(),
          queryKeys.subscriptions.plans(),
        ]);
        toast.success(t("subscription.toast.adminPlanUpdated"));
      },
    },
  );
}

export function useAdminUpdateSubStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useApiMutation(
    ({ id, status, cancelReason }) =>
      subscriptionService.updateAdminSubStatus(id, status, cancelReason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminList(),
          queryKeys.subscriptions.adminStats(),
        ]);
        toast.success(t("subscription.toast.adminSubStatusUpdated"));
      },
    },
  );
}
