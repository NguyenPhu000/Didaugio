export const PERMISSION_MODULES = {
  USERS: "users",
  ROLES: "roles",
  PLACES: "places",
  BOOKINGS: "bookings",
  REVIEWS: "reviews",
  BUSINESS: "business",
  REPORTS: "reports",
  SYSTEM: "system",
  CATEGORIES: "categories",
  PAYMENTS: "payments",
};

export const MODULE_ICONS = {
  [PERMISSION_MODULES.USERS]: "Users",
  [PERMISSION_MODULES.ROLES]: "Shield",
  [PERMISSION_MODULES.PLACES]: "MapPin",
  [PERMISSION_MODULES.BOOKINGS]: "Calendar",
  [PERMISSION_MODULES.REVIEWS]: "MessageSquare",
  [PERMISSION_MODULES.BUSINESS]: "Briefcase",
  [PERMISSION_MODULES.REPORTS]: "Flag",
  [PERMISSION_MODULES.SYSTEM]: "Settings",
  [PERMISSION_MODULES.CATEGORIES]: "FolderTree",
  [PERMISSION_MODULES.PAYMENTS]: "CreditCard",
};

export const MODULE_DISPLAY_NAMES = {
  [PERMISSION_MODULES.USERS]: "Quản lý người dùng",
  [PERMISSION_MODULES.ROLES]: "Quản lý vai trò",
  [PERMISSION_MODULES.PLACES]: "Quản lý địa điểm",
  [PERMISSION_MODULES.BOOKINGS]: "Quản lý đặt chỗ",
  [PERMISSION_MODULES.REVIEWS]: "Quản lý đánh giá",
  [PERMISSION_MODULES.BUSINESS]: "Quản lý doanh nghiệp",
  [PERMISSION_MODULES.REPORTS]: "Quản lý báo cáo",
  [PERMISSION_MODULES.SYSTEM]: "Quản trị hệ thống",
  [PERMISSION_MODULES.CATEGORIES]: "Quản lý danh mục",
  [PERMISSION_MODULES.PAYMENTS]: "Quản lý thanh toán",
};

export const MODULE_GRADIENTS = {
  [PERMISSION_MODULES.USERS]: "from-blue-500 to-cyan-500",
  [PERMISSION_MODULES.ROLES]: "from-purple-500 to-pink-500",
  [PERMISSION_MODULES.PLACES]: "from-green-500 to-emerald-500",
  [PERMISSION_MODULES.BOOKINGS]: "from-yellow-500 to-orange-500",
  [PERMISSION_MODULES.REVIEWS]: "from-pink-500 to-rose-500",
  [PERMISSION_MODULES.BUSINESS]: "from-indigo-500 to-blue-500",
  [PERMISSION_MODULES.REPORTS]: "from-red-500 to-orange-500",
  [PERMISSION_MODULES.SYSTEM]: "from-slate-500 to-gray-500",
  [PERMISSION_MODULES.CATEGORIES]: "from-teal-500 to-cyan-500",
  [PERMISSION_MODULES.PAYMENTS]: "from-emerald-500 to-green-500",
};

export const ROLE_ICONS = {
  super_admin: "ShieldCheck",
  admin: "UserCog",
  business: "Store",
  staff: "Users",
  guest: "User",
};

export const ROLE_COLORS = {
  super_admin: "from-purple-500 to-pink-500",
  admin: "from-blue-500 to-cyan-500",
  business: "from-green-500 to-emerald-500",
  staff: "from-yellow-500 to-orange-500",
  guest: "from-gray-500 to-slate-500",
};

/**
 * Permission name constants — synced with backend DB (server/prisma/migrations/20260102000000_seed_permissions.sql)
 * Use these instead of hardcoded strings to catch typos at compile time.
 */
