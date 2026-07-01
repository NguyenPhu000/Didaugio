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

  const entitlements = useMemo(
    () =>
      user?.subscription?.entitlements ||
      user?.business?.subscription?.entitlements ||
      user?.entitlements ||
      null,
    [user?.subscription, user?.business, user?.entitlements],
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
  const hasFeature = (featureKey, sourceEntitlements = entitlements) => {
    if (isWildcard) return true;
    if (!sourceEntitlements?.usable) return false;
    return Boolean(sourceEntitlements.featureMap?.[featureKey]);
  };
  const canUseLimit = (
    limitKey,
    currentCount = 0,
    sourceEntitlements = entitlements,
  ) => {
    if (isWildcard) return true;
    if (!sourceEntitlements?.usable) return false;
    const limit = sourceEntitlements.limits?.[limitKey];
    return typeof limit !== "number" || limit < 0 || currentCount < limit;
  };
  const canAssignRole = (roleId) => {
    const targetRoleId = Number(roleId);
    if (user?.roleId === ROLES.SUPER_ADMIN) return targetRoleId !== ROLES.SUPER_ADMIN;
    if (user?.roleId === ROLES.ADMIN) {
      return [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER].includes(targetRoleId);
    }
    if (user?.roleId === ROLES.BUSINESS) return targetRoleId === ROLES.STAFF;
    return false;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasFeature,
    canUseLimit,
    canAssignRole,
    isSuperAdmin,
    isAdmin,
    isBusiness,
    isStaff,
    entitlements,
    isLoading,
    user,
  };
}

export default usePermission;
