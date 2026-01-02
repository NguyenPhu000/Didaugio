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
  GUEST: 5,
};

// Hierarchy: Số nhỏ hơn = quyền cao hơn
// Super Admin (1) > Admin (2) > Business (3) > Staff (4) > Guest (5)
export const ROLE_HIERARCHY = {
  1: { name: "super_admin", level: 1, canManage: [2, 3, 4, 5] }, // Quản lý được tất cả trừ Super Admin
  2: { name: "admin", level: 2, canManage: [3, 4, 5] },          // Quản lý được Business, Staff, Guest
  3: { name: "business", level: 3, canManage: [] },              // Không quản lý ai
  4: { name: "staff", level: 4, canManage: [] },                 // Không quản lý ai
  5: { name: "guest", level: 5, canManage: [] },                 // Không quản lý ai
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
  MAX_LIMIT: 100,
};
