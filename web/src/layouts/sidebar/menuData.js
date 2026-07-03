import {
  Home,
  Map,
  MapPin,
  ClipboardCheck,
  List,
  Users,
  Building2,
  Tags,
  FolderTree,
  Shield,
  Mail,
  FileText,
  Briefcase,
  CalendarCheck,
  Ticket,
  BarChart3,
  Star,
  Store,
  TrendingUp,
  Wallet,
  Settings,
  Coins,
  CreditCard,
  User,
} from "lucide-react";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { PERMISSIONS } from "@/constants/permissions";
import i18n from "@/i18n";

const R = ROLES;

/**
 * SIDEBAR MENU DATA — Tái cấu trúc thành 5 nhóm rõ ràng
 *
 * Admin:  Tổng quan | Nội dung | Kinh doanh | Người dùng | Hệ thống
 * Business: Tổng quan | Kinh doanh | Tài chính | Đánh giá | Cài đặt
 *
 * Call getMenuData() to get the current menu with translated strings.
 */
export function getMenuData() {
  const t = i18n.t.bind(i18n);
  return {

  // ═══════════════════════════════════════════════════════════
  // ADMIN SIDEBAR
  // ═══════════════════════════════════════════════════════════

  main: [
    {
      key: "dashboard",
      title: t("nav.dashboard"),
      icon: Home,
      url: ADMIN_ROUTES.DASHBOARD,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.STAFF],
    },
    {
      key: "dashboard-business",
      title: t("nav.dashboard"),
      icon: Home,
      url: BUSINESS_ROUTES.DASHBOARD,
      roles: [R.BUSINESS],
    },
    {
      key: "map",
      title: t("nav.map"),
      icon: Map,
      url: ADMIN_ROUTES.MAP,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.BUSINESS],
      badge: { text: t("nav.badge.new"), variant: "default" },
    },
  ],

  // ─── Admin: Quản lý nội dung ─────────────────────────────
  management: [
    {
      key: "places",
      title: t("nav.management.places"),
      icon: MapPin,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.BUSINESS],
      items: [
        {
          key: "places-list",
          title: t("nav.management.placesList"),
          url: ADMIN_ROUTES.PLACES,
          icon: List,
        },
        {
          key: "places-pending",
          title: t("nav.management.placesPending"),
          url: ADMIN_ROUTES.PLACES_PENDING,
          icon: ClipboardCheck,
          roles: [R.SUPER_ADMIN, R.ADMIN, R.STAFF],
          permission: PERMISSIONS.PLACES.APPROVE,
        },
      ],
    },
    {
      key: "categories",
      title: t("nav.management.categories"),
      icon: FolderTree,
      url: ADMIN_ROUTES.CATEGORIES,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.CATEGORIES.VIEW,
    },
    {
      key: "tags",
      title: t("nav.management.tags"),
      icon: Tags,
      url: ADMIN_ROUTES.TAGS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.CATEGORIES.MANAGE_TAGS,
    },
    {
      key: "districts",
      title: t("nav.management.districts"),
      icon: Building2,
      url: ADMIN_ROUTES.DISTRICTS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
    {
      key: "cms",
      title: t("nav.adminBusiness.cms"),
      icon: FileText,
      url: ADMIN_ROUTES.CMS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
    {
      key: "review-moderation",
      title: t("nav.adminBusiness.reviewModeration"),
      icon: Star,
      url: ADMIN_ROUTES.REVIEWS_MODERATION,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.REVIEWS.VIEW,
    },
  ],

  // ─── Admin: Kinh doanh & Tài chính ───────────────────────
  adminBusiness: [
    {
      key: "manage-business",
      title: t("nav.adminBusiness.title"),
      icon: Briefcase,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.BUSINESS.VIEW,
      items: [
        { key: "business-list", title: t("nav.adminBusiness.list"), url: ADMIN_ROUTES.BUSINESS_LIST },
        { key: "business-pending", title: t("nav.adminBusiness.pending"), url: ADMIN_ROUTES.BUSINESS_PENDING, permission: PERMISSIONS.BUSINESS.APPROVE },
      ],
    },
    {
      key: "admin-subscriptions",
      title: t("nav.adminBusiness.subscriptions"),
      icon: CreditCard,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      items: [
        { key: "admin-subs", title: t("nav.adminBusiness.subscriptionList"), url: ADMIN_ROUTES.SUBSCRIPTIONS },
        { key: "admin-plans", title: t("nav.adminBusiness.subscriptionPlans"), url: ADMIN_ROUTES.SUBSCRIPTION_PLANS },
      ],
    },
    {
      key: "analytics",
      title: t("nav.adminBusiness.analytics"),
      icon: TrendingUp,
      url: ADMIN_ROUTES.ANALYTICS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
    {
      key: "payouts",
      title: t("nav.adminBusiness.payouts"),
      icon: Wallet,
      url: ADMIN_ROUTES.PAYOUTS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.PAYOUTS.VIEW,
    },
    {
      key: "refunds",
      title: t("nav.adminBusiness.refunds"),
      icon: Coins,
      url: ADMIN_ROUTES.REFUNDS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.PAYMENTS.REFUND,
    },
    {
      key: "cashflow",
      title: t("nav.adminBusiness.cashflow"),
      icon: Wallet,
      url: ADMIN_ROUTES.CASHFLOW,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.PAYMENTS.VIEW_REVENUE,
    },
  ],

  // ─── Admin: Người dùng & Phân quyền ─────────────────────
  users: [
    {
      key: "user-list",
      title: t("nav.users.title"),
      icon: Users,
      url: ADMIN_ROUTES.USERS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.USERS.VIEW,
    },
    {
      key: "permissions",
      title: t("nav.users.roles"),
      icon: Shield,
      roles: [R.SUPER_ADMIN],
      permission: PERMISSIONS.ROLES.VIEW,
      items: [
        { key: "roles", title: t("nav.users.rolesList"), url: ADMIN_ROUTES.ROLES },
        { key: "perms", title: t("nav.users.permissions"), url: ADMIN_ROUTES.PERMISSIONS, permission: PERMISSIONS.ROLES.MANAGE_PERMISSIONS },
      ],
    },
  ],

  // ─── Admin: Hệ thống ─────────────────────────────────────
  system: [
    {
      key: "email-security",
      title: t("nav.system.title"),
      icon: Mail,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      items: [
        { key: "email-verification", title: t("nav.system.emailVerification"), url: ADMIN_ROUTES.EMAIL_VERIFICATIONS },
        { key: "password-reset", title: t("nav.system.passwordReset"), url: ADMIN_ROUTES.PASSWORD_RESETS },
      ],
    },
    {
      key: "activity",
      title: t("nav.system.activity"),
      icon: FileText,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.AUDIT_LOG.VIEW,
      items: [
        { key: "audit-logs", title: t("nav.system.auditLogs"), url: ADMIN_ROUTES.AUDIT_LOGS, permission: PERMISSIONS.AUDIT_LOG.VIEW },
        { key: "login-history", title: t("nav.system.loginHistory"), url: ADMIN_ROUTES.LOGIN_HISTORY, permission: PERMISSIONS.LOGIN_HISTORY.VIEW },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════
  // BUSINESS SIDEBAR
  // ═══════════════════════════════════════════════════════════

  // ─── Business: Kinh doanh (địa điểm, dịch vụ, đặt chỗ) ──
  business: [
    {
      key: "my-places",
      title: t("nav.business.myPlaces"),
      icon: MapPin,
      roles: [R.BUSINESS],
      items: [
        { key: "manage-places", title: t("nav.business.managePlaces"), url: BUSINESS_ROUTES.PLACES },
        { key: "add-place", title: t("nav.business.addPlace"), url: BUSINESS_ROUTES.PLACES_NEW },
      ],
    },
    {
      key: "services",
      title: t("nav.business.services"),
      icon: Ticket,
      url: BUSINESS_ROUTES.SERVICES,
      roles: [R.BUSINESS],
    },
    {
      key: "bookings",
      title: t("nav.business.bookings"),
      icon: CalendarCheck,
      roles: [R.BUSINESS, R.STAFF],
      permission: PERMISSIONS.BOOKINGS.VIEW,
      items: [
        { key: "all-bookings", title: t("nav.business.allBookings"), url: BUSINESS_ROUTES.BOOKINGS, permission: PERMISSIONS.BOOKINGS.VIEW },
        { key: "booking-schedule", title: t("nav.business.bookingSchedule"), url: BUSINESS_ROUTES.BOOKING_SCHEDULE, roles: [R.BUSINESS] },
        { key: "booking-quick", title: t("nav.business.bookingQuick"), url: BUSINESS_ROUTES.BOOKING_QUICK, roles: [R.BUSINESS] },
      ],
    },
    {
      key: "staff",
      title: t("nav.business.staff"),
      icon: Users,
      url: BUSINESS_ROUTES.STAFF,
      roles: [R.BUSINESS, R.STAFF],
      permission: PERMISSIONS.STAFF.VIEW,
    },
    {
      key: "promotions",
      title: t("nav.business.promotions"),
      icon: Ticket,
      url: BUSINESS_ROUTES.VOUCHERS,
      roles: [R.BUSINESS],
    },
  ],

  // ─── Business: Tài chính (doanh thu, dòng tiền, subscription) ──
  businessFinance: [
    {
      key: "reports",
      title: t("nav.business.reports"),
      icon: BarChart3,
      url: BUSINESS_ROUTES.REPORTS,
      roles: [R.BUSINESS],
      feature: "analytics",
    },
    {
      key: "revenue",
      title: t("nav.business.revenue"),
      icon: BarChart3,
      url: BUSINESS_ROUTES.REVENUE,
      roles: [R.BUSINESS],
      feature: "analytics",
    },
    {
      key: "earnings",
      title: t("nav.business.earnings"),
      icon: TrendingUp,
      url: BUSINESS_ROUTES.EARNINGS,
      roles: [R.BUSINESS],
    },
    {
      key: "cashflow",
      title: t("nav.business.cashflow"),
      icon: Wallet,
      url: BUSINESS_ROUTES.CASHFLOW,
      roles: [R.BUSINESS],
      permission: PERMISSIONS.BUSINESS.VIEW_REVENUE,
    },
  ],

  // ─── Business: Đánh giá ──────────────────────────────────
  businessReviews: [
    {
      key: "reviews",
      title: t("nav.business.reviews"),
      icon: Star,
      url: BUSINESS_ROUTES.REVIEWS,
      roles: [R.BUSINESS],
    },
  ],

  // ─── Business: Tài khoản & Cài đặt ──────────────────────
  businessAccount: [
    {
      key: "profile",
      title: t("nav.business.profile"),
      icon: User,
      url: ADMIN_ROUTES.PROFILE,
      roles: [R.BUSINESS],
    },
    {
      key: "business-profile",
      title: t("nav.business.businessProfile"),
      icon: Store,
      url: BUSINESS_ROUTES.PROFILE,
      roles: [R.BUSINESS],
    },
    {
      key: "settings",
      title: t("nav.business.settings"),
      icon: Settings,
      url: BUSINESS_ROUTES.SETTINGS,
      roles: [R.BUSINESS],
    },
  ],

};
}

export const filterMenuByRole = (menu, { roleId, hasPermission }) => {
  const result = {};
  for (const [section, items] of Object.entries(menu)) {
    const filtered = items
      .filter((item) => {
        if (item.roles && !item.roles.includes(roleId)) return false;
        if (item.permission && hasPermission && !hasPermission(item.permission)) return false;
        return true;
      })
      .map((item) => {
        if (!item.items) return item;
        const filteredSubs = item.items.filter((sub) => {
          if (sub.roles && !sub.roles.includes(roleId)) return false;
          if (sub.permission && hasPermission && !hasPermission(sub.permission)) return false;
          return true;
        });
        return filteredSubs.length > 0
          ? { ...item, items: filteredSubs }
          : null;
      })
      .filter(Boolean);
    if (filtered.length > 0) result[section] = filtered;
  }
  return result;
};

const menuData = getMenuData();
export default menuData;