export const PERMISSIONS = {
  USERS: {
    VIEW: "users.view",
    VIEW_DETAIL: "users.view_detail",
    CREATE: "users.create",
    EDIT: "users.edit",
    DELETE: "users.delete",
    LOCK: "users.lock",
    CHANGE_ROLE: "users.change_role",
    RESET_PASSWORD: "users.reset_password",
    VIEW_LOGIN_HISTORY: "users.view_login_history",
    EXPORT: "users.export",
  },
  ROLES: {
    VIEW: "roles.view",
    VIEW_DETAIL: "roles.view_detail",
    MANAGE_PERMISSIONS: "roles.manage_permissions",
    VIEW_USERS: "roles.view_users",
    ASSIGN_TO_USERS: "roles.assign_to_users",
  },
  PLACES: {
    VIEW: "places.view",
    VIEW_DETAIL: "places.view_detail",
    CREATE: "places.create",
    EDIT: "places.edit",
    DELETE: "places.delete",
    APPROVE: "places.approve",
    REJECT: "places.reject",
    FEATURE: "places.feature",
    VERIFY: "places.verify",
    MANAGE_IMAGES: "places.manage_images",
    MANAGE_HOURS: "places.manage_hours",
    EXPORT: "places.export",
  },
  BOOKINGS: {
    VIEW: "bookings.view",
    VIEW_DETAIL: "bookings.view_detail",
    CONFIRM: "bookings.confirm",
    CANCEL: "bookings.cancel",
    COMPLETE: "bookings.complete",
    EXPORT: "bookings.export",
    VIEW_REVENUE: "bookings.view_revenue",
    CHECKIN: "bookings.checkin",
  },
  REVIEWS: {
    VIEW: "reviews.view",
    VIEW_DETAIL: "reviews.view_detail",
    HIDE: "reviews.hide",
    DELETE: "reviews.delete",
    REPLY: "reviews.reply",
    EXPORT: "reviews.export",
  },
  BUSINESS: {
    VIEW: "business.view",
    VIEW_DETAIL: "business.view_detail",
    APPROVE: "business.approve",
    REJECT: "business.reject",
    EDIT: "business.edit",
    LOCK: "business.lock",
    MANAGE_SERVICES: "business.manage_services",
    MANAGE_VOUCHERS: "business.manage_vouchers",
    VIEW_REVENUE: "business.view_revenue",
    EXPORT: "business.export",
  },
  REPORTS: {
    VIEW: "reports.view",
    VIEW_DETAIL: "reports.view_detail",
    RESOLVE: "reports.resolve",
    REJECT: "reports.reject",
    EXPORT: "reports.export",
  },
  SYSTEM: {
    VIEW_CONFIG: "system.view_config",
    EDIT_CONFIG: "system.edit_config",
    VIEW_LOGS: "system.view_logs",
    MANAGE_API_KEYS: "system.manage_api_keys",
    MANAGE_BANNERS: "system.manage_banners",
    SEND_NOTIFICATIONS: "system.send_notifications",
    VIEW_ANALYTICS: "system.view_analytics",
    EXPORT_DATA: "system.export_data",
  },
  CATEGORIES: {
    VIEW: "categories.view",
    CREATE: "categories.create",
    EDIT: "categories.edit",
    DELETE: "categories.delete",
    MANAGE_TAGS: "categories.manage_tags",
  },
  PAYMENTS: {
    VIEW: "payments.view",
    VIEW_DETAIL: "payments.view_detail",
    REFUND: "payments.refund",
    EXPORT: "payments.export",
    VIEW_REVENUE: "payments.view_revenue",
  },
  EMAIL_VERIFICATION: {
    VIEW: "email_verification.view",
    CREATE: "email_verification.create",
  },
  PASSWORD_RESET: {
    VIEW: "password_reset.view",
  },
  AUDIT_LOG: {
    VIEW: "audit_log.view",
  },
  LOGIN_HISTORY: {
    VIEW: "login_history.view",
    REVOKE: "login_history.revoke",
  },
  PAYOUTS: {
    VIEW: "payouts.view",
    APPROVE: "payouts.approve",
  },
  EARNINGS: {
    VIEW: "earnings.view",
  },
  STAFF: {
    VIEW: "staff.view",
    CREATE: "staff.create",
    UPDATE: "staff.update",
    DELETE: "staff.delete",
  },
};
