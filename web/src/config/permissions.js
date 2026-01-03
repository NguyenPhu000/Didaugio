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
