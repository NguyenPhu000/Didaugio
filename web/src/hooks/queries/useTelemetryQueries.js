import { queryKeys } from "@/constants/query-keys";
import telemetryService from "@/apis/telemetryService";
import { useApiQuery } from "./useApiQuery";

const HEATMAP_STALE_TIME = 60 * 1000;

export function useAdminPlaceHeatmap(params = {}) {
  return useApiQuery(
    queryKeys.analytics.adminPlaceHeatmap(params),
    () => telemetryService.getAdminHeatmap(params),
    { staleTime: HEATMAP_STALE_TIME },
  );
}

export function useBusinessPlaceHeatmap(params = {}) {
  return useApiQuery(
    queryKeys.analytics.businessPlaceHeatmap(params),
    () => telemetryService.getBusinessHeatmap(params),
    { staleTime: HEATMAP_STALE_TIME },
  );
}
