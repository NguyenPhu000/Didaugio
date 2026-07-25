import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AiConfigurationPanel from "./AiConfigurationPanel";

const VALID_CONFIG = {
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
    enabledSources: ["coarseLocation", "places"],
    fieldAllowlist: ["currentCity", "places"],
    maxTokens: 1000,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: [],
    matchMode: "substring",
    diacriticInsensitive: false,
    safeResponse: "Yêu cầu này không thể được xử lý.",
  },
  quotas: {
    freeDailyRequests: 20,
    premiumDailyRequests: 200,
  },
  fallback: {
    maintenanceMessage: "AI đang bảo trì.",
    staticPlannerEnabled: true,
  },
};

const CONFIG_RESPONSE = {
  revision: 4,
  providerCredential: {
    configured: true,
    suffix: "1234",
  },
  activeVersion: {
    version: 3,
    configData: VALID_CONFIG,
  },
  draftVersion: {
    version: 4,
    configData: VALID_CONFIG,
  },
  versions: [],
};

describe("AiConfigurationPanel", () => {
  it("keeps the credential write-only and cannot expose publish to a draft-only admin", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );

    expect(screen.getByLabelText("API key mới")).toHaveValue("");
    expect(screen.getByText(/kết thúc bằng 1234/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Phát hành" }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Điều chỉnh prompt",
    );
    await user.click(screen.getByRole("button", { name: "Lưu draft" }));

    expect(saveDraft).toHaveBeenCalledWith({
      revision: 4,
      configData: VALID_CONFIG,
      changeReason: "Điều chỉnh prompt",
    });
  });

  it("clears an entered replacement secret whenever a newer revision loads", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("API key mới"),
      "gsk_1234567890123456",
    );
    expect(screen.getByLabelText("API key mới")).not.toHaveValue("");

    rerender(
      <AiConfigurationPanel
        config={{ ...CONFIG_RESPONSE, revision: 5 }}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("API key mới")).toHaveValue("");
  });

  it("clears and omits a replacement secret when secrets permission is revoked at the same revision", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();
    const { rerender } = render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.type(
      screen.getByLabelText("API key mới"),
      "gsk_1234567890123456",
    );

    rerender(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: false }}
        onSaveDraft={saveDraft}
      />,
    );

    expect(screen.queryByLabelText("API key mới")).not.toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Quyền secrets đã bị thu hồi",
    );
    await user.click(screen.getByRole("button", { name: "Lưu draft" }));

    expect(saveDraft).toHaveBeenCalledWith({
      revision: 4,
      configData: VALID_CONFIG,
      changeReason: "Quyền secrets đã bị thu hồi",
    });
  });

  it("does not render the secret rotation control without secrets permission", () => {
    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("API key mới")).not.toBeInTheDocument();
    expect(screen.queryByText(/kết thúc bằng 1234/i)).not.toBeInTheDocument();
  });

  it("rejects invalid model bounds before a draft mutation can run", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.clear(screen.getByLabelText("Max tokens"));
    await user.type(screen.getByLabelText("Max tokens"), "128");
    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Giảm token thử nghiệm",
    );

    expect(screen.getByRole("button", { name: "Lưu draft" })).toBeDisabled();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("rejects a short replacement credential before a draft mutation", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.type(screen.getByLabelText("API key mới"), "too-short");
    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Xoay khóa Groq",
    );

    expect(screen.getByRole("button", { name: "Lưu draft" })).toBeDisabled();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("rejects an invalid nested safety snapshot before saving the full draft", async () => {
    const user = userEvent.setup();

    render(
      <AiConfigurationPanel
        config={{
          ...CONFIG_RESPONSE,
          draftVersion: {
            ...CONFIG_RESPONSE.draftVersion,
            configData: {
              ...VALID_CONFIG,
              safety: {
                ...VALID_CONFIG.safety,
                safeResponse: "",
              },
            },
          },
        }}
        permissions={{ manage: true, publish: false, secrets: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Chỉnh provider",
    );

    expect(screen.getByRole("button", { name: "Lưu draft" })).toBeDisabled();
  });

  it("rejects a full snapshot with a missing required prompt", async () => {
    const user = userEvent.setup();
    const { voice: _voice, ...missingVoicePrompt } = VALID_CONFIG.prompts;

    render(
      <AiConfigurationPanel
        config={{
          ...CONFIG_RESPONSE,
          draftVersion: {
            ...CONFIG_RESPONSE.draftVersion,
            configData: {
              ...VALID_CONFIG,
              prompts: missingVoicePrompt,
            },
          },
        }}
        permissions={{ manage: true, publish: false, secrets: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Kiểm tra prompt bắt buộc",
    );

    expect(screen.getByRole("button", { name: "Lưu draft" })).toBeDisabled();
  });

  it("rejects a full snapshot with an extra prompt key", async () => {
    const user = userEvent.setup();

    render(
      <AiConfigurationPanel
        config={{
          ...CONFIG_RESPONSE,
          draftVersion: {
            ...CONFIG_RESPONSE.draftVersion,
            configData: {
              ...VALID_CONFIG,
              prompts: {
                ...VALID_CONFIG.prompts,
                summarize: "Unsupported prompt",
              },
            },
          },
        }}
        permissions={{ manage: true, publish: false, secrets: false }}
        onSaveDraft={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Kiểm tra prompt không hỗ trợ",
    );

    expect(screen.getByRole("button", { name: "Lưu draft" })).toBeDisabled();
  });

  it("uses named configuration groups without hanging ordinal labels", () => {
    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: false, publish: false, secrets: false }}
      />,
    );

    for (const heading of [
      "Provider",
      "Model parameters",
      "Prompts",
      "Context policy",
      "Quota & fallback",
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }
    for (const ordinal of ["/01", "/02", "/03", "/04", "/05"]) {
      expect(screen.queryByText(ordinal)).not.toBeInTheDocument();
    }
  });

  it("serializes controlled edits from every configuration section", async () => {
    const user = userEvent.setup();
    const saveDraft = vi.fn();

    render(
      <AiConfigurationPanel
        config={CONFIG_RESPONSE}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );

    await user.clear(screen.getByLabelText("Model"));
    await user.type(screen.getByLabelText("Model"), "llama-next");
    await user.clear(screen.getByLabelText("Temperature"));
    await user.type(screen.getByLabelText("Temperature"), "0.5");
    await user.clear(screen.getByLabelText("Prompt Chat"));
    await user.type(screen.getByLabelText("Prompt Chat"), "New chat prompt");
    await user.click(
      within(
        screen.getByRole("group", { name: "Registered context sources" }),
      ).getByRole("checkbox", { name: "Weather" }),
    );
    await user.click(
      within(screen.getByRole("group", { name: "Field allowlist" })).getByRole(
        "checkbox",
        { name: "Travel preferences" },
      ),
    );
    await user.clear(screen.getByLabelText("Quota Free"));
    await user.type(screen.getByLabelText("Quota Free"), "25");
    await user.click(
      screen.getByRole("switch", { name: "Static planner fallback" }),
    );
    await user.type(
      screen.getByLabelText("API key mới"),
      "gsk_1234567890123456",
    );
    await user.type(
      screen.getByLabelText("Lý do thay đổi"),
      "Cập nhật toàn bộ",
    );
    await user.click(screen.getByRole("button", { name: "Lưu draft" }));

    expect(saveDraft).toHaveBeenCalledWith({
      revision: 4,
      providerSecret: "gsk_1234567890123456",
      changeReason: "Cập nhật toàn bộ",
      configData: {
        ...VALID_CONFIG,
        provider: {
          ...VALID_CONFIG.provider,
          model: "llama-next",
        },
        modelParameters: {
          ...VALID_CONFIG.modelParameters,
          temperature: 0.5,
        },
        prompts: {
          ...VALID_CONFIG.prompts,
          chat: "New chat prompt",
        },
        context: {
          ...VALID_CONFIG.context,
          enabledSources: [
            ...VALID_CONFIG.context.enabledSources,
            "weather",
          ],
          fieldAllowlist: [
            ...VALID_CONFIG.context.fieldAllowlist,
            "travelPreferences",
          ],
        },
        quotas: {
          ...VALID_CONFIG.quotas,
          freeDailyRequests: 25,
        },
        fallback: {
          ...VALID_CONFIG.fallback,
          staticPlannerEnabled: false,
        },
      },
    });
  });
});
