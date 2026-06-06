import { useApiQuery } from "./useApiQuery";
import { queryKeys } from "@/constants/query-keys";
import { dashboardService } from "@/apis/dashboardService";

/**
 * Dashboard statistics query.
 */
export function useDashboardStats() {
  return useApiQuery(queryKeys.dashboard.stats(), () =>
    dashboardService.getStats()
  );
}

/**
 * Dashboard timeline query.
 */
export function useDashboardTimeline() {
  return useApiQuery(queryKeys.dashboard.all(), () =>
    dashboardService.getTimeline()
  );
}
