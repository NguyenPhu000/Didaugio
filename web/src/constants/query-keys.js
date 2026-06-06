/**
 * Centralized query key factory for TanStack Query.
 * Follows the same pattern as the mobile app's query-keys.js.
 *
 * Usage:
 *   useQuery({ queryKey: queryKeys.places.list(params), ... })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.places.all() })
 */
export const queryKeys = {
  auth: {
    all: () => ["auth"],
    me: () => ["auth", "me"],
  },

  user: {
    all: () => ["user"],
    list: (params) => ["user", "list", params],
    detail: (id) => ["user", "detail", id],
    profile: () => ["user", "profile"],
  },

  business: {
    all: () => ["business"],
    list: (params) => ["business", "list", params],
    detail: (id) => ["business", "detail", id],
    profile: () => ["business", "profile"],
    dashboard: () => ["business", "dashboard"],
  },

  places: {
    all: () => ["places"],
    list: (params) => ["places", "list", params],
    detail: (id) => ["places", "detail", id],
    bySlug: (slug) => ["places", "slug", slug],
    featured: () => ["places", "featured"],
    nearby: (coords) => ["places", "nearby", coords],
    pending: () => ["places", "pending"],
  },

  categories: {
    all: () => ["categories"],
    list: () => ["categories", "list"],
    tree: () => ["categories", "tree"],
    detail: (id) => ["categories", "detail", id],
  },

  tags: {
    all: () => ["tags"],
    list: () => ["tags", "list"],
    popular: () => ["tags", "popular"],
    detail: (id) => ["tags", "detail", id],
  },

  districts: {
    all: () => ["districts"],
    list: () => ["districts", "list"],
    detail: (id) => ["districts", "detail", id],
  },

  wards: {
    all: () => ["wards"],
    list: (districtId) => ["wards", "list", districtId],
  },

  bookings: {
    all: () => ["bookings"],
    list: (params) => ["bookings", "list", params],
    detail: (id) => ["bookings", "detail", id],
    stats: (params) => ["bookings", "stats", params],
  },

  reviews: {
    all: () => ["reviews"],
    list: (params) => ["reviews", "list", params],
    detail: (id) => ["reviews", "detail", id],
  },

  vouchers: {
    all: () => ["vouchers"],
    list: (params) => ["vouchers", "list", params],
    detail: (id) => ["vouchers", "detail", id],
  },

  staff: {
    all: () => ["staff"],
    list: () => ["staff", "list"],
    invitations: () => ["staff", "invitations"],
  },

  earnings: {
    all: () => ["earnings"],
    list: (params) => ["earnings", "list", params],
    summary: () => ["earnings", "summary"],
  },

  payouts: {
    all: () => ["payouts"],
    list: (params) => ["payouts", "list", params],
    detail: (id) => ["payouts", "detail", id],
  },

  notifications: {
    all: () => ["notifications"],
    list: (params) => ["notifications", "list", params],
    unreadCount: () => ["notifications", "unread-count"],
  },

  roles: {
    all: () => ["roles"],
    list: () => ["roles", "list"],
    detail: (id) => ["roles", "detail", id],
  },

  permissions: {
    all: () => ["permissions"],
    list: () => ["permissions", "list"],
  },

  auditLogs: {
    all: () => ["audit-logs"],
    list: (params) => ["audit-logs", "list", params],
  },

  loginHistory: {
    all: () => ["login-history"],
    list: (params) => ["login-history", "list", params],
  },

  emailVerification: {
    all: () => ["email-verification"],
    list: (params) => ["email-verification", "list", params],
  },

  passwordReset: {
    all: () => ["password-reset"],
    list: (params) => ["password-reset", "list", params],
  },

  dashboard: {
    all: () => ["dashboard"],
    stats: () => ["dashboard", "stats"],
  },

  events: {
    all: () => ["events"],
    list: (params) => ["events", "list", params],
    detail: (id) => ["events", "detail", id],
  },

  analytics: {
    all: () => ["analytics"],
    overview: (params) => ["analytics", "overview", params],
  },

  settings: {
    all: () => ["settings"],
    business: () => ["settings", "business"],
  },

  blockedDates: {
    all: () => ["blocked-dates"],
    list: () => ["blocked-dates", "list"],
  },

  services: {
    all: () => ["services"],
    list: (params) => ["services", "list", params],
    detail: (id) => ["services", "detail", id],
  },
};
