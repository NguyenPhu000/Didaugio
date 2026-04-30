import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/query-keys";
import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../api/notificationApi";

const DEFAULT_PAGE_SIZE = 40;

export function useNotifications(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: QUERY_KEYS.notifications.list({ limit: DEFAULT_PAGE_SIZE }),
    queryFn: () =>
      getNotificationsApi({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
      }),
    enabled,
    select: (res) => ({
      items: res?.data || [],
      unreadCount: res?.unreadCount ?? 0,
      pagination: res?.pagination || null,
    }),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipientId) => markNotificationReadApi(recipientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all() });
    },
  });
}
