import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Check, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/Separator";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import { resolveRoleId } from "@/utils/authRouting";
import api from "@/constants/api";
import { cn } from "@/lib/utils";

const NOTIFICATION_LIMIT = 50;

const REVIEW_NOTIFICATION_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];

const normalizeNotification = (notification) => ({
  ...notification,
  message: notification.message || notification.body || "",
  body: notification.body || notification.message || "",
  metadata: notification.metadata || notification.data || {},
  readAt: notification.readAt || notification.read_at || null,
});

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

const resolveNotificationRoute = (notification, currentRoleId) => {
  const metadata = notification?.metadata || {};
  const type = String(metadata.type || "");

  if (REVIEW_NOTIFICATION_ROLES.includes(currentRoleId)) {
    if (type.includes("place") || metadata.placeId) {
      return { route: ADMIN_ROUTES.PLACES_PENDING, params: { placeId: metadata.placeId } };
    }
    if (type.includes("business") || metadata.businessId) {
      return { route: ADMIN_ROUTES.BUSINESS_LIST, params: { businessId: metadata.businessId } };
    }
    if (type.includes("review") || metadata.reviewId) {
      return { route: ADMIN_ROUTES.REVIEWS_MODERATION, params: { reviewId: metadata.reviewId } };
    }
    return { route: ADMIN_ROUTES.DASHBOARD, params: {} };
  }

  if (type.includes("booking") || metadata.bookingId) {
    return {
      route: BUSINESS_ROUTES.BOOKING_DETAIL(metadata.bookingId),
      params: { bookingId: metadata.bookingId },
    };
  }
  if (type.includes("place") || metadata.placeId) {
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

const getNotificationIcon = (type) => {
  const t = String(type || "");
  if (t.includes("booking")) return "📅";
  if (t.includes("place")) return "📍";
  if (t.includes("business")) return "🏪";
  if (t.includes("review")) return "⭐";
  if (t.includes("document")) return "📄";
  return "🔔";
};

const NotificationItem = ({ notification, onMarkRead, onNavigate, currentRoleId }) => {
  const unread = !notification.readAt;
  const { route, params } = resolveNotificationRoute(notification, currentRoleId);
  const icon = getNotificationIcon(notification.metadata?.type);

  const handleClick = () => {
    if (unread) {
      onMarkRead(notification.id);
    }
    onNavigate(route, params);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-gray-50 border-b border-gray-100 last:border-0 group",
        unread && "bg-blue-50/40 hover:bg-blue-50"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm mt-0.5">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(
            "text-[14px] font-semibold leading-tight line-clamp-1",
            unread ? "text-gray-900" : "text-gray-700"
          )}>
            {notification.title || "Thông báo"}
          </span>
          <div className="shrink-0 flex items-center gap-1.5">
            {unread && (
              <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
            )}
            <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
        </div>
        <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mt-0.5">
          {notification.message || notification.body || ""}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-gray-400 font-mono">
            {formatRelativeTime(notification.createdAt)}
          </span>
          {unread && (
            <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Nhấn để đọc
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "read" ? "read" : "unread"
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications", {
        params: {
          limit: NOTIFICATION_LIMIT,
          page: 1,
          ...(activeTab === "unread" ? { unreadOnly: "true" } : {}),
        },
      });
      const data = response?.data || response || [];
      const items = Array.isArray(data) ? data : [];
      const normalized = items.map(normalizeNotification);
      setNotifications(normalized);

      if (activeTab === "unread") {
        setUnreadCount(normalized.length);
      } else {
        const countResp = await api.get("/notifications/unread-count");
        setUnreadCount(countResp?.data?.unreadCount ?? 0);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // Optimistic UI
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.put("/notifications/mark-all-read");
    } catch {
      // Optimistic UI
    }
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const handleNavigate = useCallback((route, params) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const queryString = query.toString();
    navigate(`${route}${queryString ? `?${queryString}` : ""}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Thông báo</h1>
                <p className="text-[12px] text-gray-400">
                  {unreadCount > 0
                    ? `${unreadCount} chưa đọc`
                    : "Không có thông báo mới"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 text-[12px] border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Đọc hết
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchNotifications}
                disabled={loading}
                className="h-9 w-9 rounded-full hover:bg-gray-100"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("unread")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors",
                activeTab === "unread"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  activeTab === "unread" ? "bg-white/20" : "bg-red-500 text-white"
                )}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors",
                activeTab === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-[15px] font-semibold text-gray-400">
                {activeTab === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo"}
              </p>
              <p className="text-[12px] text-gray-300 text-center px-8">
                {activeTab === "unread"
                  ? "Tất cả thông báo đã được đọc. Thông báo mới sẽ xuất hiện ở đây."
                  : "Khi có thông báo từ booking, địa điểm hoặc hệ thống, bạn sẽ thấy ở đây."}
              </p>
              {activeTab === "unread" && unreadCount === 0 && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-2 text-[12px] text-blue-600 hover:underline font-medium"
                >
                  Xem tất cả thông báo
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onNavigate={handleNavigate}
                  currentRoleId={currentRoleId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
