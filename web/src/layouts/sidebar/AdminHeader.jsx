import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Calendar,
} from "lucide-react";
import {
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { ROLES, ROLE_NAMES } from "@/constants/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_ROUTES, ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";

const ROUTE_LABELS = {
  [ADMIN_ROUTES.DASHBOARD]: "Tổng quan",
  [ADMIN_ROUTES.PLACES]: "Địa điểm",
  [ADMIN_ROUTES.CATEGORIES]: "Danh mục",
  [ADMIN_ROUTES.TAGS]: "Thẻ tag",
  [ADMIN_ROUTES.USERS]: "Người dùng",
  [ADMIN_ROUTES.ROLES]: "Vai trò",
  [ADMIN_ROUTES.PERMISSIONS]: "Quyền hạn",
  [ADMIN_ROUTES.AUDIT_LOGS]: "Nhật ký",
  [ADMIN_ROUTES.MAP]: "Bản đồ",
  [ADMIN_ROUTES.PLACES_PENDING]: "Duyệt địa điểm",
  [ADMIN_ROUTES.PROFILE]: "Hồ sơ",
  [ADMIN_ROUTES.SETTINGS]: "Cài đặt",
  [BUSINESS_ROUTES.DASHBOARD]: "Dashboard",
  [BUSINESS_ROUTES.PROFILE]: "Hồ sơ Doanh nghiệp",
  [BUSINESS_ROUTES.REGISTER]: "Đăng ký Cửa hàng",
  [BUSINESS_ROUTES.SERVICES]: "Dịch vụ",
  [BUSINESS_ROUTES.BOOKINGS]: "Lịch đặt",
  [BUSINESS_ROUTES.VOUCHERS]: "Khuyến mãi",
  [BUSINESS_ROUTES.REVENUE]: "Doanh thu",
  [BUSINESS_ROUTES.REVIEWS]: "Đánh giá",
};

function AdminHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const handleLogout = () => {
    logout();
    navigate(AUTH_ROUTES.LOGIN);
  };

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const pageLabel =
    ROUTE_LABELS[location.pathname] || ROLE_NAMES[user?.roleId] || "Quản trị";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-6 shadow-sm">
      {/* Left: trigger + breadcrumb */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
          <span className="text-sidebar-foreground/40 uppercase tracking-wider">
            {ROLE_NAMES[user?.roleId] || "Admin"}
          </span>
          <span className="text-sidebar-foreground/30">/</span>
          <span className="text-sidebar-foreground font-semibold uppercase tracking-wider">
            {pageLabel}
          </span>
        </div>

        {/* Search */}
        <div className="relative hidden w-full max-w-[340px] xl:block ml-4">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-9 w-full rounded-full border-0 bg-sidebar-accent/50 pl-5 pr-10 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus-visible:bg-sidebar-accent focus-visible:ring-1 focus-visible:ring-sidebar-ring"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
        </div>
      </div>

      {/* Right: date, bell, profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-sidebar-foreground/50 mr-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">{today}</span>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-sidebar" />
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2.5 cursor-pointer rounded-full py-1 px-2 hover:bg-sidebar-accent transition-all border border-transparent hover:border-sidebar-border">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs">
                  {getInitials(user?.fullName || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-semibold text-sidebar-foreground">
                  {user?.fullName || "Admin"}
                </span>
                <span className="text-[10px] text-sidebar-foreground/50 font-mono uppercase">
                  {user?.role?.name || "Administrator"}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 hidden md:block" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 mt-2 bg-sidebar border-sidebar-border text-sidebar-foreground"
          >
            <DropdownMenuLabel className="text-xs font-mono uppercase tracking-widest opacity-60">
              Tài khoản
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem
              onClick={() => navigate(ADMIN_ROUTES.PROFILE)}
              className="focus:bg-sidebar-accent gap-2"
            >
              <User className="h-4 w-4" /> Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-2">
              <Settings className="h-4 w-4" /> Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-sidebar-accent gap-2"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminHeader;
