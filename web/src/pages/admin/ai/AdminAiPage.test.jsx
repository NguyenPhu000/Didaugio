import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAiPage from "./AdminAiPage";

const mocks = vi.hoisted(() => ({
  permissions: new Set(),
  overviewResult: {},
  logsResult: {},
  configResult: {},
  saveDraftMutation: {},
  testConfigMutation: {},
  publishMutation: {},
  rollbackMutation: {},
  killSwitchMutation: {},
  useAdminAiOverview: vi.fn(),
  useAdminAiLogs: vi.fn(),
  useAdminAiConfig: vi.fn(),
  useSaveAiDraft: vi.fn(),
  useTestAiConfig: vi.fn(),
  usePublishAiConfig: vi.fn(),
  useRollbackAiConfig: vi.fn(),
  useUpdateAiKillSwitch: vi.fn(),
}));

vi.mock("@/hooks/usePermission", () => ({
  usePermission: () => ({
    hasPermission: (permission) => mocks.permissions.has(permission),
  }),
}));

vi.mock("@/hooks/queries/useAdminAiQueries", () => ({
  useAdminAiOverview: (...args) => mocks.useAdminAiOverview(...args),
  useAdminAiLogs: (...args) => mocks.useAdminAiLogs(...args),
  useAdminAiConfig: (...args) => mocks.useAdminAiConfig(...args),
  useSaveAiDraft: (...args) => mocks.useSaveAiDraft(...args),
  useTestAiConfig: (...args) => mocks.useTestAiConfig(...args),
  usePublishAiConfig: (...args) => mocks.usePublishAiConfig(...args),
  useRollbackAiConfig: (...args) => mocks.useRollbackAiConfig(...args),
  useUpdateAiKillSwitch: (...args) => mocks.useUpdateAiKillSwitch(...args),
}));

const overview = {
  runtime: {
    status: "active",
    provider: "groq",
    model: "llama-4-scout",
    version: 4,
  },
  totals: {
    requests: 20,
    inputTokens: 100,
    outputTokens: 60,
    successRate: 95,
    safetyBlocks: 1,
    negativeFeedback: 2,
  },
  latency: { averageMs: 900, p95Ms: 1500 },
  timeline: [],
};

const adminAiConfig = {
  revision: 4,
  providerCredential: { configured: true, suffix: "1234" },
  activeVersion: { version: 3 },
  draftVersion: {
    version: 4,
    configData: {
      provider: {
        adapter: "groq",
        baseUrl: "https://api.groq.com",
        model: "llama-4-scout",
        secretReference: "groq-primary",
      },
      modelParameters: {
        temperature: 0.3,
        topP: 0.9,
        maxTokens: 2000,
        timeoutMs: 15000,
      },
      prompts: {
        chat: "Chat prompt",
        planner: "Planner prompt",
        voice: "Voice prompt",
      },
      context: {
        enabledSources: ["coarseLocation"],
        fieldAllowlist: ["currentCity"],
        maxTokens: 1000,
        freshnessTtl: 300,
      },
      safety: {
        blockedKeywords: [],
        matchMode: "substring",
        diacriticInsensitive: false,
        safeResponse: "Yêu cầu này không thể được xử lý.",
      },
      quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
      fallback: {
        maintenanceMessage: "AI đang bảo trì.",
        staticPlannerEnabled: true,
      },
    },
  },
  versions: [
    { version: 4, status: "draft" },
    { version: 3, status: "published" },
    { version: 2, status: "archived" },
  ],
};

