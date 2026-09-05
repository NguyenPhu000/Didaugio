import { SidebarTrigger } from "@/components/animate-ui/components/radix/sidebar";
import {
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Calendar,
  Store,
  CreditCard,
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
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { HeaderNotificationDropdown } from "@/components/common/HeaderNotificationDropdown";
import { useTranslation } from "react-i18next";

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

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const roleLabel = ROLE_NAMES[currentRoleId] || "Doanh nghiệp";
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
        <HeaderNotificationDropdown triggerClassName="hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-900 dark:text-zinc-400" />

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
            className="w-52 mt-2 bg-white border-zinc-200/80 text-zinc-950 shadow-lg rounded-2xl dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100 [--accent:transparent]"
          >
            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {t("header.account")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => navigate(ADMIN_ROUTES.PROFILE)}
              className="border border-transparent focus:border-zinc-950 focus:bg-transparent focus:text-zinc-950 dark:focus:border-zinc-100 dark:focus:text-zinc-100 gap-2 cursor-pointer rounded-lg"
            >
              <User className="h-4 w-4" /> {t("header.profile")}
            </DropdownMenuItem>
            {currentRoleId === ROLES.BUSINESS && (
              <>
                <DropdownMenuItem
                  onClick={() => navigate(BUSINESS_ROUTES.PROFILE)}
                  className="border border-transparent focus:border-zinc-950 focus:bg-transparent focus:text-zinc-950 dark:focus:border-zinc-100 dark:focus:text-zinc-100 gap-2 cursor-pointer rounded-lg"
                >
                  <Store className="h-4 w-4" /> {t("header.businessProfile") || t("nav.business.businessProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(BUSINESS_ROUTES.SUBSCRIPTION)}
                  className="border border-transparent focus:border-zinc-950 focus:bg-transparent focus:text-zinc-950 dark:focus:border-zinc-100 dark:focus:text-zinc-100 gap-2 cursor-pointer rounded-lg"
                >
                  <CreditCard className="h-4 w-4" /> {t("nav.business.subscription") || "Gói dịch vụ"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(BUSINESS_ROUTES.SETTINGS)}
                  className="border border-transparent focus:border-zinc-950 focus:bg-transparent focus:text-zinc-950 dark:focus:border-zinc-100 dark:focus:text-zinc-100 gap-2 cursor-pointer rounded-lg"
                >
                  <Settings className="h-4 w-4" /> {t("nav.business.settings") || "Cài đặt"}
                </DropdownMenuItem>
              </>
            )}
            {[ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.roleId) && (
              <DropdownMenuItem
                onClick={() => navigate(ADMIN_ROUTES.SETTINGS)}
                className="border border-transparent focus:border-zinc-950 focus:bg-transparent focus:text-zinc-950 dark:focus:border-zinc-100 dark:focus:text-zinc-100 gap-2 cursor-pointer rounded-lg"
              >
                <Settings className="h-4 w-4" /> {t("header.systemSettings")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600 focus:bg-transparent border border-transparent focus:border-red-600 gap-2 cursor-pointer dark:text-red-400 dark:focus:border-red-400 rounded-lg"
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
