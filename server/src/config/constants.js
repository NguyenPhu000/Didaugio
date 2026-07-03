export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
  PENDING: "pending",
};

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
  STAFF: 4,
  USER: 5,
  GUEST: 6,
};

// Lower number = higher privilege
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: {
    name: "super_admin",
    level: 1,
    canManage: [ROLES.ADMIN, ROLES.BUSINESS, ROLES.STAFF, ROLES.USER],
  },
  [ROLES.ADMIN]: {
    name: "admin",
    level: 2,
    canManage: [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER],
  },
  [ROLES.BUSINESS]: { name: "business", level: 3, canManage: [ROLES.STAFF] },
  [ROLES.STAFF]: { name: "staff", level: 4, canManage: [] },
  [ROLES.USER]: { name: "user", level: 5, canManage: [] },
  [ROLES.GUEST]: { name: "guest", level: 6, canManage: [] },
};

export const ADMIN_ROLE_IDS = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
export const BACK_OFFICE_ROLE_IDS = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
]);
export const BUSINESS_PORTAL_ROLE_IDS = new Set([ROLES.BUSINESS, ROLES.STAFF]);

export function isSuperAdminRole(roleId) {
  return Number(roleId) === ROLES.SUPER_ADMIN;
}

export function isAdminRole(roleId) {
  return Number(roleId) === ROLES.ADMIN;
}

export function isAdminOrSuperAdminRole(roleId) {
  return ADMIN_ROLE_IDS.has(Number(roleId));
}

export function isBackOfficeRole(roleId) {
  return BACK_OFFICE_ROLE_IDS.has(Number(roleId));
}

export function isBusinessScopedRole(roleId) {
  return BUSINESS_PORTAL_ROLE_IDS.has(Number(roleId));
}

export function canManageRoleId(managerRoleId, targetRoleId) {
  const manager = ROLE_HIERARCHY[Number(managerRoleId)];
  const targetId = Number(targetRoleId);

  if (!manager || !ROLE_HIERARCHY[targetId]) return false;
  if (Number(managerRoleId) === targetId) return false;
  if (isSuperAdminRole(managerRoleId)) {
    return targetId !== ROLES.SUPER_ADMIN;
  }

  return manager.canManage.includes(targetId);
}

export function canAssignRoleId(managerRoleId, targetRoleId) {
  const manager = ROLE_HIERARCHY[Number(managerRoleId)];
  const targetId = Number(targetRoleId);

  if (!manager || !ROLE_HIERARCHY[targetId]) return false;
  if (isSuperAdminRole(managerRoleId)) {
    return targetId !== ROLES.SUPER_ADMIN;
  }

  return manager.canManage.includes(targetId);
}

export function getRoleLevel(roleId) {
  return ROLE_HIERARCHY[Number(roleId)]?.level || 999;
}

export function canEditRolePermissions(managerRoleId, targetRoleId) {
  const targetId = Number(targetRoleId);
  if (targetId === ROLES.SUPER_ADMIN) return false;
  if (isSuperAdminRole(managerRoleId)) return true;
  return canManageRoleId(managerRoleId, targetId);
}

// Helper: name-based role comparison
export function canManageRole(managerRoleName, targetRoleName) {
  const managerEntry = Object.values(ROLE_HIERARCHY).find(
    (r) => r.name === managerRoleName,
  );
  const targetEntry = Object.values(ROLE_HIERARCHY).find(
    (r) => r.name === targetRoleName,
  );
  if (!managerEntry || !targetEntry) return false;
  if (managerRoleName === "super_admin") return targetRoleName !== "super_admin";
  if (managerRoleName === "admin") return targetEntry.level > managerEntry.level;
  if (managerRoleName === "business") return managerEntry.canManage.includes(ROLES[targetRoleName.toUpperCase()]);
  return false;
}

// Helper: user-object-based management check
export function canManageUser(managerUser, targetUser) {
  if (!managerUser?.role?.name || !targetUser?.role?.name) return false;
  if (managerUser.id === targetUser.id) return false;
  return canManageRole(managerUser.role.name, targetUser.role.name);
}

// Helper: get managed role names
export function getManagedRoles(roleName) {
  if (roleName === "super_admin") return ["admin", "business", "staff", "user"];
  if (roleName === "admin") return ["business", "staff", "user"];
  if (roleName === "business") return ["staff"];
  return [];
}

// Helper: get managed role IDs
export function getManagedRoleIds(roleName) {
  const roles = getManagedRoles(roleName);
  return roles.map((name) => ROLES[name.toUpperCase()]).filter(Boolean);
}


export const BOOKING_STATUS = {
  PENDING: "pending",
  PAID_PENDING_CONFIRM: "paid_pending_confirm",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  EXPIRED: "expired",
  NO_SHOW: "no_show",
};

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  PARTIALLY_REFUNDED: "partially_refunded",
  FULLY_REFUNDED: "fully_refunded",
};

export const BUSINESS_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  TERMINATED: "terminated",
  SUSPICIOUS: "suspicious",
};

/** Phiên bản hợp đồng hiện tại — bump để buộc ký lại */
export const CURRENT_CONTRACT_VERSION = "v1";

export const SERVICE_TYPES = {
  ENTRY_TICKET: "entry_ticket",
  TOUR: "tour",
  PACKAGE: "package",
  SERVICE: "service",
  EXPERIENCE: "experience",
};

export const PLACE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  HIDDEN: "hidden",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 500,
};

export const CATEGORY_LEVELS = {
  ROOT: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
};

export const MAX_CATEGORY_LEVEL = 3;

export const TAG_TYPES = {
  GENERAL: "general",
  FEATURE: "feature",
  AMENITY: "amenity",
  CUISINE: "cuisine",
  ACTIVITY: "activity",
  ATMOSPHERE: "atmosphere",
};

export const PRICE_RANGE = {
  FREE: "FREE",
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  EXPENSIVE: "EXPENSIVE",
  LUXURY: "LUXURY",
};

export const DAY_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const DAY_OF_WEEK_NAMES = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

export const PLACE_IMAGE_LIMITS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
};
