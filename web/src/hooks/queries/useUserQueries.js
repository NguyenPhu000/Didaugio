import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import { userService } from "@/apis/userService";

/**
 * Fetch all users with filters.
 */
export function useUsers(params = {}) {
  return useApiQuery(
    queryKeys.user.list(params),
    () => userService.getAll(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch user by ID.
 */
export function useUserDetail(id) {
  return useApiQuery(
    queryKeys.user.detail(id),
    () => userService.getById(id),
    { enabled: !!id }
  );
}

/**
 * Update user mutation.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => userService.update(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.user.all(),
          queryKeys.user.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Delete user mutation.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => userService.delete(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.user.all()]);
    },
  });
}
