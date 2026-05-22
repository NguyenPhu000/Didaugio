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
} from "lucide-react";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { PERMISSIONS } from "@/constants/permissions";

const R = ROLES;

/**
 * SIDEBAR MENU DATA
 * Each item can have an optional `roles` array.
 * If omitted, the item is visible to all authenticated roles.
 * Sub-items inherit parent visibility unless they define their own `roles`.
 */
const menuData = {
  main: [
    {
      title: "Dashboard",
      icon: Home,
      url: ADMIN_ROUTES.DASHBOARD,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.STAFF],
      badge: null,
    },
    {
      title: "Dashboard",
      icon: Home,
      url: BUSINESS_ROUTES.DASHBOARD,
      roles: [R.BUSINESS],
      badge: null,
    },
    {
      title: "Bản đồ",
      icon: Map,
      url: ADMIN_ROUTES.MAP,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.BUSINESS],
      badge: { text: "Mới", variant: "default" },
    },
  ],
  management: [
    {
      title: "Địa điểm",
      icon: MapPin,
      roles: [R.SUPER_ADMIN, R.ADMIN, R.BUSINESS],
      items: [
        {
          title: "Danh sách địa điểm",
          url: ADMIN_ROUTES.PLACES,
          icon: List,
        },
        {
          title: "Duyệt địa điểm",
          url: ADMIN_ROUTES.PLACES_PENDING,
          icon: ClipboardCheck,
          roles: [R.SUPER_ADMIN, R.ADMIN, R.STAFF],
          permission: PERMISSIONS.PLACES.APPROVE,
        },
      ],
    },
    {
      title: "Danh mục",
      icon: FolderTree,
      url: ADMIN_ROUTES.CATEGORIES,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.CATEGORIES.VIEW,
    },
    {
      title: "Tags",
      icon: Tags,
      url: ADMIN_ROUTES.TAGS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.CATEGORIES.MANAGE_TAGS,
    },
    {
      title: "Quận / Huyện",
      icon: Building2,
      url: ADMIN_ROUTES.DISTRICTS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
  ],
  business: [
    {
      title: "Địa điểm của tôi",
      icon: MapPin,
      roles: [R.BUSINESS],
      items: [
        { title: "Quản lý địa điểm", url: BUSINESS_ROUTES.PLACES },
        { title: "Thêm địa điểm", url: BUSINESS_ROUTES.PLACES_NEW },
      ],
      badge: null,
    },
    {
      title: "Dịch vụ",
      icon: Ticket,
      url: BUSINESS_ROUTES.SERVICES,
      roles: [R.BUSINESS],
    },
    {
      title: "Đặt chỗ",
      icon: CalendarCheck,
      roles: [R.BUSINESS, R.STAFF],
      permission: PERMISSIONS.BOOKINGS.VIEW,
      items: [
        { title: "Tất cả đặt chỗ", url: BUSINESS_ROUTES.BOOKINGS, permission: PERMISSIONS.BOOKINGS.VIEW },
        { title: "Lịch khung giờ", url: BUSINESS_ROUTES.BOOKING_SCHEDULE, roles: [R.BUSINESS] },
        { title: "Xử lý nhanh & auto-duyệt", url: BUSINESS_ROUTES.BOOKING_QUICK, roles: [R.BUSINESS] },
      ],
    },
    {
      title: "Nhân viên",
      icon: Users,
      url: BUSINESS_ROUTES.STAFF,
      roles: [R.BUSINESS, R.STAFF],
      permission: PERMISSIONS.STAFF.VIEW,
    },
    {
      title: "Khuyến mãi",
      icon: Ticket,
      url: BUSINESS_ROUTES.VOUCHERS,
      roles: [R.BUSINESS],
    },
    {
      title: "Báo cáo",
      icon: BarChart3,
      url: BUSINESS_ROUTES.REPORTS,
      roles: [R.BUSINESS],
    },
    {
      title: "Doanh thu",
      icon: BarChart3,
      url: BUSINESS_ROUTES.REVENUE,
      roles: [R.BUSINESS],
    },
    {
      title: "Thu nhập & Rút tiền",
      icon: TrendingUp,
      url: BUSINESS_ROUTES.EARNINGS,
      roles: [R.BUSINESS],
    },
    {
      title: "Đánh giá",
      icon: Star,
      url: BUSINESS_ROUTES.REVIEWS,
      roles: [R.BUSINESS],
    },
    {
      title: "Cài đặt",
      icon: Settings,
      url: BUSINESS_ROUTES.SETTINGS,
      roles: [R.BUSINESS],
    },
  ],
  adminBusiness: [
    {
      title: "Quản lý Business",
      icon: Briefcase,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.BUSINESS.VIEW,
      items: [
        { title: "Danh sách", url: ADMIN_ROUTES.BUSINESS_LIST },
        { title: "Chờ duyệt", url: ADMIN_ROUTES.BUSINESS_PENDING, permission: PERMISSIONS.BUSINESS.APPROVE },
      ],
    },
    {
      title: "Thống kê nâng cao",
      icon: TrendingUp,
      url: ADMIN_ROUTES.ANALYTICS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
    {
      title: "Quản lý nội dung",
      icon: FileText,
      url: ADMIN_ROUTES.CMS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
    },
    {
      title: "Moderation đánh giá",
      icon: Star,
      url: ADMIN_ROUTES.REVIEWS_MODERATION,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.REVIEWS.VIEW,
    },
    {
      title: "Quản lý rút tiền",
      icon: Wallet,
      url: ADMIN_ROUTES.PAYOUTS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.PAYOUTS.VIEW,
    },
  ],
  users: [
    {
      title: "Người dùng",
      icon: Users,
      url: ADMIN_ROUTES.USERS,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.USERS.VIEW,
    },
    {
      title: "Phân quyền",
      icon: Shield,
      roles: [R.SUPER_ADMIN],
      permission: PERMISSIONS.ROLES.VIEW,
      items: [
        { title: "Roles", url: ADMIN_ROUTES.ROLES },
        { title: "Permissions", url: ADMIN_ROUTES.PERMISSIONS, permission: PERMISSIONS.ROLES.MANAGE_PERMISSIONS },
      ],
    },
  ],
  system: [
    {
      title: "Email & Bảo mật",
      icon: Mail,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      items: [
        { title: "Xác thực Email", url: ADMIN_ROUTES.EMAIL_VERIFICATIONS },
        { title: "Reset Mật khẩu", url: ADMIN_ROUTES.PASSWORD_RESETS },
      ],
    },
    {
      title: "Hoạt động",
      icon: FileText,
      roles: [R.SUPER_ADMIN, R.ADMIN],
      permission: PERMISSIONS.AUDIT_LOG.VIEW,
      items: [
        { title: "Lịch sử hệ thống", url: ADMIN_ROUTES.AUDIT_LOGS, permission: PERMISSIONS.AUDIT_LOG.VIEW },
        { title: "Lịch sử đăng nhập", url: ADMIN_ROUTES.LOGIN_HISTORY, permission: PERMISSIONS.LOGIN_HISTORY.VIEW },
      ],
    },
  ],
};

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

export default menuData;
