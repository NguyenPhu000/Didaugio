export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
};

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
  STAFF: 4,
  USER: 5,
  GUEST: 6,
};

export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.BUSINESS]: "Business",
  [ROLES.STAFF]: "Staff",
  [ROLES.USER]: "User",
  [ROLES.GUEST]: "Guest",
};

export const BUSINESS_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  TERMINATED: "terminated",
  SUSPICIOUS: "suspicious",
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

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  EXPIRED: "expired",
  NO_SHOW: "no_show",
};

export const PRICE_RANGE = {
  FREE: "FREE",
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  EXPENSIVE: "EXPENSIVE",
  LUXURY: "LUXURY",
};

export const PRICE_RANGE_LABELS = {
  FREE: "Miễn phí",
  BUDGET: "Bình dân",
  MODERATE: "Trung bình",
  EXPENSIVE: "Cao cấp",
  LUXURY: "Sang trọng",
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

export const TAG_TYPES = {
  GENERAL: "general",
  FEATURE: "feature",
  AMENITY: "amenity",
  CUISINE: "cuisine",
  ACTIVITY: "activity",
  ATMOSPHERE: "atmosphere",
};
