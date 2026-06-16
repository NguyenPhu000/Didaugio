import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import revenueService from "@/apis/revenueService";

const STALE_TIME = 5 * 60 * 1000;

/**
 * Revenue overview stats (GMV, net, fees, refunds + change %).
 */
export function useRevenueOverview(params = {}) {
  return useApiQuery(
    queryKeys.revenue.overview(params),
    () => revenueService.getRevenueOverview(params),
    { staleTime: STALE_TIME, placeholderData: (prev) => prev }
  );
}

/**
 * Revenue timeline for charts (daily/weekly/monthly).
 */
export function useRevenueTimeline(params = {}) {
  return useApiQuery(
    queryKeys.revenue.timeline(params),
    () => revenueService.getRevenueTimeline(params),
    { staleTime: STALE_TIME, placeholderData: (prev) => prev }
  );
}

/**
 * Revenue breakdown by place.
 */
export function useRevenueByPlace(params = {}) {
  return useApiQuery(
    queryKeys.revenue.byPlace(params),
    () => revenueService.getRevenueByPlace(params),
    { staleTime: STALE_TIME, placeholderData: (prev) => prev }
  );
}

/**
 * Paginated transaction list.
 */
export function useTransactions(params = {}) {
  return useApiQuery(
    queryKeys.revenue.transactions(params),
    () => revenueService.getTransactions(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Export revenue CSV mutation.
 */
export function useExportRevenue() {
  return useApiMutation(
    (params) => revenueService.exportRevenue(params),
    {
      onSuccess: (data) => {
        const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
    }
  );
}
