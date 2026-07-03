import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Calendar,
  Check,
  ExternalLink,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/animate-ui/components/radix/popover";
import { useNavigate, useLocation } from "react-router-dom";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { useLogout } from "@/hooks/useLogout";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { useWebPush } from "@/hooks/useWebPush";
import { useNotifications } from "@/hooks/useNotifications";
import { resolveRoleId } from "@/utils/authRouting";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useTranslation } from "react-i18next";

const REVIEW_NOTIFICATION_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminHeader() {
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, isLoggingOut } = useLogout();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { permission, isSubscribed, requestPermissionAndSubscribe } = useWebPush();

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

  const resolveNotificationRoute = (notification) => {
    const metadata = notification?.metadata || {};
    const type = String(metadata.type || "");

    if (REVIEW_NOTIFICATION_ROLES.includes(currentRoleId)) {
      if (type.includes("place") || metadata.placeId) {
        return ADMIN_ROUTES.PLACES_PENDING;
      }
      if (type.includes("business") || metadata.businessId) {
        return ADMIN_ROUTES.BUSINESS_LIST;
      }
      if (type.includes("review") || metadata.reviewId) {
        return ADMIN_ROUTES.REVIEWS_MODERATION;
      }
      return ADMIN_ROUTES.DASHBOARD;
    }

    if ((type.includes("booking") || metadata.bookingId) && metadata.bookingId) {
      return BUSINESS_ROUTES.BOOKING_DETAIL(metadata.bookingId);
    }
    if (type.includes("booking")) return BUSINESS_ROUTES.BOOKINGS;
    if (type.includes("review")) return BUSINESS_ROUTES.REVIEWS;
    if (type.includes("business") || type.includes("document")) {
      return BUSINESS_ROUTES.PROFILE;
    }
    if ((type.includes("place") || metadata.placeId) && metadata.placeId) {
      return BUSINESS_ROUTES.PLACES_EDIT(metadata.placeId);
    }
    return BUSINESS_ROUTES.DASHBOARD;
  };

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-6 shadow-sm">
      {/* Left: trigger + breadcrumb */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
          <span className="text-sidebar-foreground/40 uppercase tracking-wider">
            {roleLabel}
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
            placeholder={t("header.searchPlaceholder")}
            aria-label={t("header.searchPlaceholder")}
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

        {/* Language Selector */}
        <LanguageSelector />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("header.notifications")}
              className="relative h-9 w-9 rounded-full hover:bg-accent text-sidebar-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-sidebar bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[360px] p-0 overflow-hidden !bg-white border border-gray-200 shadow-xl rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t("header.notifications")}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {unreadCount > 0
                    ? t("header.unreadCount", { count: unreadCount })
                    : t("header.notificationSubtitle")}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <Check className="mr-1 h-3 w-3" />
                  {t("header.markAllRead")}
                </Button>
              )}
            </div>

            {/* List */}
            <ScrollArea className="max-h-[360px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell className="h-8 w-8 text-gray-200" />
                  <p className="text-sm font-medium text-gray-400">{t("header.noNotifications")}</p>
                  <p className="text-[11px] text-gray-300 text-center px-4">
                    {t("header.noNotificationsDesc")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => {
                    const unread = !n.readAt;
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          navigate(resolveNotificationRoute(n));
                        }}
                        className={cn(
                          "flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0",
                          unread && "bg-blue-50/50 hover:bg-blue-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1">
                            {n.title || t("header.notification")}
                          </span>
                          {unread && (
                            <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <span className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                          {n.message || n.body || ""}
                        </span>
                        <span className="text-[10px] text-gray-300 font-mono mt-0.5">
                          {formatTime(n.createdAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Web Push toggle */}
            {!isSubscribed && permission !== "denied" && (
              <>
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requestPermissionAndSubscribe()}
                    className="w-full justify-start h-8 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  >
                    <Bell className="mr-2 h-3 w-3" />
                    {t("header.enableBrowserNotifications")}
                  </Button>
                </div>
              </>
            )}
            {isSubscribed && (
              <div className="border-t border-gray-100 px-4 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <Check className="h-3 w-3" /> {t("header.browserNotificationsEnabled")}
                </div>
              </div>
            )}
            {notifications.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)}
                  className="w-full justify-center h-8 text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {t("header.viewAllNotifications")}
                  <ExternalLink className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2.5 cursor-pointer rounded-full py-1 px-2 hover:bg-sidebar-accent transition-all border border-transparent hover:border-sidebar-border">
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
