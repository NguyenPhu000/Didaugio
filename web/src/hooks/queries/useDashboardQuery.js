import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "./useApiQuery";
import { queryKeys } from "@/constants/query-keys";
import { dashboardService } from "@/apis/dashboardService";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const THIRTY_SECONDS = 30_000;
const SIXTY_SECONDS = 60_000;
const FIVE_MINUTES = 5 * 60_000;

/**
 * Dashboard statistics — refetch on window focus, cache 60s.
 */
export function useDashboardStats() {
  return useApiQuery(
    queryKeys.dashboard.stats(),
    () => dashboardService.getStats(),
    {
      staleTime: SIXTY_SECONDS,
      refetchOnWindowFocus: true,
    },
  );
}

/**
 * Dashboard timeline — cache 5 min (rarely changes).
 */
export function useDashboardTimeline() {
  return useApiQuery(
    queryKeys.dashboard.all(),
    () => dashboardService.getTimeline(),
    { staleTime: FIVE_MINUTES },
  );
}

/**
 * System health — poll every 30s only when tab visible.
 */
export function useDashboardHealth() {
  return useApiQuery(
    queryKeys.dashboard.health(),
    () => dashboardService.getHealth(),
    {
      refetchInterval: THIRTY_SECONDS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      staleTime: THIRTY_SECONDS,
    },
  );
}

/**
 * Online users — Socket.IO push for count, polling 60s for user details.
 * Count updates instantly via socket, full list refreshes periodically.
 */
export function useDashboardOnlineUsers() {
  const queryClient = useQueryClient();
  const [realtimeCount, setRealtimeCount] = useState(null);

  // Socket.IO: instant count push from server
  useSocketEvent("admin:online-count", useCallback((data) => {
    setRealtimeCount(data.count);
    // Invalidate to refetch full user list on count change
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.onlineUsers() });
  }, [queryClient]));

  const query = useApiQuery(
    queryKeys.dashboard.onlineUsers(),
    () => dashboardService.getOnlineUsers(),
    {
      refetchInterval: SIXTY_SECONDS,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      staleTime: SIXTY_SECONDS,
    },
  );

  // Merge: prefer real-time count from socket, fallback to API data
  const payload = query.data?.success === true ? query.data.data : query.data;
  const mergedData = payload
    ? {
        ...payload,
        count: realtimeCount ?? payload.count ?? 0,
      }
    : null;

  return { ...query, data: mergedData, realtimeCount };
}
