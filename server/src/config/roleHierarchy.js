/**
 * Role Hierarchy & Management Rules
 * Định nghĩa cấp bậc vai trò và quyền quản lý
 */

export const ROLE_HIERARCHY = {
  super_admin: 1,
  admin: 2,
  business: 3,
  staff: 4,
  guest: 5,
};

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
  STAFF: 4,
  GUEST: 5,
};

/**
 * Kiểm tra xem role A có quyền quản lý role B không
 * @param {string} managerRole - Role của người quản lý
 * @param {string} targetRole - Role của người được quản lý
 * @returns {boolean}
 */
export function canManageRole(managerRole, targetRole) {
  const managerLevel = ROLE_HIERARCHY[managerRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];

  // Không tồn tại role
  if (!managerLevel || !targetLevel) return false;

  // Super Admin quản lý được tất cả trừ Super Admin khác
  if (managerRole === "super_admin") {
    return targetRole !== "super_admin";
  }

  // Admin quản lý được Business và Staff (không quản lý Super Admin và Admin khác)
  if (managerRole === "admin") {
    return targetLevel > 2; // Chỉ business(3) và staff(4)
  }

  // Business và Staff không được quản lý ai
  return false;
}

/**
 * Kiểm tra xem user A có quyền quản lý user B không
 * @param {Object} managerUser - User object của người quản lý (có role relation)
 * @param {Object} targetUser - User object của người được quản lý (có role relation)
 * @returns {boolean}
 */
export function canManageUser(managerUser, targetUser) {
  if (!managerUser?.role?.name || !targetUser?.role?.name) return false;

  // Không được tự quản lý chính mình
  if (managerUser.id === targetUser.id) return false;

  return canManageRole(managerUser.role.name, targetUser.role.name);
}

/**
 * Lấy danh sách roles mà một role có thể quản lý
 * @param {string} roleName - Tên role
 * @returns {string[]} - Mảng tên các role có thể quản lý
 */
export function getManagedRoles(roleName) {
  if (roleName === "super_admin") {
    return ["admin", "business", "staff"];
  }
  if (roleName === "admin") {
    return ["business", "staff"];
  }
  return [];
}

/**
 * Lấy role IDs mà một role có thể quản lý
 * @param {string} roleName - Tên role
 * @returns {number[]} - Mảng IDs
 */
export function getManagedRoleIds(roleName) {
  const roles = getManagedRoles(roleName);
  return roles.map((name) => ROLE_IDS[name.toUpperCase()]).filter(Boolean);
}
