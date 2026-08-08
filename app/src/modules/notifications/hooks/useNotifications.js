import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/query-keys";
import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../api/notificationApi";

const DEFAULT_PAGE_SIZE = 40;

export function useNotifications(options = {}) {
  const { enabled = true, unreadOnly = false } = options;
  const filters = {
    limit: DEFAULT_PAGE_SIZE,
    unreadOnly: unreadOnly || undefined,
  };

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      getNotificationsApi({
        page: pageParam,
        ...filters,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      return pagination && pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined;
    },
    enabled,
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
