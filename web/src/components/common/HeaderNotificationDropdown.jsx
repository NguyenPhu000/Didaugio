import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  CalendarCheck,
  MapPin,
  Store,
  Star,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/animate-ui/components/radix/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useWebPush } from "@/hooks/useWebPush";
import { useAuthStore } from "@/stores/authStore";
import { resolveRoleId } from "@/utils/authRouting";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { cn } from "@/lib/utils";

export function getNotificationMeta(notification, currentRoleId) {
  const metadata = notification?.metadata || {};
  const type = String(metadata.type || "").toLowerCase();

  // 1. Đặt chỗ / Giao dịch
  if (type.includes("booking") || metadata.bookingId) {
    return {
      category: "booking",
      label: "Đặt chỗ",
      Icon: CalendarCheck,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      badgeClass:
        "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
      route:
        currentRoleId === ROLES.BUSINESS && metadata.bookingId
          ? BUSINESS_ROUTES.BOOKING_DETAIL(metadata.bookingId)
          : currentRoleId === ROLES.BUSINESS
          ? BUSINESS_ROUTES.BOOKINGS
          : ADMIN_ROUTES.DASHBOARD,
    };
  }

  // 2. Địa điểm / Dịch vụ
  if (type.includes("place") || metadata.placeId) {
    return {
      category: "place",
      label: "Địa điểm",
      Icon: MapPin,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
      route:
        currentRoleId === ROLES.BUSINESS && metadata.placeId
          ? BUSINESS_ROUTES.PLACES_EDIT(metadata.placeId)
          : currentRoleId === ROLES.BUSINESS
          ? BUSINESS_ROUTES.PLACES
          : ADMIN_ROUTES.PLACES_PENDING,
    };
  }

  // 3. Doanh nghiệp / Hợp đồng
  if (type.includes("business") || type.includes("document") || metadata.businessId) {
    return {
      category: "business",
      label: "Doanh nghiệp",
      Icon: Store,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      badgeClass:
        "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
      route:
        currentRoleId === ROLES.BUSINESS
          ? BUSINESS_ROUTES.PROFILE
          : ADMIN_ROUTES.BUSINESS_LIST,
    };
  }

  // 4. Đánh giá
  if (type.includes("review") || metadata.reviewId) {
    return {
      category: "review",
      label: "Đánh giá",
      Icon: Star,
      iconBg: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400",
      badgeClass:
        "bg-yellow-50 text-yellow-700 border-yellow-200/60 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900/60",
      route:
        currentRoleId === ROLES.BUSINESS
          ? BUSINESS_ROUTES.REVIEWS
          : ADMIN_ROUTES.REVIEWS_MODERATION,
    };
  }

  // 5. Hệ thống / Mặc định
  return {
    category: "system",
    label: "Hệ thống",
    Icon: Bell,
    iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    route:
      currentRoleId === ROLES.BUSINESS
        ? BUSINESS_ROUTES.DASHBOARD
        : ADMIN_ROUTES.DASHBOARD,
  };
}

export function formatNotificationRelativeTime(value, locale = "vi-VN") {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 45) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Hôm qua";
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

/**
 * HeaderNotificationDropdown
 * Component hiển thị Popover thông báo chuẩn cao cấp dùng chung cho cả AdminHeader & BusinessHeader.
 */
export function HeaderNotificationDropdown({ triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread'
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { permission, isSubscribed, requestPermissionAndSubscribe } = useWebPush();

  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.readAt)
      : notifications;

  const handleItemClick = (notification) => {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }
    const meta = getNotificationMeta(notification, currentRoleId);
    setOpen(false);
    navigate(meta.route);
  };

  const handleQuickMarkRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate(ADMIN_ROUTES.NOTIFICATIONS);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("header.notifications", "Thông báo")}
          className={cn(
            "relative h-9 w-9 rounded-full transition-all duration-200",
            triggerClassName ||
              "hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300",
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-24px)] sm:w-[380px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl"
      >
        {/* Header bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {t("header.notifications", "Thông báo")}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                title={t("header.markAllRead", "Đánh dấu tất cả đã đọc")}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{t("header.markAllRead", "Đã đọc hết")}</span>
              </button>
            )}
          </div>

          {/* Tab Filter Switcher */}
          <div className="flex gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                activeTab === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                activeTab === "unread"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <ScrollArea className="max-h-[380px] divide-y divide-slate-100 dark:divide-slate-800/60">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <Bell className="h-6 w-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === "unread"
                  ? "Không có thông báo chưa đọc"
                  : t("header.noNotifications", "Chưa có thông báo nào")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                {activeTab === "unread"
                  ? "Bạn đã xử lý hết các thông báo quan trọng."
                  : t("header.noNotificationsDesc", "Mọi thông báo cập nhật đặt chỗ và vận hành sẽ xuất hiện tại đây.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {displayedNotifications.map((n) => {
                const unread = !n.readAt;
                const meta = getNotificationMeta(n, currentRoleId);
                const IconComponent = meta.Icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3.5 text-left transition-all cursor-pointer border-b border-slate-100/80 dark:border-slate-800/50 last:border-0",
                      unread
                        ? "bg-slate-50/90 hover:bg-slate-100/80 dark:bg-slate-800/30 dark:hover:bg-slate-800/60"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/20",
                    )}
                  >
                    {/* Icon loại thông báo */}
                    <div
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-2xl flex items-center justify-center mt-0.5",
                        meta.iconBg,
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={cn(
                            "text-[13px] leading-snug truncate",
                            unread
                              ? "font-bold text-slate-950 dark:text-slate-50"
                              : "font-medium text-slate-700 dark:text-slate-300",
                          )}
                        >
                          {n.title || t("header.notification", "Thông báo")}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message || n.body || ""}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {formatNotificationRelativeTime(
                            n.createdAt,
                            i18n.language === "vi" ? "vi-VN" : "en-US",
                          )}
                        </span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    {/* Dấu chỉ thị unread hoặc nút mark read nhanh khi hover */}
                    <div className="absolute right-3.5 top-4 flex items-center">
                      {unread ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-rose-500 group-hover:hidden" />
                          <button
                            type="button"
                            onClick={(e) => handleQuickMarkRead(e, n.id)}
                            title="Đánh dấu đã đọc"
                            className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Web Push Banner (tinh giản, kín đáo) */}
        {!isSubscribed && permission !== "denied" && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => requestPermissionAndSubscribe()}
              className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-slate-400" />
                {t("header.enableBrowserNotifications", "Bật thông báo trên máy tính")}
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Bật ngay</span>
            </button>
          </div>
        )}

        {/* Footer: View All Link */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="w-full justify-center h-8 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            {t("header.viewAllNotifications", "Mở trung tâm thông báo")}
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default HeaderNotificationDropdown;
