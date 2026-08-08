import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import staffApi from "@/apis/staffApi";

/**
 * Fetch all staff for the current business.
 */
export function useStaff(params = {}) {
  return useApiQuery(queryKeys.staff.list(params), () =>
    staffApi.getAll(params)
  );
}

/**
 * Fetch staff detail by ID.
 */
export function useStaffDetail(id) {
  return useApiQuery(
    queryKeys.staff.detail(id),
    () => staffApi.getById(id),
    { enabled: !!id }
  );
}

/**
 * Fetch aggregated staff stats.
 */
export function useStaffStats() {
  return useApiQuery(queryKeys.staff.stats(), () =>
    staffApi.getStats()
  );
}

/**
 * Create staff mutation.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => staffApi.create(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.staff.all(),
        queryKeys.staff.stats(),
      ]);
    },
  });
}

/**
 * Update staff mutation.
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => staffApi.update(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.staff.all(),
          queryKeys.staff.stats(),
        ]);
      },
    }
  );
}

/**
 * Deactivate staff mutation.
 */
export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => staffApi.deactivate(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.staff.all(),
        queryKeys.staff.stats(),
      ]);
    },
  });
}

/**
 * Activate staff mutation.
 */
export function useActivateStaff() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => staffApi.activate(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [
        queryKeys.staff.all(),
        queryKeys.staff.stats(),
      ]);
    },
  });
}

/**
 * Reset staff password mutation.
 */
export function useResetStaffPassword() {
  return useApiMutation(({ id, newPassword }) =>
    staffApi.resetPassword(id, newPassword)
  );
}
