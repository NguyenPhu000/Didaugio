import { useQueryClient } from "@tanstack/react-query";
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

export function useProration(targetPlanId) {
  return useApiQuery(
    queryKeys.subscriptions.proration(targetPlanId),
    () => subscriptionService.getProration(targetPlanId),
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

  return useApiMutation(
    (targetPlanId) => subscriptionService.upgrade(targetPlanId),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
          queryKeys.subscriptions.invoices(),
        ]);
      },
    },
  );
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (reason) => subscriptionService.cancelSubscription(reason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.current(),
        ]);
        toast.success("Hủy gói dịch vụ thành công");
      },
    },
  );
}

export function useAdminCreatePlan() {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data) => subscriptionService.createAdminPlan(data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminPlans(),
          queryKeys.subscriptions.plans(),
        ]);
        toast.success("Tạo gói thành công");
      },
    },
  );
}

export function useAdminUpdatePlan() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }) => subscriptionService.updateAdminPlan(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminPlans(),
          queryKeys.subscriptions.plans(),
        ]);
        toast.success("Cập nhật gói thành công");
      },
    },
  );
}

export function useAdminUpdateSubStatus() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, status, cancelReason }) =>
      subscriptionService.updateAdminSubStatus(id, status, cancelReason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.subscriptions.adminList(),
          queryKeys.subscriptions.adminStats(),
        ]);
        toast.success("Cập nhật trạng thái thành công");
      },
    },
  );
}
