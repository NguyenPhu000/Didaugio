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
  const permissions = user?.permissions;
  const currentRoleId = user?.roleId;

  const permissionSet = useMemo(() => {
    if (!permissions) return new Set();
    return new Set(permissions);
  }, [permissions]);

  const isWildcard = useMemo(
    () => currentRoleId === ROLES.SUPER_ADMIN || permissionSet.has("*"),
    [currentRoleId, permissionSet],
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

  const isSuperAdmin = () => currentRoleId === ROLES.SUPER_ADMIN;
  const isAdmin = () => currentRoleId === ROLES.SUPER_ADMIN || currentRoleId === ROLES.ADMIN;
  const isBusiness = () => currentRoleId === ROLES.BUSINESS;
  const isStaff = () => currentRoleId === ROLES.STAFF;
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
    if (currentRoleId === ROLES.SUPER_ADMIN) return targetRoleId !== ROLES.SUPER_ADMIN;
    if (currentRoleId === ROLES.ADMIN) {
      return [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER].includes(targetRoleId);
    }
    if (currentRoleId === ROLES.BUSINESS) return targetRoleId === ROLES.STAFF;
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
