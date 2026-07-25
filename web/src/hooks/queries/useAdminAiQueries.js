import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import adminAiService from "@/apis/adminAiService";

const adminAiKeys = {
  overview: ["admin-ai", "overview"],
  config: ["admin-ai", "config"],
  logsRoot: ["admin-ai", "logs"],
  logs: (params) => ["admin-ai", "logs", params],
};
const EMPTY_LOG_PARAMS = Object.freeze({});

const invalidate = (queryClient, keys) =>
  Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));

export function useAdminAiOverview() {
  return useQuery({
    queryKey: adminAiKeys.overview,
    queryFn: adminAiService.getOverview,
  });
}

export function useAdminAiConfig() {
  return useQuery({
    queryKey: adminAiKeys.config,
    queryFn: adminAiService.getConfig,
  });
}

export function useSaveAiDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAiService.saveDraft,
    retry: false,
    onSuccess: () => invalidate(queryClient, [adminAiKeys.config]),
  });
}

export function useTestAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAiService.testConfig,
    retry: false,
    onSuccess: () => invalidate(queryClient, [adminAiKeys.logsRoot]),
  });
}

export function usePublishAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAiService.publishConfig,
    retry: false,
    onSuccess: () => invalidate(queryClient, [adminAiKeys.config, adminAiKeys.overview]),
  });
}

export function useRollbackAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAiService.rollbackConfig,
    retry: false,
    onSuccess: () => invalidate(queryClient, [adminAiKeys.config, adminAiKeys.overview]),
  });
}

export function useUpdateAiKillSwitch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminAiService.updateKillSwitch,
    retry: false,
    onSuccess: () => invalidate(queryClient, [adminAiKeys.overview]),
  });
}

export function useAdminAiLogs(params = EMPTY_LOG_PARAMS) {
  return useQuery({
    queryKey: adminAiKeys.logs(params),
    queryFn: () => adminAiService.getLogs(params),
    placeholderData: (previousData) => previousData,
  });
}

export { adminAiKeys };
