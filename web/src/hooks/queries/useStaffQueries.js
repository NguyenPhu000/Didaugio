import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import staffApi from "@/apis/staffApi";

/**
 * Fetch all staff for the current business.
 */
export function useStaff(params = {}) {
  return useApiQuery(queryKeys.staff.list(), () =>
    staffApi.getAll(params)
  );
}

/**
 * Fetch staff detail by ID.
 */
export function useStaffDetail(id) {
  return useApiQuery(
    queryKeys.staff.list(), // reuse list key since detail is within list context
    () => staffApi.getById(id),
    { enabled: !!id }
  );
}

/**
 * Create staff mutation.
 */
export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => staffApi.create(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.staff.all()]);
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
        invalidateQueries(queryClient, [queryKeys.staff.all()]);
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
      invalidateQueries(queryClient, [queryKeys.staff.all()]);
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
      invalidateQueries(queryClient, [queryKeys.staff.all()]);
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
