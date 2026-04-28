import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "@/constants/api";
import { ROLES } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket } from "@/utils/socket";

const NOTIFICATION_LIMIT = 20;

const canUseNotifications = (user) =>
  Boolean(user?.userId && user.roleId && user.roleId < ROLES.GUEST);

const normalizeNotificationsResponse = (response) => {
  const data = response?.data || response || [];
  return {
    notifications: Array.isArray(data) ? data : [],
    unreadCount: Number(response?.unreadCount) || 0,
  };
};

const normalizeNotification = (notification) => ({
  ...notification,
  message: notification.message || notification.body || "",
  metadata: notification.metadata || notification.data || {},
});

export const useNotifications = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const enabled = canUseNotifications(user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/notifications", {
        params: { limit: NOTIFICATION_LIMIT },
      });
      const result = normalizeNotificationsResponse(response);
      const normalized = result.notifications.map(normalizeNotification);
      setNotifications(normalized);
      setUnreadCount(
        result.unreadCount || normalized.filter((item) => !item.readAt).length,
      );
    } catch {
      // Notifications are non-critical; keep the header usable.
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = connectSocket();
    if (!socket) return undefined;

    if (!socket.connected) {
      socket.connect();
    }

    const handleNotification = (rawNotification) => {
      const notification = normalizeNotification(rawNotification);
      setNotifications((prev) => {
        const withoutDuplicate = prev.filter((item) => item.id !== notification.id);
        return [notification, ...withoutDuplicate].slice(0, NOTIFICATION_LIMIT);
      });
      setUnreadCount((prev) => prev + 1);

      toast.custom((toastState) =>
        createElement(
          "div",
          {
            className: `${toastState.visible ? "animate-enter" : "animate-leave"} max-w-sm border border-black bg-white px-4 py-3 font-mono shadow-lg`,
          },
          createElement(
            "p",
            { className: "text-xs font-bold uppercase" },
            notification.title,
          ),
          createElement(
            "p",
            { className: "mt-0.5 text-[11px] text-gray-600" },
            notification.message,
          ),
        ),
        { duration: 6000, position: "top-right" },
      );
    };

    socket.off("notification", handleNotification);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [accessToken, enabled, user?.userId]);

  const markAsRead = useCallback(async (id) => {
    if (!id) return;
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // Optimistic UI still removes the item from the unread dropdown.
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/mark-all-read");
    } catch {
      // Keep local state in sync with the user's action even if request races.
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: new Date() })));
    setUnreadCount(0);
  }, []);

  return useMemo(
    () => ({
      enabled,
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      enabled,
      fetchNotifications,
      loading,
      markAllAsRead,
      markAsRead,
      notifications,
      unreadCount,
    ],
  );
};

export default useNotifications;