describe("AdminAiPage", () => {
  beforeEach(() => {
    mocks.permissions = new Set([
      "ai.view",
      "ai.config.manage",
      "ai.config.publish",
      "ai.secrets.manage",
      "ai.logs.view",
      "ai.test.run",
      "ai.kill_switch.manage",
    ]);
    mocks.overviewResult = {
      data: { success: true, data: overview },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    mocks.logsResult = {
      data: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    mocks.configResult = {
      data: { success: true, data: adminAiConfig },
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    };
    mocks.saveDraftMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
    };
    mocks.testConfigMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    };
    mocks.publishMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
    };
    mocks.rollbackMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
    };
    mocks.killSwitchMutation = {
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isPending: false,
      error: null,
    };
    mocks.useAdminAiOverview.mockReset();
    mocks.useAdminAiOverview.mockImplementation(() => mocks.overviewResult);
    mocks.useAdminAiLogs.mockReset();
    mocks.useAdminAiLogs.mockImplementation(() => mocks.logsResult);
    mocks.useAdminAiConfig.mockReset();
    mocks.useAdminAiConfig.mockImplementation(() => mocks.configResult);
    mocks.useSaveAiDraft.mockReset();
    mocks.useSaveAiDraft.mockImplementation(() => mocks.saveDraftMutation);
    mocks.useTestAiConfig.mockReset();
    mocks.useTestAiConfig.mockImplementation(
      () => mocks.testConfigMutation,
    );
    mocks.usePublishAiConfig.mockReset();
    mocks.usePublishAiConfig.mockImplementation(
      () => mocks.publishMutation,
    );
    mocks.useRollbackAiConfig.mockReset();
    mocks.useRollbackAiConfig.mockImplementation(
      () => mocks.rollbackMutation,
    );
    mocks.useUpdateAiKillSwitch.mockReset();
    mocks.useUpdateAiKillSwitch.mockImplementation(
      () => mocks.killSwitchMutation,
    );
  });

  it("shows a text-labeled operational state and five accessible sections", () => {
    render(<AdminAiPage />);

    expect(screen.getByRole("heading", { name: "AI Operations" })).toBeInTheDocument();
    expect(screen.getByText("AI đang hoạt động")).toBeInTheDocument();
    expect(screen.getByText("llama-4-scout")).toBeInTheDocument();
    const primarySignals = screen.getByRole("group", {
      name: "Tín hiệu vận hành chính",
    });
    expect(within(primarySignals).getByText("20")).toBeInTheDocument();
    expect(within(primarySignals).getByText("95%")).toBeInTheDocument();
    const performanceSignals = screen.getByRole("group", {
      name: "Mức sử dụng và hiệu năng",
    });
    for (const label of [
      "Tổng token",
      "Latency trung bình",
      "Latency P95",
    ]) {
      expect(within(performanceSignals).getByText(label)).toBeInTheDocument();
    }
    const exceptions = screen.getByRole("group", {
      name: "Ngoại lệ cần theo dõi",
    });
    expect(within(exceptions).getByText("Safety blocks")).toBeInTheDocument();
    expect(
      within(exceptions).getByText("Feedback tiêu cực"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Lưu lượng theo ngày")).not.toBeInTheDocument();

    for (const label of [
      "Tổng quan",
      "Cấu hình",
      "An toàn",
      "Logs & Feedback",
      "Test Lab",
    ]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }

    expect(screen.getByRole("tab", { name: "Tổng quan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tabpanel", { name: "Tổng quan" }),
    ).toBeInTheDocument();
  });

  it("keeps each usage metric term and value directly grouped in its description list", () => {
    render(<AdminAiPage />);

    const performanceSignals = screen.getByRole("group", {
      name: "Mức sử dụng và hiệu năng",
    });
    expect(performanceSignals.tagName).toBe("DL");

    const metricRows = Array.from(performanceSignals.children);
    expect(metricRows).toHaveLength(3);
    for (const row of metricRows) {
      expect(Array.from(row.children, (child) => child.tagName)).toEqual([
        "DT",
        "DD",
      ]);
    }
  });

  it("disables unauthorized sections and never mounts the logs query", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view"]);

    render(<AdminAiPage />);

    const logsTab = screen.getByRole("tab", { name: "Logs & Feedback" });
    expect(screen.getByRole("tab", { name: "Tổng quan" })).toBeEnabled();
    expect(screen.getByRole("tab", { name: "Cấu hình" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "An toàn" })).toBeDisabled();
    expect(logsTab).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Test Lab" })).toBeDisabled();
    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();
    expect(mocks.useAdminAiConfig).not.toHaveBeenCalled();
    expect(mocks.useSaveAiDraft).not.toHaveBeenCalled();
    expect(mocks.useTestAiConfig).not.toHaveBeenCalled();
    expect(mocks.useUpdateAiKillSwitch).not.toHaveBeenCalled();

    await user.click(logsTab);

    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();
    expect(screen.queryByText("Metadata yêu cầu")).not.toBeInTheDocument();
  });

  it("does not mount AI queries for a direct visitor without module access", () => {
    mocks.permissions = new Set();

    render(<AdminAiPage />);

    expect(mocks.useAdminAiOverview).not.toHaveBeenCalled();
    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();
    expect(mocks.useAdminAiConfig).not.toHaveBeenCalled();
    expect(mocks.useSaveAiDraft).not.toHaveBeenCalled();
    expect(mocks.useTestAiConfig).not.toHaveBeenCalled();
    expect(mocks.usePublishAiConfig).not.toHaveBeenCalled();
    expect(mocks.useRollbackAiConfig).not.toHaveBeenCalled();
    expect(mocks.useUpdateAiKillSwitch).not.toHaveBeenCalled();
    expect(screen.getByText("Bạn không có quyền truy cập AI Control Center")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("mounts permitted logs on demand with metadata-only columns", async () => {
    const user = userEvent.setup();
    mocks.logsResult = {
      data: {
        success: true,
        data: {
          items: [
            {
              requestId: "req-public-reference",
              feature: "chat",
              provider: "groq",
              model: "llama-4-scout",
              configVersion: 4,
              inputTokens: 120,
              outputTokens: 48,
              latencyMs: 870,
              status: "success",
              errorCode: null,
              safetyBlocked: false,
              feedback: "up",
              createdAt: "2026-07-24T10:15:00.000Z",
              prompt: "RAW PROMPT MUST STAY HIDDEN",
              response: "RAW RESPONSE MUST STAY HIDDEN",
              exactLocation: "10.7769,106.7009",
              email: "private@example.com",
              phone: "0900000000",
              internalUserId: 991,
            },
          ],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };

    render(<AdminAiPage />);
    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();

    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));

    for (const column of [
      "Thời gian",
      "Tính năng",
      "Provider / Model",
      "Token",
      "Latency",
      "Trạng thái",
      "Safety",
      "Feedback",
    ]) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByText("llama-4-scout").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thành công").length).toBeGreaterThan(0);
    expect(screen.queryByText("RAW PROMPT MUST STAY HIDDEN")).not.toBeInTheDocument();
    expect(screen.queryByText("RAW RESPONSE MUST STAY HIDDEN")).not.toBeInTheDocument();
    expect(screen.queryByText("10.7769,106.7009")).not.toBeInTheDocument();
    expect(screen.queryByText("private@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("0900000000")).not.toBeInTheDocument();
    expect(screen.queryByText("991")).not.toBeInTheDocument();
    const logsRegion = screen.getByRole("region", {
      name: "Metadata yêu cầu",
    });
    expect(logsRegion).toHaveClass("border", "bg-card");
    expect(logsRegion.querySelectorAll(".border.bg-card")).toHaveLength(0);
  });

  it("serializes every designed filter against Vietnam calendar boundaries", async () => {
    const user = userEvent.setup();
    mocks.logsResult = {
      data: {
        success: true,
        data: {
          items: [
            {
              requestId: "req-1",
              feature: "planner",
              provider: "groq",
              model: "llama",
              configVersion: 4,
              inputTokens: 10,
              outputTokens: 20,
              latencyMs: 500,
              status: "success",
              errorCode: null,
              safetyBlocked: false,
              feedback: null,
              createdAt: "2026-07-24T10:15:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 25, total: 30, totalPages: 2 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));
    fireEvent.change(screen.getByLabelText("Từ ngày"), {
      target: { value: "2026-07-25" },
    });
    fireEvent.change(screen.getByLabelText("Đến ngày"), {
      target: { value: "2026-07-25" },
    });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tính năng" }),
      "planner",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái" }),
      "error",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Safety" }),
      "true",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Feedback" }),
      "down",
    );

    expect(mocks.useAdminAiLogs).toHaveBeenLastCalledWith({
      page: 1,
      limit: 25,
      feature: "planner",
      status: "error",
      safetyBlocked: true,
      feedback: "down",
      from: "2026-07-24T17:00:00.000Z",
      to: "2026-07-25T16:59:59.999Z",
    });

    await user.click(screen.getByRole("button", { name: "Trang sau" }));

    expect(mocks.useAdminAiLogs).toHaveBeenLastCalledWith({
      page: 2,
      limit: 25,
      feature: "planner",
      status: "error",
      safetyBlocked: true,
      feedback: "down",
      from: "2026-07-24T17:00:00.000Z",
      to: "2026-07-25T16:59:59.999Z",
    });
  });

  it("displays timestamps in Vietnam time across the local midnight boundary", async () => {
    const user = userEvent.setup();
    mocks.logsResult = {
      data: {
        success: true,
        data: {
          items: [
            {
              requestId: "req-midnight",
              feature: "chat",
              provider: "groq",
              model: "llama",
              configVersion: 4,
              inputTokens: 10,
              outputTokens: 20,
              latencyMs: 500,
              status: "success",
              errorCode: null,
              safetyBlocked: false,
              feedback: null,
              createdAt: "2026-07-24T18:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));

    expect(screen.getAllByText("01:00:00 25/7/26").length).toBeGreaterThan(0);
  });

  it("renders unavailable token measurements as em dashes", async () => {
    const user = userEvent.setup();
    mocks.logsResult = {
      data: {
        success: true,
        data: {
          items: [
            {
              requestId: "req-no-token-metadata",
              feature: "chat",
              provider: "groq",
              model: "llama",
              configVersion: 4,
              inputTokens: null,
              outputTokens: null,
              latencyMs: null,
              status: "started",
              errorCode: null,
              safetyBlocked: false,
              feedback: null,
              createdAt: "2026-07-24T10:15:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));

    expect(screen.getAllByText("— in / — out").length).toBeGreaterThan(0);
    expect(screen.queryByText("0 in / 0 out")).not.toBeInTheDocument();
  });

  it("isolates overview and logs error states with working retry actions", async () => {
    const user = userEvent.setup();
    const retryOverview = vi.fn();
    const retryLogs = vi.fn();
    mocks.overviewResult = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: retryOverview,
    };
    mocks.logsResult = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: retryLogs,
    };

    render(<AdminAiPage />);

    expect(screen.getByText("Không đọc được trạng thái AI")).toBeInTheDocument();
    expect(screen.getByText("Không tải được dữ liệu vận hành")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(retryOverview).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));
    expect(screen.getByText("Không tải được metadata logs")).toBeInTheDocument();
    const logsRegion = screen.getByRole("region", {
      name: "Metadata yêu cầu",
    });
    expect(logsRegion).toHaveClass("border", "bg-card");
    expect(logsRegion.querySelectorAll(".border.bg-card")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Tải lại logs" }));
    expect(retryLogs).toHaveBeenCalledOnce();
  });

  it("shows an empty logs state and disabled pagination controls", async () => {
    const user = userEvent.setup();

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));

    expect(screen.getByText("Chưa có metadata log")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trang trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Trang sau" })).toBeDisabled();
  });

  it("announces overview and logs loading states and exposes busy panels", async () => {
    const user = userEvent.setup();
    mocks.overviewResult = {
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    };
    mocks.logsResult = {
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    };

    render(<AdminAiPage />);

    expect(
      screen.getByRole("status", { name: "Đang tải trạng thái AI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Đang tải tổng quan AI" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Logs & Feedback" }));

    expect(
      screen.getByRole("region", { name: "Metadata yêu cầu" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("status", { name: "Đang tải metadata logs" }),
    ).toBeInTheDocument();
  });

  it("surfaces a newer revision after 409 and reloads without retrying the draft", async () => {
    const user = userEvent.setup();
    mocks.saveDraftMutation.mutateAsync.mockRejectedValueOnce({
      status: 409,
      data: {
        errorCode: "AI_CONFIG_CONFLICT",
        currentRevision: 9,
      },
    });

    render(<AdminAiPage />);
    expect(mocks.useAdminAiConfig).not.toHaveBeenCalled();

    await user.click(screen.getByRole("tab", { name: "Cấu hình" }));
    expect(mocks.useAdminAiConfig).toHaveBeenCalledOnce();
    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Cập nhật prompt",
    );
    await user.click(screen.getByRole("button", { name: "Lưu draft" }));

    expect(
      await screen.findByText("Có revision mới hơn: 9"),
    ).toBeInTheDocument();
    expect(mocks.saveDraftMutation.mutateAsync).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reload revision" }));
    await waitFor(() => expect(mocks.configResult.refetch).toHaveBeenCalledOnce());
    expect(mocks.saveDraftMutation.mutateAsync).toHaveBeenCalledOnce();
  });

  it("lets a draft manager save but exposes no secret, publish, rollback, or test calls", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view", "ai.config.manage"]);

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Cấu hình" }));

    expect(screen.queryByLabelText("API key mới")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Phát hành" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rollback" }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Chỉnh prompt chat",
    );
    await user.click(screen.getByRole("button", { name: "Lưu draft" }));

    expect(mocks.saveDraftMutation.mutateAsync).toHaveBeenCalledOnce();
    expect(mocks.publishMutation.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.rollbackMutation.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.testConfigMutation.mutateAsync).not.toHaveBeenCalled();
    expect(mocks.killSwitchMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("routes publish and rollback through guarded version dialogs", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view", "ai.config.publish"]);

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Cấu hình" }));
    expect(
      screen.queryByRole("button", { name: "Lưu draft" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Phát hành" }));
    await user.type(
      screen.getByLabelText("Lý do phát hành"),
      "Draft đã kiểm thử",
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận phát hành" }),
    );
    expect(mocks.publishMutation.mutateAsync).toHaveBeenCalledWith({
      revision: 4,
      changeReason: "Draft đã kiểm thử",
    });

    await user.click(screen.getByRole("button", { name: "Rollback" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Phiên bản đích" }),
      "2",
    );
    await user.type(
      screen.getByLabelText("Lý do rollback"),
      "Khôi phục snapshot cũ",
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận rollback" }),
    );
    expect(mocks.rollbackMutation.mutateAsync).toHaveBeenCalledWith({
      targetVersion: 2,
      changeReason: "Khôi phục snapshot cũ",
    });
  });

  it("closes a guarded publish dialog on 409 so Reload is reachable without retry", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view", "ai.config.publish"]);
    mocks.publishMutation.mutateAsync.mockRejectedValueOnce({
      status: 409,
      data: {
        errorCode: "AI_CONFIG_CONFLICT",
        currentRevision: 10,
      },
    });

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "Cấu hình" }));
    await user.click(screen.getByRole("button", { name: "Phát hành" }));
    await user.type(
      screen.getByLabelText("Lý do phát hành"),
      "Draft đã kiểm thử",
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận phát hành" }),
    );

    expect(
      await screen.findByText("Có revision mới hơn: 10"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Phát hành draft" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reload revision" }),
    ).toBeEnabled();
    expect(mocks.publishMutation.mutateAsync).toHaveBeenCalledOnce();
  });

  it("mounts Test Lab only on its permitted tab and forwards the bounded request", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view", "ai.test.run"]);

    render(<AdminAiPage />);
    expect(mocks.useTestAiConfig).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: "Test Lab" }));
    expect(mocks.useTestAiConfig).toHaveBeenCalledOnce();

    await user.type(screen.getByLabelText("Tin nhắn thử"), "Xin chào");
    await user.click(screen.getByRole("button", { name: "Chạy test" }));
    expect(mocks.testConfigMutation.mutateAsync).toHaveBeenCalledWith({
      source: "draft",
      feature: "chat",
      message: "Xin chào",
      context: {},
    });
    expect(mocks.saveDraftMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("routes the kill switch only through its typed confirmation dialog", async () => {
    const user = userEvent.setup();
    mocks.permissions = new Set(["ai.view", "ai.kill_switch.manage"]);

    render(<AdminAiPage />);
    await user.click(screen.getByRole("tab", { name: "An toàn" }));
    expect(
      screen.queryByRole("button", { name: "Lưu safety draft" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tắt AI" }));
    await user.type(
      screen.getByLabelText("Lý do thay đổi kill switch"),
      "Provider lỗi diện rộng",
    );
    await user.type(screen.getByLabelText("Nhập TAT AI để xác nhận"), "TAT AI");
    await user.click(
      screen.getByRole("button", { name: "Xác nhận tắt AI" }),
    );

    expect(mocks.killSwitchMutation.mutateAsync).toHaveBeenCalledWith({
      enabled: true,
      reason: "Provider lỗi diện rộng",
    });
    expect(mocks.saveDraftMutation.mutateAsync).not.toHaveBeenCalled();
  });
});
