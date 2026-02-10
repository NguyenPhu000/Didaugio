/**
 * ROUTE CONSTANTS
 * Centralized route path definitions to avoid hardcoded strings
 */

// Auth routes (public)
export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  RESEND_VERIFICATION: "/resend-verification",
};

// Auth routes with /auth prefix (aliases)
export const AUTH_PREFIX_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_VERIFICATION: "/auth/resend-verification",
};

// Admin / Protected routes
export const ADMIN_ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",

  // Management
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  CATEGORIES: "/categories",
  TAGS: "/tags",
  DISTRICTS: "/districts",

  // Places
  MAP: "/admin/map",
  PLACES: "/admin/places",
  PLACES_NEW: "/admin/places/new",
  PLACES_EDIT: (id) => `/admin/places/edit/${id}`,

  // System
  EMAIL_VERIFICATIONS: "/email-verifications",
  PASSWORD_RESETS: "/password-resets",
  AUDIT_LOGS: "/audit-logs",
  LOGIN_HISTORY: "/login-history",
};

// Places alias
export const PLACES_ALIAS = "/places";

// Root redirect target
export const DEFAULT_REDIRECT = ADMIN_ROUTES.DASHBOARD;
