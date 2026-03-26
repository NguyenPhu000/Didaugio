import { ROLES } from "./constants.js";

// name → level mapping (dùng cho so sánh hierarchy theo tên)
export const ROLE_HIERARCHY = {
  super_admin: 1,
  admin: 2,
  business: 3,
  staff: 4,
  user: 5,
  guest: 6,
};

export function canManageRole(managerRole, targetRole) {
  const managerLevel = ROLE_HIERARCHY[managerRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];

  if (!managerLevel || !targetLevel) return false;

  if (managerRole === "super_admin") {
    return targetRole !== "super_admin";
  }

  if (managerRole === "admin") {
    return targetLevel > ROLE_HIERARCHY.admin;
  }

  return false;
}

export function canManageUser(managerUser, targetUser) {
  if (!managerUser?.role?.name || !targetUser?.role?.name) return false;
  if (managerUser.id === targetUser.id) return false;
  return canManageRole(managerUser.role.name, targetUser.role.name);
}

export function getManagedRoles(roleName) {
  if (roleName === "super_admin") {
    return ["admin", "business", "staff"];
  }
  if (roleName === "admin") {
    return ["business", "staff"];
  }
  return [];
}

export function getManagedRoleIds(roleName) {
  const roles = getManagedRoles(roleName);
  return roles.map((name) => ROLES[name.toUpperCase()]).filter(Boolean);
}
