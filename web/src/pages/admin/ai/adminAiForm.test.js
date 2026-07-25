import { describe, expect, it } from "vitest";
import { toAiConfigForm, toAiDraftPayload } from "./adminAiForm";

describe("Admin AI form mapping", () => {
  it("never maps a provider secret from a read response", () => {
    const form = toAiConfigForm({
      revision: 3,
      draft: { configData: { provider: { adapter: "groq", model: "llama" } } },
      credential: { configured: true, suffix: "1234" },
    });

    expect(form.providerSecret).toBe("");
    expect(form.credentialSuffix).toBe("1234");
  });

  it("omits an empty provider secret from a draft payload", () => {
    const payload = toAiDraftPayload(
      { configData: { provider: { adapter: "groq" } }, providerSecret: "" },
      3,
      "Cập nhật prompt",
    );

    expect(payload).not.toHaveProperty("providerSecret");
  });
});
