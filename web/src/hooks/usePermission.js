import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";

/**
 * PERMISSION HOOK
 * Hook to check user permissions using ROLES constants.
 * Supports wildcard "*" for SUPER_ADMIN (from backend Set(["*"])).
 */

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isPermissionsLoading ?? false);

  const permissionSet = useMemo(() => {
    if (!user?.permissions) return new Set();
    return new Set(user.permissions);
  }, [user?.permissions]);

  const isWildcard = useMemo(
    () => user?.roleId === ROLES.SUPER_ADMIN || permissionSet.has("*"),
    [user?.roleId, permissionSet],
  );

  const hasPermission = (permission) => {
    if (!user) return false;
    if (isWildcard) return true;
    return permissionSet.has(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (isWildcard) return true;
    return permissions.some((p) => permissionSet.has(p));
  };

  const hasAllPermissions = (permissions) => {
    if (!user) return false;
    if (isWildcard) return true;
    return permissions.every((p) => permissionSet.has(p));
  };

  const isSuperAdmin = () => user?.roleId === ROLES.SUPER_ADMIN;
  const isAdmin = () => user?.roleId === ROLES.SUPER_ADMIN || user?.roleId === ROLES.ADMIN;
  const isBusiness = () => user?.roleId === ROLES.BUSINESS;
  const isStaff = () => user?.roleId === ROLES.STAFF;

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isBusiness,
    isStaff,
    isLoading,
    user,
  };
}

export default usePermission;
