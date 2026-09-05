import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  ExternalLink,
  MapPin,
  RefreshCw,
  Star,
  Store,
  Filter,
} from "lucide-react";
import { notificationService } from "@/apis/notificationService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/constants/constants";
import { queryKeys } from "@/constants/query-keys";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { normalizeNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { resolveRoleId } from "@/utils/authRouting";
import { useTranslation } from "react-i18next";
import {
  getNotificationMeta,
  formatNotificationRelativeTime,
} from "@/components/common/HeaderNotificationDropdown";

const NOTIFICATION_LIMIT = 50;

const normalizeNotificationsResponse = (response) => {
  const data = response?.data || response || [];
  const items = Array.isArray(data) ? data.map((item) => normalizeNotification(item)) : [];
  return {
    items,
    unreadCount:
      Number(response?.unreadCount) || items.filter((item) => !item.readAt).length,
  };
};

function formatExactTime(value, locale = "vi-VN") {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeGroupKey(dateString) {
  if (!dateString) return "older";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "older";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.round((today - itemDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return "older";
}

const CATEGORY_TABS = [
  { id: "all", label: "Tất cả danh mục" },
  { id: "booking", label: "Đặt chỗ" },
  { id: "place", label: "Địa điểm" },
  { id: "business", label: "Doanh nghiệp" },
  { id: "review", label: "Đánh giá" },
  { id: "system", label: "Hệ thống" },
];

export const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);

  const [activeStatusTab, setActiveStatusTab] = useState(
    searchParams.get("tab") === "read" ? "all" : "unread",
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  const queryParams = useMemo(
    () => ({
      limit: NOTIFICATION_LIMIT,
      page: 1,
      ...(activeStatusTab === "unread" ? { unreadOnly: "true" } : {}),
    }),
    [activeStatusTab],
  );

  const listKey = queryKeys.notifications.list(queryParams);

  const notificationsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => notificationService.getNotifications(queryParams),
    select: normalizeNotificationsResponse,
    placeholderData: (previous) => previous,
    staleTime: 20 * 1000,
  });

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    select: (response) =>
      Number(response?.data?.unreadCount ?? response?.unreadCount ?? 0),
    staleTime: 20 * 1000,
  });

  const rawNotifications = notificationsQuery.data?.items || [];
  const unreadCount =
    unreadQuery.data ?? notificationsQuery.data?.unreadCount ?? 0;
  const loading = notificationsQuery.isLoading || notificationsQuery.isFetching;

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onMutate: (id) => {
      queryClient.setQueryData(listKey, (current) => {
        const normalized = normalizeNotificationsResponse(current);
        return {
          ...(current && typeof current === "object" ? current : {}),
          data: normalized.items.map((item) =>
            item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
          ),
          unreadCount: Math.max(0, normalized.unreadCount - 1),
        };
      });
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), (current) => {
        const currentCount = Number(current?.data?.unreadCount ?? current ?? unreadCount);
        return { data: { unreadCount: Math.max(0, currentCount - 1) } };
      });
    },
    onSettled: invalidateNotifications,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: () => {
      queryClient.setQueryData(listKey, (current) => {
        const normalized = normalizeNotificationsResponse(current);
        return {
          ...(current && typeof current === "object" ? current : {}),
          data:
            activeStatusTab === "unread"
              ? []
              : normalized.items.map((item) => ({
                  ...item,
                  readAt: item.readAt || new Date().toISOString(),
                })),
          unreadCount: 0,
        };
      });
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
        data: { unreadCount: 0 },
      });
    },
    onSettled: invalidateNotifications,
  });

  // Filter notifications by selected category
  const filteredNotifications = useMemo(() => {
    if (selectedCategory === "all") return rawNotifications;
    return rawNotifications.filter((n) => {
      const meta = getNotificationMeta(n, currentRoleId);
      return meta.category === selectedCategory;
    });
  }, [rawNotifications, selectedCategory, currentRoleId]);

  // Group notifications by Time
  const groupedNotifications = useMemo(() => {
    const groups = { today: [], yesterday: [], older: [] };
    filteredNotifications.forEach((item) => {
      const groupKey = getTimeGroupKey(item.createdAt);
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredNotifications]);

  const handleOpenItem = (notification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    const meta = getNotificationMeta(notification, currentRoleId);
    navigate(meta.route);
  };

  const handleQuickMarkRead = (e, id) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("notificationsPage.title", "Trung tâm thông báo")}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Theo dõi kịp thời các thông báo đặt chỗ, phê duyệt địa điểm và vận hành hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="h-8.5 px-3 rounded-full text-xs font-medium border-black/[0.08] dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("notificationsPage.markAllRead", "Đọc hết")}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={invalidateNotifications}
            disabled={loading}
            className="h-8.5 w-8.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Làm mới thông báo"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        {/* Status Switcher Tabs */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-black/[0.04] dark:border-white/[0.04]">
          <button
            type="button"
            onClick={() => setActiveStatusTab("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeStatusTab === "all"
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {t("notificationsPage.tabs.all", "Tất cả")}
          </button>
          <button
            type="button"
            onClick={() => setActiveStatusTab("unread")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeStatusTab === "unread"
                ? "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <span>{t("notificationsPage.tabs.unread", "Chưa đọc")}</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeStatusTab === "unread"
                    ? "bg-rose-500 text-white"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-black/[0.05] dark:border-white/[0.06]",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Content */}
      {loading && filteredNotifications.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-slate-900"
            >
              <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-slate-900">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <Bell className="h-8 w-8 stroke-[1.5]" />
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {activeStatusTab === "unread"
              ? "Không có thông báo chưa đọc"
              : "Hộp thông báo trống"}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
            {activeStatusTab === "unread"
              ? "Tuyệt vời! Bạn đã xem hết mọi thông báo và cập nhật mới nhất từ hệ thống."
              : "Các thông tin về đặt chỗ, xét duyệt địa điểm và hoạt động vận hành sẽ hiển thị tại đây."}
          </p>
          {activeStatusTab === "unread" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveStatusTab("all")}
              className="mt-5 rounded-full text-xs font-semibold px-4 h-8"
            >
              Xem tất cả thông báo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { key: "today", title: "Hôm nay", list: groupedNotifications.today },
            { key: "yesterday", title: "Hôm qua", list: groupedNotifications.yesterday },
            { key: "older", title: "Trước đó", list: groupedNotifications.older },
          ]
            .filter((g) => g.list.length > 0)
            .map((group) => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.title}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 dark:text-slate-700">
                    ({group.list.length})
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.list.map((notification) => {
                    const unread = !notification.readAt;
                    const meta = getNotificationMeta(notification, currentRoleId);
                    const IconComponent = meta.Icon;

                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleOpenItem(notification)}
                        className={cn(
                          "group relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer",
                          unread
                            ? "border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-black/[0.16] dark:hover:border-white/[0.2]"
                            : "border-black/[0.04] dark:border-white/[0.04] bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 hover:border-black/[0.09] dark:hover:border-white/[0.09]",
                        )}
                      >
                        {/* Icon đại diện */}
                        <div
                          className={cn(
                            "h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                            meta.iconBg,
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>

                        {/* Nội dung thông báo */}
                        <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "text-sm sm:text-base leading-snug",
                                unread
                                  ? "font-bold text-slate-950 dark:text-slate-50"
                                  : "font-semibold text-slate-700 dark:text-slate-300",
                              )}
                            >
                              {notification.title || t("notificationsPage.title", "Thông báo")}
                            </span>

                            {/* Category Badge */}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                                meta.badgeClass,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                            {notification.message || notification.body || ""}
                          </p>

                          <div className="flex items-center gap-3 mt-2.5">
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {formatNotificationRelativeTime(notification.createdAt, locale)}
                              {" · "}
                              {formatExactTime(notification.createdAt, locale)}
                            </span>
                          </div>
                        </div>

                        {/* Action Corner */}
                        <div className="absolute right-4 top-4 sm:top-5 flex items-center gap-1.5">
                          {unread && (
                            <>
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 group-hover:hidden" />
                              <button
                                type="button"
                                onClick={(e) => handleQuickMarkRead(e, notification.id)}
                                title="Đánh dấu đã đọc"
                                className="hidden group-hover:flex h-7 px-2.5 items-center gap-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-xs font-medium transition-colors"
                              >
                                <Check className="h-3 w-3" />
                                <span>Đã đọc</span>
                              </button>
                            </>
                          )}
                          <div className="hidden sm:flex h-7 w-7 items-center justify-center text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
