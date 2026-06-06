import i18n from "@/i18n";

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
  get FREE() { return i18n.t("explore.search.price.free"); },
  get BUDGET() { return i18n.t("explore.search.price.budget"); },
  get MODERATE() { return i18n.t("explore.search.price.midRange"); },
  get EXPENSIVE() { return i18n.t("explore.search.price.premium"); },
  LUXURY: "Luxury",
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
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
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
