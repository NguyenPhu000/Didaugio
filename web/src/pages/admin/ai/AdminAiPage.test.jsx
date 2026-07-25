import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAiPage from "./AdminAiPage";

const mocks = vi.hoisted(() => ({
  permissions: new Set(),
  overviewResult: {},
  logsResult: {},
  useAdminAiOverview: vi.fn(),
  useAdminAiLogs: vi.fn(),
}));

vi.mock("@/hooks/usePermission", () => ({
  usePermission: () => ({
    hasPermission: (permission) => mocks.permissions.has(permission),
  }),
}));

vi.mock("@/hooks/queries/useAdminAiQueries", () => ({
  useAdminAiOverview: (...args) => mocks.useAdminAiOverview(...args),
  useAdminAiLogs: (...args) => mocks.useAdminAiLogs(...args),
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
    mocks.useAdminAiOverview.mockReset();
    mocks.useAdminAiOverview.mockImplementation(() => mocks.overviewResult);
    mocks.useAdminAiLogs.mockReset();
    mocks.useAdminAiLogs.mockImplementation(() => mocks.logsResult);
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

    await user.click(logsTab);

    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();
    expect(screen.queryByText("Metadata yêu cầu")).not.toBeInTheDocument();
  });

  it("does not mount AI queries for a direct visitor without module access", () => {
    mocks.permissions = new Set();

    render(<AdminAiPage />);

    expect(mocks.useAdminAiOverview).not.toHaveBeenCalled();
    expect(mocks.useAdminAiLogs).not.toHaveBeenCalled();
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
});
