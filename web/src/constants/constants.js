// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
};

// Roles
export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  BUSINESS: 3,
  STAFF: 4,
  GUEST: 5,
};

export const ROLE_NAMES = {
  1: "Super Admin",
  2: "Admin",
  3: "Business Owner",
  4: "Staff",
  5: "Guest",
};

// Place Status
export const PLACE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  HIDDEN: "hidden",
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

// Price Range
export const PRICE_RANGE = {
  CHEAP: "cheap",
  MEDIUM: "medium",
  EXPENSIVE: "expensive",
};

export const PRICE_RANGE_LABELS = {
  cheap: "Bình dân",
  medium: "Trung bình",
  expensive: "Sang trọng",
};

// Days of week
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

// Place Image Limits
export const PLACE_IMAGE_LIMITS = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Tag Types
export const TAG_TYPES = {
  GENERAL: "general",
  FEATURE: "feature",
  AMENITY: "amenity",
  CUISINE: "cuisine",
  ACTIVITY: "activity",
  ATMOSPHERE: "atmosphere",
};

// Toast durations
export const TOAST_DURATION = 3000;
