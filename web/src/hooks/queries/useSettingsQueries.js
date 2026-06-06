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
