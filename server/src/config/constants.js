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

// Hierarchy: Số nhỏ hơn = quyền cao hơn
// Super Admin (1) > Admin (2) > Business (3) > Staff (4) >  USER(5) > Guest (6)
export const ROLE_HIERARCHY = {
  1: { name: "super_admin", level: 1, canManage: [2, 3, 4, 5] }, // Quản lý được tất cả trừ Super Admin
  2: { name: "admin", level: 2, canManage: [3, 4, 5] }, // Quản lý được Business, Staff, Guest
  3: { name: "business", level: 3, canManage: [] }, // Không quản lý ai
  4: { name: "staff", level: 4, canManage: [] }, // Không quản lý ai
  5: { name: "user", level: 5, canManage: [] }, // Không quản lý ai
  6: { name: "guest", level: 6, canManage: [] }, // Không quản lý ai
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

export const PLACE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  HIDDEN: "hidden",
};

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  DUPLICATE_ERROR: "DUPLICATE_ERROR",
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 500,
};

// Category levels
export const CATEGORY_LEVELS = {
  ROOT: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
};

export const MAX_CATEGORY_LEVEL = 3;

// Tag types
export const TAG_TYPES = {
  GENERAL: "general",
  FEATURE: "feature",
  AMENITY: "amenity",
  CUISINE: "cuisine",
  ACTIVITY: "activity",
  ATMOSPHERE: "atmosphere",
};

// Price range
export const PRICE_RANGE = {
  FREE: "FREE",
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  EXPENSIVE: "EXPENSIVE",
  LUXURY: "LUXURY",
};

// Days of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
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

// Place image limits
export const PLACE_IMAGE_LIMITS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};
