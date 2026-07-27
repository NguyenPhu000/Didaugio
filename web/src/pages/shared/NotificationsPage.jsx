import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  Check,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  Star,
  Store,
} from "lucide-react";
import { notificationService } from "@/apis/notificationService";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/constants/constants";
import { queryKeys } from "@/constants/query-keys";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { normalizeNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { resolveRoleId } from "@/utils/authRouting";

const NOTIFICATION_LIMIT = 50;
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

function formatRelativeTime(value) {
  if (!value) return "";
  const now = new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatTime(value);
}

const normalizeNotificationsResponse = (response) => {
  const data = response?.data || response || [];
  const items = Array.isArray(data) ? data.map((item) => normalizeNotification(item)) : [];
  return {
    items,
    unreadCount:
      Number(response?.unreadCount) || items.filter((item) => !item.readAt).length,
  };
};

const resolveNotificationRoute = (notification, currentRoleId) => {
  const metadata = notification?.metadata || {};
  const type = String(metadata.type || "");

  if (REVIEW_NOTIFICATION_ROLES.includes(currentRoleId)) {
    if (type.includes("place") || metadata.placeId) {
      return {
        route: ADMIN_ROUTES.PLACES_PENDING,
        params: { placeId: metadata.placeId },
      };
    }
    if (type.includes("business") || metadata.businessId) {
      return {
        route: ADMIN_ROUTES.BUSINESS_LIST,
        params: { businessId: metadata.businessId },
      };
    }
    if (type.includes("review") || metadata.reviewId) {
      return {
        route: ADMIN_ROUTES.REVIEWS_MODERATION,
        params: { reviewId: metadata.reviewId },
      };
    }
    return { route: ADMIN_ROUTES.DASHBOARD, params: {} };
  }

  if ((type.includes("booking") || metadata.bookingId) && metadata.bookingId) {
    return {
      route: BUSINESS_ROUTES.BOOKING_DETAIL(metadata.bookingId),
      params: { bookingId: metadata.bookingId },
    };
  }
  if ((type.includes("place") || metadata.placeId) && metadata.placeId) {
    return {
      route: BUSINESS_ROUTES.PLACES_EDIT(metadata.placeId),
      params: { placeId: metadata.placeId },
    };
  }
  if (type.includes("business") || type.includes("document") || metadata.businessId) {
    return {
      route: BUSINESS_ROUTES.PROFILE,
      params: { businessId: metadata.businessId },
    };
  }
  if (type.includes("review") || metadata.reviewId) {
    return { route: BUSINESS_ROUTES.REVIEWS, params: { reviewId: metadata.reviewId } };
  }
  return { route: BUSINESS_ROUTES.DASHBOARD, params: {} };
};

const getIconConfig = (type) => {
  const t = String(type || "");
  if (t.includes("booking")) return { Icon: CalendarCheck, className: "text-sky-700 bg-sky-50" };
  if (t.includes("place")) return { Icon: MapPin, className: "text-emerald-700 bg-emerald-50" };
  if (t.includes("business")) return { Icon: Store, className: "text-amber-700 bg-amber-50" };
  if (t.includes("review")) return { Icon: Star, className: "text-yellow-700 bg-yellow-50" };
  if (t.includes("document")) return { Icon: FileText, className: "text-violet-700 bg-violet-50" };
  return { Icon: Bell, className: "text-slate-700 bg-slate-100" };
};

const NotificationItem = ({ notification, onMarkRead, onNavigate, currentRoleId }) => {
  const unread = !notification.readAt;
  const { route, params } = resolveNotificationRoute(notification, currentRoleId);
  const { Icon, className } = getIconConfig(notification.metadata?.type);

  const handleClick = () => {
    if (unread) onMarkRead(notification.id);
    onNavigate(route, params);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 last:border-0",
        unread && "bg-sky-50/60 hover:bg-sky-50",
      )}
    >
      <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", className)}>
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "line-clamp-1 text-sm font-semibold leading-5",
              unread ? "text-slate-950" : "text-slate-700",
            )}
          >
            {notification.title || "Thông báo"}
          </span>
          <span className="flex shrink-0 items-center gap-2 pt-1">
            {unread && <span className="h-2 w-2 rounded-full bg-sky-600" />}
            <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500" />
          </span>
        </span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
          {notification.message || notification.body || ""}
        </span>
        <span className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
          {unread && (
            <span className="text-xs font-medium text-sky-700 opacity-0 transition group-hover:opacity-100">
              Đánh dấu đã đọc
            </span>
          )}
        </span>
      </span>
    </button>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "read" ? "all" : "unread",
  );

  const queryParams = useMemo(
    () => ({
      limit: NOTIFICATION_LIMIT,
      page: 1,
      ...(activeTab === "unread" ? { unreadOnly: "true" } : {}),
    }),
    [activeTab],
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

  const notifications = notificationsQuery.data?.items || [];
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
          data: normalized.items.filter((item) => item.id !== id),
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
            activeTab === "unread"
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

  const handleNavigate = useCallback(
    (route, params) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const queryString = query.toString();
      navigate(`${route}${queryString ? `?${queryString}` : ""}`);
    },
    [navigate],
  );

  const renderContent = () => {
    if (loading && notifications.length === 0) {
      return (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 px-4 py-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Bell className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            {activeTab === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo"}
          </p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            {activeTab === "unread"
              ? "Thông báo mới sẽ hiện ở đây và cập nhật ngay khi server gửi."
              : "Booking, địa điểm, doanh nghiệp và hệ thống sẽ được gom tại đây."}
          </p>
          {activeTab === "unread" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("all")}
              className="mt-3"
            >
              Xem tất cả
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={(id) => markReadMutation.mutate(id)}
            onNavigate={handleNavigate}
            currentRoleId={currentRoleId}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 shrink-0 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-950">Thông báo</h1>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Đã cập nhật"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="h-8 text-xs"
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Đọc hết
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={invalidateNotifications}
                disabled={loading}
                className="h-9 w-9 rounded-full"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                activeTab === "unread"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeTab === "unread" ? "bg-white/20" : "bg-sky-600 text-white",
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition",
                activeTab === "all"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default NotificationsPage;
