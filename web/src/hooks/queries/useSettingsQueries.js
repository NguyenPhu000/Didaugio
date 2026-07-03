import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import settingsService from "@/apis/settingsService";

/**
 * Fetch settings.
 */
export function useSettings() {
  return useApiQuery(queryKeys.settings.all(), () =>
    settingsService.getSettings()
  );
}

/**
 * Update settings mutation.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => settingsService.updateSettings(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.settings.all()]);
    },
  });
}

/**
 * Fetch feature flags.
 */
export function useFeatureFlags() {
  return useApiQuery(
    queryKeys.settings.featureFlags(),
    () => settingsService.getFeatureFlags(),
    {
      staleTime: 30_000,
    }
  );
}

/**
 * Toggle a feature flag.
 */
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ key, enabled }) => settingsService.updateFeatureFlag(key, enabled),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [
          queryKeys.settings.featureFlags(),
          queryKeys.settings.all(),
        ]);
      },
    }
  );
}

/**
 * Fetch system logs (paginated).
 */
export function useSystemLogs(params = {}) {
  return useApiQuery(
    queryKeys.settings.systemLogs(params),
    () => settingsService.getSystemLogs(params),
    {
      keepPreviousData: true,
    }
  );
}

/**
 * Fetch system health status.
 */
export function useSystemHealth() {
  return useApiQuery(
    queryKeys.settings.systemHealth(),
    () => settingsService.getSystemHealth(),
    {
      refetchInterval: 60_000,
      staleTime: 30_000,
    }
  );
}
