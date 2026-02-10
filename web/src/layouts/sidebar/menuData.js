import {
  Home,
  Map,
  MapPin,
  Users,
  Settings,
  Building2,
  Tags,
  FolderTree,
  Shield,
  Mail,
  FileText,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";

/**
 * SIDEBAR MENU DATA
 * Centralized menu configuration for AdminLayout sidebar
 */
const menuData = {
  main: [
    {
      title: "Dashboard",
      icon: Home,
      url: ADMIN_ROUTES.DASHBOARD,
      badge: null,
    },
    {
      title: "Bản đồ",
      icon: Map,
      url: ADMIN_ROUTES.MAP,
      badge: { text: "Mới", variant: "default" },
    },
  ],
  management: [
    {
      title: "Địa điểm",
      icon: MapPin,
      url: ADMIN_ROUTES.PLACES,
    },
    {
      title: "Danh mục",
      icon: FolderTree,
      url: ADMIN_ROUTES.CATEGORIES,
    },
    {
      title: "Tags",
      icon: Tags,
      url: ADMIN_ROUTES.TAGS,
    },
    {
      title: "Quận / Huyện",
      icon: Building2,
      url: ADMIN_ROUTES.DISTRICTS,
    },
  ],
  users: [
    {
      title: "Người dùng",
      icon: Users,
      url: ADMIN_ROUTES.USERS,
    },
    {
      title: "Phân quyền",
      icon: Shield,
      items: [
        { title: "Roles", url: ADMIN_ROUTES.ROLES },
        { title: "Permissions", url: ADMIN_ROUTES.PERMISSIONS },
      ],
    },
  ],
  system: [
    {
      title: "Email & Bảo mật",
      icon: Mail,
      items: [
        { title: "Xác thực Email", url: ADMIN_ROUTES.EMAIL_VERIFICATIONS },
        { title: "Reset Mật khẩu", url: ADMIN_ROUTES.PASSWORD_RESETS },
      ],
    },
    {
      title: "Hoạt động",
      icon: FileText,
      items: [
        { title: "Lịch sử hệ thống", url: ADMIN_ROUTES.AUDIT_LOGS },
        { title: "Lịch sử đăng nhập", url: ADMIN_ROUTES.LOGIN_HISTORY },
      ],
    },
  ],
  settings: [
    {
      title: "Cài đặt",
      icon: Settings,
      url: ADMIN_ROUTES.SETTINGS,
    },
  ],
};

export default menuData;
