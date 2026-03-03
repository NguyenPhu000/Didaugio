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

// Số nhỏ hơn = quyền cao hơn
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: { name: "super_admin", level: 1, canManage: [ROLES.ADMIN, ROLES.BUSINESS, ROLES.STAFF, ROLES.USER] },
  [ROLES.ADMIN]: { name: "admin", level: 2, canManage: [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER] },
  [ROLES.BUSINESS]: { name: "business", level: 3, canManage: [] },
  [ROLES.STAFF]: { name: "staff", level: 4, canManage: [] },
  [ROLES.USER]: { name: "user", level: 5, canManage: [] },
  [ROLES.GUEST]: { name: "guest", level: 6, canManage: [] },
};

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
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
};

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
