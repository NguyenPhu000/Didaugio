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

/**
 * BusinessHeader — dedicated header for the business portal.
 * Visually lighter and cleaner than AdminHeader, with white-first styling.
 */
function BusinessHeader() {
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout, isLoggingOut } = useLogout();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { permission, isSubscribed, requestPermissionAndSubscribe } = useWebPush();

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const roleLabel = ROLE_NAMES[currentRoleId] || "Doanh nghiệp";
  const avatarSrc = resolveMediaUrl(user?.avatar || user?.profile?.avatar);

  const resolveNotificationRoute = (notification) => {
    const metadata = notification?.metadata || {};
    const type = String(metadata.type || "");

    if (REVIEW_NOTIFICATION_ROLES.includes(currentRoleId)) {
      if (type.includes("place") || metadata.placeId) return ADMIN_ROUTES.PLACES_PENDING;
      if (type.includes("business") || metadata.businessId) return ADMIN_ROUTES.BUSINESS_LIST;
      if (type.includes("review") || metadata.reviewId) return ADMIN_ROUTES.REVIEWS_MODERATION;
      return ADMIN_ROUTES.DASHBOARD;
    }

    if ((type.includes("booking") || metadata.bookingId) && metadata.bookingId) {
      return BUSINESS_ROUTES.BOOKING_DETAIL(metadata.bookingId);
    }
    if (type.includes("booking")) return BUSINESS_ROUTES.BOOKINGS;
    if (type.includes("review")) return BUSINESS_ROUTES.REVIEWS;
    if (type.includes("business") || type.includes("document")) return BUSINESS_ROUTES.PROFILE;
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
    [BUSINESS_ROUTES.DASHBOARD]: t("nav.dashboard"),
    [BUSINESS_ROUTES.PROFILE]: t("breadcrumbs.businessProfile"),
    [BUSINESS_ROUTES.SERVICES]: t("breadcrumbs.services"),
    [BUSINESS_ROUTES.BOOKINGS]: t("breadcrumbs.bookings"),
    [BUSINESS_ROUTES.VOUCHERS]: t("breadcrumbs.vouchers"),
    [BUSINESS_ROUTES.REVENUE]: t("breadcrumbs.revenue"),
    [BUSINESS_ROUTES.REVIEWS]: t("breadcrumbs.reviews"),
    [BUSINESS_ROUTES.STAFF]: t("breadcrumbs.staff"),
    [BUSINESS_ROUTES.PLACES]: t("breadcrumbs.myPlaces"),
  };

  const pageLabel =
    ROUTE_LABELS[location.pathname] || t("common.businessPortal");

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-6 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
      {/* Left: trigger + breadcrumb */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200" />

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 dark:text-zinc-600 uppercase tracking-wider font-medium">
            {roleLabel}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-zinc-700 font-semibold uppercase tracking-wider dark:text-zinc-300">
            {pageLabel}
          </span>
        </div>

        {/* Search */}
        <div className="relative hidden w-full max-w-[340px] xl:block ml-4">
          <Input
            type="text"
            placeholder={t("header.searchPlaceholder")}
            aria-label={t("header.searchPlaceholder")}
            className="h-9 w-full rounded-full border-zinc-200 bg-zinc-50 pl-5 pr-10 text-sm text-zinc-700 placeholder:text-zinc-400 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus-visible:bg-zinc-900"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
        </div>
      </div>

      {/* Right: date, bell, profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-600 mr-1">
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
              className="relative h-9 w-9 rounded-full hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-900 dark:text-zinc-400"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black leading-none text-white shadow-sm dark:border-zinc-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[calc(100vw-2rem)] max-w-[360px] p-0 overflow-hidden border-zinc-200/80 shadow-xl rounded-2xl bg-white dark:bg-zinc-950 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{t("header.notifications")}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 dark:text-zinc-500">
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
                  className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
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
                  <Bell className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
                  <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{t("header.noNotifications")}</p>
                  <p className="text-[11px] text-zinc-300 text-center px-4 dark:text-zinc-600">
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
                          "flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 border-b border-zinc-50 dark:hover:bg-zinc-900 dark:border-zinc-900 last:border-0",
                          unread && "bg-zinc-50/50 dark:bg-zinc-900/50 dark:hover:bg-zinc-900",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1">
                            {n.title || t("header.notification")}
                          </span>
                          {unread && (
                            <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                          )}
                        </div>
                        <span className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed dark:text-zinc-400">
                          {n.message || n.body || ""}
                        </span>
                        <span className="text-[10px] text-zinc-300 font-mono mt-0.5 dark:text-zinc-600">
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
              <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestPermissionAndSubscribe()}
                  className="w-full justify-start h-8 text-[11px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
                >
                  <Bell className="mr-2 h-3 w-3" />
                  {t("header.enableBrowserNotifications")}
                </Button>
              </div>
            )}
            {isSubscribed && (
              <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> {t("header.browserNotificationsEnabled")}
                </div>
              </div>
            )}
            {notifications.length > 0 && (
              <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(ADMIN_ROUTES.NOTIFICATIONS)}
                  className="w-full justify-center h-8 text-[12px] font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
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
            <div className="flex items-center gap-2.5 cursor-pointer rounded-full py-1 px-2 hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200 dark:hover:bg-zinc-900 dark:hover:border-zinc-800">
              <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={avatarSrc || undefined} />
                <AvatarFallback className="bg-zinc-950 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-950">
                  {getInitials(user?.fullName || user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {user?.fullName || "Doanh nghiệp"}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider dark:text-zinc-600">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden md:block dark:text-zinc-600" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 mt-2 bg-white border-zinc-200/80 text-zinc-950 shadow-lg rounded-xl dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100"
          >
            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {t("header.account")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => navigate(ADMIN_ROUTES.PROFILE)}
              className="focus:bg-zinc-50 gap-2 cursor-pointer dark:focus:bg-zinc-900"
            >
              <User className="h-4 w-4" /> {t("header.profile")}
            </DropdownMenuItem>
            {currentRoleId === ROLES.BUSINESS && (
              <DropdownMenuItem
                onClick={() => navigate(BUSINESS_ROUTES.PROFILE)}
                className="focus:bg-zinc-50 gap-2 cursor-pointer dark:focus:bg-zinc-900"
              >
                <Store className="h-4 w-4" /> {t("header.businessProfile")}
              </DropdownMenuItem>
            )}
            {[ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.roleId) && (
              <DropdownMenuItem
                onClick={() => navigate(ADMIN_ROUTES.SETTINGS)}
                className="focus:bg-zinc-50 gap-2 cursor-pointer dark:focus:bg-zinc-900"
              >
                <Settings className="h-4 w-4" /> {t("header.systemSettings")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 gap-2 cursor-pointer dark:text-red-400 dark:focus:bg-red-950"
            >
              <LogOut className="h-4 w-4" /> {t("header.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default BusinessHeader;
