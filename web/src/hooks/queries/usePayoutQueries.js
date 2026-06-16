import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import payoutService from "@/apis/payoutService";

const STALE_TIME = 2 * 60 * 1000;

// ── Business Hooks ──────────────────────────────────────────────────────────

/**
 * Current earnings balance (available, pending, withdrawn).
 */
export function useEarnings() {
  return useApiQuery(
    queryKeys.earnings.summary(),
    () => payoutService.getEarnings(),
    { staleTime: STALE_TIME }
  );
}

/**
 * Paginated payout history for current business.
 */
export function usePayoutHistory(params = {}) {
  return useApiQuery(
    queryKeys.payouts.list(params),
    () => payoutService.getPayoutHistory(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Create payout request with optimistic balance update.
 */
export function useCreatePayout() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (data) => payoutService.createPayoutRequest(data),
    {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.earnings.summary() });
        const previous = queryClient.getQueryData(queryKeys.earnings.summary());
        queryClient.setQueryData(queryKeys.earnings.summary(), (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              availableBalance: Math.max(
                0,
                (old.data.availableBalance || 0) - (variables.amount || 0)
              ),
              pendingBalance: (old.data.pendingBalance || 0) + (variables.amount || 0),
            },
          };
        });
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(queryKeys.earnings.summary(), context.previous);
        }
      },
      onSettled: () => {
        invalidateQueries(queryClient, [
          queryKeys.earnings.all(),
          queryKeys.payouts.all(),
        ]);
      },
    }
  );
}

/**
 * Cancel a pending payout request.
 */
export function useCancelPayout() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (id) => payoutService.cancelPayoutRequest(id),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.earnings.all(),
          queryKeys.payouts.all(),
        ]);
      },
    }
  );
}

// ── Admin Hooks ─────────────────────────────────────────────────────────────

/**
 * All payouts with filters (admin).
 */
export function useAdminPayouts(params = {}) {
  return useApiQuery(
    queryKeys.payouts.list(params),
    () => payoutService.getAdminPayouts(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Approve or reject a payout (admin).
 */
export function useReviewPayout() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, action, reason }) => payoutService.reviewPayout(id, action, reason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.payouts.all(),
          queryKeys.payouts.stats(),
        ]);
      },
    }
  );
}

/**
 * Payout dashboard stats (admin).
 */
export function usePayoutStats() {
  return useApiQuery(
    queryKeys.payouts.stats(),
    () => payoutService.getPayoutStats(),
    { staleTime: STALE_TIME }
  );
}
