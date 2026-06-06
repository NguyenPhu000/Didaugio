import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import { notificationService } from "@/apis/notificationService";

/**
 * Fetch all notifications with filters.
 */
export function useNotifications(params = {}) {
  return useApiQuery(
    queryKeys.notifications.list(params),
    () => notificationService.getNotifications(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch unread notification count.
 */
export function useUnreadNotificationCount() {
  return useApiQuery(
    queryKeys.notifications.unreadCount(),
    () => notificationService.getUnreadCount(),
    { refetchInterval: 60 * 1000 } // poll every minute
  );
}

/**
 * Mark notification as read mutation.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => notificationService.markAsRead(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.notifications.all()]);
    },
  });
}

/**
 * Mark all notifications as read mutation.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useApiMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.notifications.all()]);
    },
  });
}

/**
 * Delete notification mutation.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => notificationService.deleteNotification(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.notifications.all()]);
    },
  });
}
