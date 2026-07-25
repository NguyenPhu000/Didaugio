import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AiSafetyPanel from "./AiSafetyPanel";

const SAFETY_CONFIG = {
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: "llama",
    secretReference: "groq-primary",
  },
  modelParameters: {
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 2000,
    timeoutMs: 15000,
  },
  prompts: { chat: "chat", planner: "planner", voice: "voice" },
  context: {
    enabledSources: [],
    fieldAllowlist: [],
    maxTokens: 1000,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: ["tu cam"],
    matchMode: "substring",
    diacriticInsensitive: true,
    safeResponse: "Yêu cầu này không thể được xử lý.",
  },
  quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
  fallback: {
    maintenanceMessage: "AI đang bảo trì.",
    staticPlannerEnabled: true,
  },
};

const CONFIG_RESPONSE = {
  revision: 7,
  draftVersion: { version: 8, configData: SAFETY_CONFIG },
};

describe("AiSafetyPanel", () => {
  it("keeps matching substring-only and rejects a normalized duplicate before draft mutation", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={saveDraft}
      />,
    );

    expect(screen.getByText(/substring cố định/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /match mode/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/regex/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exact/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Từ khóa mới"), "Từ cấm");
    await user.click(screen.getByRole("button", { name: "Thêm từ khóa" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Từ khóa đã tồn tại",
    );
    expect(screen.getByText("1 / 500 từ khóa")).toBeInTheDocument();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("rejects a CSV with more than 500 entries without changing the keyword set", async () => {
    const user = userEvent.setup();
    const csv = Array.from(
      { length: 500 },
      (_, index) => `keyword-${index}`,
    ).join("\n");

    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText("Nhập CSV"),
      new File([csv], "keywords.csv", { type: "text/csv" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tối đa 500 từ khóa",
    );
    expect(screen.getByText("1 / 500 từ khóa")).toBeInTheDocument();
  });

  it("rejects empty and over-120-character CSV entries atomically", async () => {
    const user = userEvent.setup();

    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Nhập CSV");
    await user.upload(
      input,
      new File(["keyword\n\nvalid"], "empty.csv", { type: "text/csv" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Từ khóa không được để trống",
    );
    expect(screen.getByText("1 / 500 từ khóa")).toBeInTheDocument();

    await user.upload(
      input,
      new File(["x".repeat(121)], "long.csv", { type: "text/csv" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Mỗi từ khóa tối đa 120 ký tự",
    );
    expect(screen.getByText("1 / 500 từ khóa")).toBeInTheDocument();
  });

  it("exposes a duplicate created by diacritic folding to the toggle and save action", async () => {
    const user = userEvent.setup();

    render(
      <AiSafetyPanel
        config={{
          ...CONFIG_RESPONSE,
          draftVersion: {
            ...CONFIG_RESPONSE.draftVersion,
            configData: {
              ...SAFETY_CONFIG,
              safety: {
                ...SAFETY_CONFIG.safety,
                blockedKeywords: ["tu cam", "từ cấm"],
                diacriticInsensitive: false,
              },
            },
          },
        }}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("checkbox", {
      name: /Không phân biệt dấu/,
    });
    await user.click(toggle);

    const alert = screen.getByRole("alert");
    const save = screen.getByRole("button", { name: "Lưu safety draft" });
    expect(alert).toHaveTextContent("Từ khóa đã tồn tại");
    expect(alert).toHaveAttribute("id", "ai-safety-error");
    expect(toggle).toHaveAttribute("aria-describedby", "ai-safety-error");
    expect(save).toHaveAttribute("aria-describedby", "ai-safety-error");
    expect(save).toBeDisabled();
  });

  it("shows a visible focus ring when the hidden CSV input receives keyboard focus", () => {
    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    const fileInput = screen.getByLabelText("Nhập CSV");
    expect(fileInput.parentElement).toHaveClass(
      "focus-within:ring-2",
      "focus-within:ring-ring",
      "focus-within:ring-offset-2",
    );
  });

  it("exports the current keyword set as client-side CSV", () => {
    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: false, killSwitch: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    const exportLink = screen.getByRole("link", { name: "Xuất CSV" });
    expect(exportLink).toHaveAttribute("download", "ai-blocked-keywords.csv");
    expect(exportLink.getAttribute("href")).toContain("data:text/csv");
    expect(decodeURIComponent(exportLink.getAttribute("href"))).toContain(
      '"tu cam"',
    );
  });

  it("serializes safe-response edits with substring mode fixed", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.type(screen.getByLabelText("Từ khóa mới"), "spam");
    await user.click(screen.getByRole("button", { name: "Thêm từ khóa" }));
    await user.clear(screen.getByLabelText("Phản hồi an toàn"));
    await user.type(
      screen.getByLabelText("Phản hồi an toàn"),
      "Nội dung đã bị chặn.",
    );
    await user.type(
      screen.getByLabelText("Lý do thay đổi safety"),
      "Cập nhật danh sách chặn",
    );
    await user.click(screen.getByRole("button", { name: "Lưu safety draft" }));

    expect(saveDraft).toHaveBeenCalledWith({
      revision: 7,
      changeReason: "Cập nhật danh sách chặn",
      configData: {
        ...SAFETY_CONFIG,
        safety: {
          blockedKeywords: ["tu cam", "spam"],
          matchMode: "substring",
          diacriticInsensitive: true,
          safeResponse: "Nội dung đã bị chặn.",
        },
      },
    });
  });

  it("rejects a safety save when an unrelated snapshot section is invalid", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiSafetyPanel
        config={{
          ...CONFIG_RESPONSE,
          draftVersion: {
            ...CONFIG_RESPONSE.draftVersion,
            configData: {
              ...SAFETY_CONFIG,
              provider: {
                ...SAFETY_CONFIG.provider,
                model: "",
              },
            },
          },
        }}
        permissions={{ manage: true, killSwitch: false }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.type(
      screen.getByLabelText("Lý do thay đổi safety"),
      "Kiểm tra snapshot đầy đủ",
    );
    await user.click(screen.getByRole("button", { name: "Lưu safety draft" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "snapshot cấu hình",
    );
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("does not render keyword or kill-switch mutation controls without permission", () => {
    render(
      <AiSafetyPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: false, killSwitch: false }}
        onSaveDraft={vi.fn()}
        onKillSwitch={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Từ khóa mới")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Lưu safety draft" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tắt AI|Bật lại AI/ }),
    ).not.toBeInTheDocument();
  });
});
