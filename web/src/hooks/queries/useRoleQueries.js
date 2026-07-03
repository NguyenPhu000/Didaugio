import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import { roleService } from "@/apis/roleService";

/**
 * Fetch all roles.
 */
export function useRoles(params = {}) {
  return useApiQuery(queryKeys.roles.list(), () =>
    roleService.getRoles(params)
  );
}

/**
 * Fetch role by ID.
 */
export function useRoleDetail(id) {
  return useApiQuery(
    queryKeys.roles.detail(id),
    () => roleService.getRoleById(id),
    { enabled: !!id }
  );
}

/**
 * Fetch role permissions.
 */
export function useRolePermissions(roleId) {
  return useApiQuery(
    queryKeys.roles.detail(roleId),
    () => roleService.getRolePermissions(roleId),
    { enabled: !!roleId }
  );
}

/**
 * Fetch role users.
 */
export function useRoleUsers(roleId, params = {}) {
  return useApiQuery(
    queryKeys.roles.detail(roleId),
    () => roleService.getRoleUsers(roleId, params),
    { enabled: !!roleId }
  );
}

/**
 * Update role permissions mutation.
 */
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ roleId, permissionIds }) =>
      roleService.updateRolePermissions(roleId, permissionIds),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.roles.all(),
          queryKeys.roles.detail(variables.roleId),
        ]);
      },
    }
  );
}
