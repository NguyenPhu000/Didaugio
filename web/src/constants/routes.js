export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  RESEND_VERIFICATION: "/resend-verification",
};

export const AUTH_PREFIX_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_VERIFICATION: "/auth/resend-verification",
};

export const ADMIN_ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",

  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  CATEGORIES: "/categories",
  TAGS: "/tags",
  DISTRICTS: "/districts",

  MAP: "/admin/map",
  PLACES: "/admin/places",
  PLACES_PENDING: "/admin/places/pending",
  PLACES_NEW: "/admin/places/new",
  PLACES_EDIT: (id) => `/admin/places/edit/${id}`,

  BUSINESS_LIST: "/admin/business",
  BUSINESS_PENDING: "/admin/business/pending",

  EMAIL_VERIFICATIONS: "/email-verifications",
  PASSWORD_RESETS: "/password-resets",
  AUDIT_LOGS: "/audit-logs",
  LOGIN_HISTORY: "/login-history",
};

export const BUSINESS_ROUTES = {
  DASHBOARD: "/business/dashboard",
  PROFILE: "/business/profile",
  /** Deep link: mục Hợp đồng trong Hồ sơ (một bản ghi Business, không còn /business/contracts) */
  PROFILE_CONTRACT: "/business/profile?section=contract",
  REGISTER: "/business/register",
  SERVICES: "/business/services",
  BOOKINGS: "/business/bookings",
  BOOKING_SCHEDULE: "/business/bookings/schedule",
  BOOKING_QUICK: "/business/bookings/quick",
  BOOKING_DETAIL: (id) => `/business/bookings/${id}`,
  VOUCHERS: "/business/vouchers",
  REVENUE: "/business/revenue",
  REVIEWS: "/business/reviews",
};

export const PLACES_ALIAS = "/places";

export const DEFAULT_REDIRECT = ADMIN_ROUTES.DASHBOARD;
