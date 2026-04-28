import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";

/**
 * PERMISSION HOOK
 * Hook to check user permissions using ROLES constants
 */

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name (e.g., "category.create")
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!user) return false;

    if (user.roleId === ROLES.SUPER_ADMIN) return true;

    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  };

  /**
   * Check if user has ANY of the given permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean}
   */
  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (user.roleId === ROLES.SUPER_ADMIN) return true;

    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has ALL of the given permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    if (!user) return false;
    if (user.roleId === ROLES.SUPER_ADMIN) return true;

    return permissions.every((permission) => hasPermission(permission));
  };

  /**
   * Check if user is Super Admin
   * @returns {boolean}
   */
  const isSuperAdmin = () => {
    return user?.roleId === ROLES.SUPER_ADMIN;
  };

  /**
   * Check if user is Admin (Admin or Super Admin)
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.roleId === ROLES.SUPER_ADMIN || user?.roleId === ROLES.ADMIN;
  };

  /**
   * Check if user is Business
   * @returns {boolean}
   */
  const isBusiness = () => {
    return user?.roleId === ROLES.BUSINESS;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isBusiness,
    user,
  };
}

export default usePermission;
