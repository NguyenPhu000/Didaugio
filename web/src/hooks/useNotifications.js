import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { notificationService } from "@/apis/notificationService";
import { ROLES } from "@/constants/constants";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/authStore";
import { connectSocket } from "@/utils/socket";
import { resolveRoleId } from "@/utils/authRouting";

const NOTIFICATION_LIMIT = 20;
const LIST_KEY = queryKeys.notifications.list({ limit: NOTIFICATION_LIMIT });

const resolveUserId = (user) => user?.userId || user?.id;

const canUseNotifications = (user) =>
  Boolean(resolveUserId(user) && resolveRoleId(user) < ROLES.GUEST);

export const normalizeNotification = (notification = {}) => ({
  ...notification,
  message: notification.message || notification.body || "",
  body: notification.body || notification.message || "",
  metadata: notification.metadata || notification.data || {},
  readAt: notification.readAt || notification.read_at || null,
});

export const normalizeNotificationsResponse = (response) => {
  const data = response?.data || response || [];
  const notifications = Array.isArray(data)
    ? data.map(normalizeNotification)
    : [];
  return {
    notifications,
    unreadCount:
      Number(response?.unreadCount) ||
      notifications.filter((item) => !item.readAt).length,
  };
};

const updateCachedList = (queryClient, updater) => {
  queryClient.setQueryData(LIST_KEY, (current) => {
    const normalized = normalizeNotificationsResponse(current);
    const next = updater(normalized);
    return {
      ...(current && typeof current === "object" ? current : {}),
      data: next.notifications,
      unreadCount: next.unreadCount,
    };
  });
};

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = resolveUserId(user);
  const enabled = canUseNotifications(user);

  const query = useQuery({
    queryKey: LIST_KEY,
    queryFn: () =>
      notificationService.getNotifications({ limit: NOTIFICATION_LIMIT }),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    select: normalizeNotificationsResponse,
  });

  const fetchNotifications = useCallback(() => {
    if (!enabled) return Promise.resolve();
    return queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all(),
    });
  }, [enabled, queryClient]);

  useEffect(() => {
    if (!enabled) {
      queryClient.removeQueries({ queryKey: queryKeys.notifications.all() });
    }
  }, [enabled, queryClient]);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = connectSocket();
    if (!socket) return undefined;

    if (!socket.connected) {
      socket.connect();
    }

    const handleNotification = (rawNotification) => {
      const notification = normalizeNotification(rawNotification);
      updateCachedList(queryClient, ({ notifications, unreadCount }) => {
        const withoutDuplicate = notifications.filter(
          (item) => item.id !== notification.id,
        );
        return {
          notifications: [notification, ...withoutDuplicate].slice(
            0,
            NOTIFICATION_LIMIT,
          ),
          unreadCount:
            unreadCount + (notification.readAt ? 0 : 1),
        };
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });

      sonnerToast(notification.title || "Thông báo mới", {
        description: notification.message || notification.body || "",
        duration: 5000,
      });
    };

    const handleAnnouncement = (rawAnnouncement) => {
      handleNotification({
        ...rawAnnouncement,
        metadata: { type: "announcement", ...(rawAnnouncement?.metadata || {}) },
      });
    };

    socket.off("notification", handleNotification);
    socket.off("announcement", handleAnnouncement);
    socket.on("notification", handleNotification);
    socket.on("announcement", handleAnnouncement);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("announcement", handleAnnouncement);
    };
  }, [accessToken, enabled, queryClient, userId]);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onMutate: (id) => {
      updateCachedList(queryClient, ({ notifications, unreadCount }) => {
        const target = notifications.find((item) => item.id === id);
        return {
          notifications: notifications.filter((item) => item.id !== id),
          unreadCount: Math.max(
            0,
            unreadCount - (target && !target.readAt ? 1 : 0),
          ),
        };
      });
    },
    onSettled: fetchNotifications,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: () => {
      updateCachedList(queryClient, ({ notifications }) => ({
        notifications: notifications.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    },
    onSettled: fetchNotifications,
  });

  const markAsRead = useCallback(
    (id) => {
      if (!id) return;
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const markAllAsRead = useCallback(() => {
    markAllMutation.mutate();
  }, [markAllMutation]);

  const unreadCount = query.data?.unreadCount || 0;

  return useMemo(
    () => {
      const notifications = query.data?.notifications || [];
      return {
        enabled,
        notifications,
        unreadCount,
        loading: query.isLoading || query.isFetching,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      };
    },
    [
      enabled,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      query.data?.notifications,
      query.isFetching,
      query.isLoading,
      unreadCount,
    ],
  );
};

export default useNotifications;
