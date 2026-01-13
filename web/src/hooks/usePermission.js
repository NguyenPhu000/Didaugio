import { useAuthStore } from "@/stores/authStore";

/**
 * PERMISSION HOOK
 * Hook để check permissions của user
 */

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission năme (e.g., "category.create")
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!user) return false;

    // Super Admin (roleId = 1) has all permissions
    if (user.roleId === 1) return true;

    // Check if user has the permission in their permissions array
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    return false;
  };

  /**
   * Check if user has ANY of the given permissions
   * @param {string[]} permissions - Array of permission nămes
   * @returns {boolean}
   */
  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (user.roleId === 1) return true;

    return permissions.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has ALL of the given permissions
   * @param {string[]} permissions - Array of permission nămes
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    if (!user) return false;
    if (user.roleId === 1) return true;

    return permissions.every((permission) => hasPermission(permission));
  };

  /**
   * Check if user is Super Admin
   * @returns {boolean}
   */
  const isSuperAdmin = () => {
    return user?.roleId === 1;
  };

  /**
   * Check if user is Admin (Admin or Super Admin)
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.roleId === 1 || user?.roleId === 2;
  };

  /**
   * Check if user is Business
   * @returns {boolean}
   */
  const isBusiness = () => {
    return user?.roleId === 3;
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
