import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const adminAiService = vi.hoisted(() => ({
  getConfig: vi.fn(),
  getLogs: vi.fn(),
  getOverview: vi.fn(),
  publishConfig: vi.fn(),
  rollbackConfig: vi.fn(),
  saveDraft: vi.fn(),
  testConfig: vi.fn(),
  updateKillSwitch: vi.fn(),
}));

vi.mock("@/apis/adminAiService", () => ({
  adminAiService,
  default: adminAiService,
}));

import {
  adminAiKeys,
  useAdminAiConfig,
  useAdminAiLogs,
  useAdminAiOverview,
  usePublishAiConfig,
  useRollbackAiConfig,
  useSaveAiDraft,
  useTestAiConfig,
  useUpdateAiKillSwitch,
} from "@/hooks/queries/useAdminAiQueries";

function createQueryHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: 1 },
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
    },
  });

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return { queryClient, wrapper: Wrapper };
}

function seedAdminAiQueries(queryClient) {
  queryClient.setQueryData(adminAiKeys.config, { version: 1 });
  queryClient.setQueryData(adminAiKeys.overview, { totalRequests: 1 });
  queryClient.setQueryData(adminAiKeys.logs({ page: 1 }), { items: [] });
}

describe("admin AI query contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses stable keys and exact service arguments for read queries", async () => {
    const logParams = {
      page: 2,
      limit: 25,
      feature: "planner",
      status: "error",
      safetyBlocked: true,
      feedback: "down",
    };
    adminAiService.getOverview.mockResolvedValue({ totalRequests: 3 });
    adminAiService.getLogs.mockResolvedValue({ items: [], total: 0 });
    adminAiService.getConfig.mockResolvedValue({ version: 1 });
    const { queryClient, wrapper } = createQueryHarness();

    const overview = renderHook(() => useAdminAiOverview(), { wrapper });
    const logs = renderHook(() => useAdminAiLogs(logParams), { wrapper });
    const config = renderHook(() => useAdminAiConfig(), { wrapper });

    await waitFor(() => {
      expect(overview.result.current.isSuccess).toBe(true);
      expect(logs.result.current.isSuccess).toBe(true);
      expect(config.result.current.isSuccess).toBe(true);
    });

    expect(adminAiService.getOverview).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: adminAiKeys.overview }),
    );
    expect(adminAiService.getLogs).toHaveBeenCalledWith(logParams);
    expect(adminAiService.getConfig).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: adminAiKeys.config }),
    );
    expect(queryClient.getQueryData(adminAiKeys.overview)).toEqual({
      totalRequests: 3,
    });
    expect(queryClient.getQueryData(adminAiKeys.logs(logParams))).toEqual({
      items: [],
      total: 0,
    });
    expect(queryClient.getQueryData(adminAiKeys.config)).toEqual({
      version: 1,
    });
  });

  it("saving a draft invalidates config only", async () => {
    const payload = { mode: "safe" };
    adminAiService.saveDraft.mockResolvedValue({ version: 2 });
    const { queryClient, wrapper } = createQueryHarness();
    seedAdminAiQueries(queryClient);
    const { result } = renderHook(() => useSaveAiDraft(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(adminAiService.saveDraft).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(queryClient.getQueryState(adminAiKeys.config)?.isInvalidated).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(adminAiKeys.logs({ page: 1 }))?.isInvalidated,
    ).toBe(false);
    expect(queryClient.getQueryState(adminAiKeys.overview)?.isInvalidated).toBe(
      false,
    );
  });

  it("testing a draft invalidates the logs prefix only", async () => {
    const payload = { prompt: "test" };
    adminAiService.testConfig.mockResolvedValue({ output: "ok" });
    const { queryClient, wrapper } = createQueryHarness();
    seedAdminAiQueries(queryClient);
    const { result } = renderHook(() => useTestAiConfig(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(adminAiService.testConfig).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(
      queryClient.getQueryState(adminAiKeys.logs({ page: 1 }))?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(adminAiKeys.config)?.isInvalidated).toBe(
      false,
    );
    expect(queryClient.getQueryState(adminAiKeys.overview)?.isInvalidated).toBe(
      false,
    );
  });

  it("publishing invalidates config and overview", async () => {
    const payload = { version: 2 };
    adminAiService.publishConfig.mockResolvedValue({ published: true });
    const { queryClient, wrapper } = createQueryHarness();
    seedAdminAiQueries(queryClient);
    const { result } = renderHook(() => usePublishAiConfig(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(adminAiService.publishConfig).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(queryClient.getQueryState(adminAiKeys.config)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(adminAiKeys.overview)?.isInvalidated).toBe(
      true,
    );
  });

  it("rolling back invalidates config and overview", async () => {
    const payload = { version: 1 };
    adminAiService.rollbackConfig.mockResolvedValue({ rolledBack: true });
    const { queryClient, wrapper } = createQueryHarness();
    seedAdminAiQueries(queryClient);
    const { result } = renderHook(() => useRollbackAiConfig(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(adminAiService.rollbackConfig).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(queryClient.getQueryState(adminAiKeys.config)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(adminAiKeys.overview)?.isInvalidated).toBe(
      true,
    );
  });

  it("updating the kill switch invalidates overview only", async () => {
    const payload = { enabled: true, reason: "incident-42" };
    adminAiService.updateKillSwitch.mockResolvedValue({ enabled: true });
    const { queryClient, wrapper } = createQueryHarness();
    seedAdminAiQueries(queryClient);
    const { result } = renderHook(() => useUpdateAiKillSwitch(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(adminAiService.updateKillSwitch).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(queryClient.getQueryState(adminAiKeys.overview)?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(adminAiKeys.config)?.isInvalidated).toBe(
      false,
    );
  });

  it.each([
    ["save draft", useSaveAiDraft, "saveDraft"],
    ["test configuration", useTestAiConfig, "testConfig"],
    ["publish", usePublishAiConfig, "publishConfig"],
    ["rollback", useRollbackAiConfig, "rollbackConfig"],
    ["kill switch", useUpdateAiKillSwitch, "updateKillSwitch"],
  ])(
    "never retries the %s mutation after a 409 under production defaults",
    async (_label, useMutationHook, serviceMethod) => {
      const conflict = {
        status: 409,
        data: {
          errorCode: "AI_CONFIG_CONFLICT",
          currentRevision: 9,
        },
      };
      adminAiService[serviceMethod].mockRejectedValue(conflict);
      const { wrapper } = createQueryHarness();
      const { result } = renderHook(() => useMutationHook(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync({})).rejects.toBe(conflict);
      });

      expect(adminAiService[serviceMethod]).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["save draft", useSaveAiDraft, "saveDraft"],
    ["test configuration", useTestAiConfig, "testConfig"],
    ["publish", usePublishAiConfig, "publishConfig"],
    ["rollback", useRollbackAiConfig, "rollbackConfig"],
    ["kill switch", useUpdateAiKillSwitch, "updateKillSwitch"],
  ])(
    "never retries the %s mutation after a non-conflict failure under production defaults",
    async (_label, useMutationHook, serviceMethod) => {
      const failure = Object.assign(new Error("provider unavailable"), {
        status: 503,
        data: { errorCode: "AI_PROVIDER_UNAVAILABLE" },
      });
      adminAiService[serviceMethod].mockRejectedValue(failure);
      const { wrapper } = createQueryHarness();
      const { result } = renderHook(() => useMutationHook(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync({})).rejects.toBe(failure);
      });

      expect(adminAiService[serviceMethod]).toHaveBeenCalledTimes(1);
    },
  );
});
