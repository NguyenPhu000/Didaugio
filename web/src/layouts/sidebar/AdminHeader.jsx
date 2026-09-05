import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import {
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Calendar,
  Store,
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
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { useLogout } from "@/hooks/useLogout";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { resolveRoleId } from "@/utils/authRouting";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { HeaderNotificationDropdown } from "@/components/common/HeaderNotificationDropdown";
import { useTranslation } from "react-i18next";

function AdminHeader() {
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, isLoggingOut } = useLogout();

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const resolveRoleLabel = () => {
    if (ROLE_NAMES[currentRoleId]) {
      return ROLE_NAMES[currentRoleId];
    }

    const rawRole = String(user?.role?.name || user?.roleName || "").trim();
    const normalizedRole = rawRole.toLowerCase().replace(/\s+/g, "_");
    if (normalizedRole === "member") {
      return ROLE_NAMES[5] || "User";
    }

    const numericRoleMatch = rawRole.match(/^ROLE[-_\s]?(\d+)$/i);
    if (numericRoleMatch) {
      const roleById = ROLE_NAMES[Number(numericRoleMatch[1])];
      if (roleById) return roleById;
    }

    return rawRole || "User";
  };

  const roleLabel = resolveRoleLabel();
  const avatarSrc = resolveMediaUrl(user?.avatar || user?.profile?.avatar);

  const { t, i18n } = useTranslation();
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const ROUTE_LABELS = {
    [ADMIN_ROUTES.DASHBOARD]: t("breadcrumbs.dashboard"),
    [ADMIN_ROUTES.NOTIFICATIONS]: t("breadcrumbs.notifications"),
    [ADMIN_ROUTES.PLACES]: t("breadcrumbs.places"),
    [ADMIN_ROUTES.CATEGORIES]: t("breadcrumbs.categories"),
    [ADMIN_ROUTES.TAGS]: t("breadcrumbs.tags"),
    [ADMIN_ROUTES.USERS]: t("breadcrumbs.users"),
    [ADMIN_ROUTES.ROLES]: t("breadcrumbs.roles"),
    [ADMIN_ROUTES.PERMISSIONS]: t("breadcrumbs.permissions"),
    [ADMIN_ROUTES.AUDIT_LOGS]: t("breadcrumbs.auditLogs"),
    [ADMIN_ROUTES.MAP]: t("breadcrumbs.map"),
    [ADMIN_ROUTES.PLACES_PENDING]: t("breadcrumbs.placesPending"),
    [ADMIN_ROUTES.PROFILE]: t("breadcrumbs.profile"),
    [ADMIN_ROUTES.SETTINGS]: t("breadcrumbs.settings"),
    [BUSINESS_ROUTES.DASHBOARD]: t("nav.dashboard"),
    [BUSINESS_ROUTES.PROFILE]: t("breadcrumbs.businessProfile"),
    [BUSINESS_ROUTES.REGISTER]: t("breadcrumbs.register"),
    [BUSINESS_ROUTES.SERVICES]: t("breadcrumbs.services"),
    [BUSINESS_ROUTES.BOOKINGS]: t("breadcrumbs.bookings"),
    [BUSINESS_ROUTES.VOUCHERS]: t("breadcrumbs.vouchers"),
    [BUSINESS_ROUTES.REVENUE]: t("breadcrumbs.revenue"),
    [BUSINESS_ROUTES.REVIEWS]: t("breadcrumbs.reviews"),
  };

  const pageLabel = (() => {
    if (
      location.pathname === BUSINESS_ROUTES.PROFILE &&
      new URLSearchParams(location.search).get("section") === "contract"
    ) {
      return t("breadcrumbs.contract");
    }
    return (
      ROUTE_LABELS[location.pathname] || ROLE_NAMES[currentRoleId] || t("breadcrumbs.admin")
    );
  })();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 sm:px-6 shadow-sm">
      {/* Left: trigger + breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0" />

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono truncate">
          <span className="text-sidebar-foreground/40 uppercase tracking-wider">
            {roleLabel}
          </span>
          <span className="text-sidebar-foreground/30">/</span>
          <span className="text-sidebar-foreground font-semibold uppercase tracking-wider truncate">
            {pageLabel}
          </span>
        </div>
      </div>

      {/* Right: date, bell, profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-sidebar-foreground/50 mr-1">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">{today}</span>
        </div>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Notifications */}
        <HeaderNotificationDropdown triggerClassName="text-sidebar-foreground hover:bg-sidebar-accent" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer rounded-full py-1 px-1.5 sm:px-2 hover:bg-sidebar-accent transition-all border border-transparent hover:border-sidebar-border">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                <AvatarImage src={avatarSrc || undefined} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs">
                  {getInitials(user?.fullName || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-semibold text-sidebar-foreground">
                  {user?.fullName || "Admin"}
                </span>
                <span className="text-[10px] text-sidebar-foreground/50 font-mono uppercase">
                  {roleLabel}
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
              {t("header.account")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem
              onClick={() => navigate(ADMIN_ROUTES.PROFILE)}
              className="focus:bg-sidebar-accent gap-2"
            >
              <User className="h-4 w-4" /> {t("header.profile")}
            </DropdownMenuItem>
            {[ROLES.BUSINESS].includes(currentRoleId) && (
              <DropdownMenuItem
                onClick={() => navigate(BUSINESS_ROUTES.PROFILE)}
                className="focus:bg-sidebar-accent gap-2"
              >
                <Store className="h-4 w-4" /> {t("header.businessProfile")}
              </DropdownMenuItem>
            )}
            {[ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.roleId) && (
              <DropdownMenuItem
                onClick={() => navigate(ADMIN_ROUTES.SETTINGS)}
                className="focus:bg-sidebar-accent gap-2"
              >
                <Settings className="h-4 w-4" /> {t("header.systemSettings")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive focus:bg-sidebar-accent gap-2"
            >
              <LogOut className="h-4 w-4" /> {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminHeader;
