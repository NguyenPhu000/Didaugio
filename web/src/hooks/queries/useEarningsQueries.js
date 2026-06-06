import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import earningsService from "@/apis/earningsService";

/**
 * Fetch earnings list with filters.
 */
export function useEarnings(params = {}) {
  return useApiQuery(
    queryKeys.earnings.list(params),
    () => earningsService.getEarnings(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch earnings summary.
 */
export function useEarningsSummary() {
  return useApiQuery(queryKeys.earnings.summary(), () =>
    earningsService.getSummary()
  );
}

/**
 * Create payout request mutation.
 */
export function useCreatePayoutRequest() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => earningsService.createPayoutRequest(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.earnings.all(),
        queryKeys.payouts.all(),
      ]);
    },
  });
}
