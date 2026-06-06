import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import voucherService from "@/apis/voucherService";

/**
 * Fetch all vouchers with filters.
 */
export function useVouchers(params = {}) {
  return useApiQuery(
    queryKeys.vouchers.list(params),
    () => voucherService.getAll(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch voucher by ID.
 */
export function useVoucherDetail(id) {
  return useApiQuery(
    queryKeys.vouchers.detail(id),
    () => voucherService.getById(id),
    { enabled: !!id }
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
 * Create voucher mutation.
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => voucherService.create(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.vouchers.all()]);
    },
  });
}

/**
 * Update voucher mutation.
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => voucherService.update(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.vouchers.all(),
          queryKeys.vouchers.detail(variables.id),
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
      invalidateQueries(queryClient, [queryKeys.vouchers.all()]);
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
        invalidateQueries(queryClient, [queryKeys.vouchers.all()]);
      },
    }
  );
}
