import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation } from "./useApiMutation";
import { permissionService } from "@/apis/permissionService";

/**
 * Fetch all permissions.
 */
export function usePermissions() {
  return useApiQuery(queryKeys.permissions.list(), () =>
    permissionService.getPermissions()
  );
}

/**
 * Fetch permission by ID.
 */
export function usePermissionDetail(id) {
  return useApiQuery(
    queryKeys.permissions.list(),
    () => permissionService.getPermissionById(id),
    { enabled: !!id }
  );
}

/**
 * Create permission mutation.
 */
export function useCreatePermission() {
  return useApiMutation((data) => permissionService.createPermission(data));
}

/**
 * Update permission mutation.
 */
export function useUpdatePermission() {
  return useApiMutation(({ id, data }) =>
    permissionService.updatePermission(id, data)
  );
}

/**
 * Delete permission mutation.
 */
export function useDeletePermission() {
  return useApiMutation((id) => permissionService.deletePermission(id));
}
