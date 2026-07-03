import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import voucherService from "@/apis/voucherService";

const STALE_5_MIN = 5 * 60 * 1000;
const GC_30_MIN = 30 * 60 * 1000;

/**
 * Fetch all vouchers with filters.
 */
export function useVouchers(params = {}) {
  return useApiQuery(
    queryKeys.vouchers.list(params),
    () => voucherService.getAll(params),
    { placeholderData: (prev) => prev, staleTime: STALE_5_MIN, gcTime: GC_30_MIN }
  );
}

/**
 * Fetch voucher by ID.
 */
export function useVoucherDetail(id) {
  return useApiQuery(
    queryKeys.vouchers.detail(id),
    () => voucherService.getById(id),
    { enabled: !!id, staleTime: STALE_5_MIN }
  );
}

/**
 * Fetch voucher usage stats.
 */
export function useVoucherUsageStats(id) {
  return useApiQuery(
    queryKeys.vouchers.detail(id),
    () => voucherService.getUsageStats(id),
    { enabled: !!id }
  );
}

/**
 * Fetch aggregated voucher stats for dashboard.
 */
export function useVoucherStats() {
  return useApiQuery(
    queryKeys.vouchers.stats(),
    () => voucherService.getVoucherStats(),
    { staleTime: STALE_5_MIN, gcTime: GC_30_MIN }
  );
}

/**
 * Fetch per-voucher analytics (redemption timeline, revenue).
 */
export function useVoucherAnalytics(id) {
  return useApiQuery(
    queryKeys.vouchers.analytics(id),
    () => voucherService.getVoucherAnalytics(id),
    { enabled: !!id, staleTime: STALE_5_MIN }
  );
}

/**
 * Create voucher mutation.
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => voucherService.create(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.vouchers.all(),
        queryKeys.vouchers.stats(),
      ]);
    },
  });
}

/**
 * Update voucher mutation with optimistic update.
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => voucherService.update(id, data),
    {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.vouchers.detail(id) });
        const previous = queryClient.getQueryData(queryKeys.vouchers.detail(id));
        queryClient.setQueryData(queryKeys.vouchers.detail(id), (old) => ({
          ...old,
          data: { ...old?.data, ...data },
        }));
        return { previous };
      },
      onError: (_err, { id }, context) => {
        if (context?.previous) {
          queryClient.setQueryData(queryKeys.vouchers.detail(id), context.previous);
        }
      },
      onSettled: (_data, _error, { id }) => {
        invalidateQueries(queryClient, [
          queryKeys.vouchers.all(),
          queryKeys.vouchers.detail(id),
          queryKeys.vouchers.stats(),
        ]);
      },
    }
  );
}

/**
 * Delete voucher mutation.
 */
export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => voucherService.remove(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.vouchers.all(),
        queryKeys.vouchers.stats(),
      ]);
    },
  });
}

/**
 * Bulk deactivate vouchers mutation.
 */
export function useBulkDeactivateVouchers() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (voucherIds) => voucherService.bulkDeactivate(voucherIds),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.vouchers.all(),
          queryKeys.vouchers.stats(),
        ]);
      },
    }
  );
}

/**
 * Bulk update vouchers mutation.
 */
export function useBulkUpdateVouchers() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ ids, updates }) => voucherService.bulkUpdate(ids, updates),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.vouchers.all(),
          queryKeys.vouchers.stats(),
        ]);
      },
    }
  );
}

/**
 * Duplicate voucher mutation.
 */
export function useDuplicateVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation(
    (id) => voucherService.duplicateVoucher(id),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.vouchers.all(),
          queryKeys.vouchers.stats(),
        ]);
      },
    }
  );
}
