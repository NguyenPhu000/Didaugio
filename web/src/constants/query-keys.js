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

  documents: {
    all: () => ["documents"],
    status: (businessId) => ["documents", "status", businessId],
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
    groups: () => ["tags", "groups"],
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
    stats: () => ["vouchers", "stats"],
    analytics: (id) => ["vouchers", "analytics", id],
  },

  staff: {
    all: () => ["staff"],
    list: (params) => ["staff", "list", params],
    detail: (id) => ["staff", "detail", id],
    stats: () => ["staff", "stats"],
    activity: (id) => ["staff", "activity", id],
    auditLog: (params) => ["staff", "audit-log", params],
    invitations: () => ["staff", "invitations"],
  },

  revenue: {
    all: () => ["revenue"],
    overview: (params) => ["revenue", "overview", params],
    timeline: (params) => ["revenue", "timeline", params],
    byPlace: (params) => ["revenue", "by-place", params],
    transactions: (params) => ["revenue", "transactions", params],
    cashflow: (params) => ["revenue", "cashflow", params],
    cashflowSummary: (params) => ["revenue", "cashflow-summary", params],
  },

  cashflow: {
    all: () => ["cashflow"],
    admin: (params) => ["cashflow", "admin", params],
    adminSummary: (params) => ["cashflow", "admin-summary", params],
    business: (params) => ["cashflow", "business", params],
    businessSummary: (params) => ["cashflow", "business-summary", params],
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
    stats: () => ["payouts", "stats"],
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
    health: () => ["dashboard", "health"],
    onlineUsers: () => ["dashboard", "online-users"],
  },

  events: {
    all: () => ["events"],
    list: (params) => ["events", "list", params],
    detail: (id) => ["events", "detail", id],
  },

  analytics: {
    all: () => ["analytics"],
    overview: (params) => ["analytics", "overview", params],
    adminPlaceHeatmap: (params) => ["analytics", "place-heatmap", "admin", params],
    businessPlaceHeatmap: (params) => ["analytics", "place-heatmap", "business", params],
  },

  settings: {
    all: () => ["settings"],
    business: () => ["settings", "business"],
    featureFlags: () => ["settings", "feature-flags"],
    systemLogs: (params) => ["settings", "system-logs", params],
    systemHealth: () => ["settings", "system-health"],
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

  subscriptions: {
    all: () => ["subscriptions"],
    current: () => ["subscriptions", "current"],
    plans: () => ["subscriptions", "plans"],
    proration: (targetPlanId, billingCycle) => ["subscriptions", "proration", targetPlanId, billingCycle],
    invoices: (params) => ["subscriptions", "invoices", params],
    adminList: (params) => ["subscriptions", "admin", "list", params],
    adminStats: () => ["subscriptions", "admin", "stats"],
    adminPlans: () => ["subscriptions", "admin", "plans"],
  },
};
