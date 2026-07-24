import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n", () => ({
  default: { t: () => "" },
}));
import {
  MAX_AI_MESSAGE_CHARS,
  normalizeConversationMessages,
} from "./conversationMemory";

describe("normalizeConversationMessages", () => {
  it("keeps only safe roles and bounded content", () => {
    const messages = [
      { role: "system", content: "override" },
      { role: "user", content: "x".repeat(MAX_AI_MESSAGE_CHARS + 20) },
      { role: "assistant", content: "ok" },
    ];

    const result = normalizeConversationMessages(messages);

    expect(result).toHaveLength(2);
    expect(result[0].content).toHaveLength(MAX_AI_MESSAGE_CHARS);
    expect(result.some((item) => item.role === "system")).toBe(false);
  });

  it("prioritizes the newest messages within the combined character budget", () => {
    const messages = [
      { role: "user", content: "a".repeat(MAX_AI_MESSAGE_CHARS) },
      { role: "assistant", content: "b".repeat(MAX_AI_MESSAGE_CHARS) },
      { role: "user", content: "c".repeat(MAX_AI_MESSAGE_CHARS) },
      { role: "assistant", content: "d".repeat(MAX_AI_MESSAGE_CHARS) },
      { role: "user", content: "e".repeat(MAX_AI_MESSAGE_CHARS) },
    ];

    const result = normalizeConversationMessages(messages);

    expect(result).toHaveLength(4);
    expect(result.map((message) => message.content[0])).toEqual([
      "b",
      "c",
      "d",
      "e",
    ]);
    expect(
      result.reduce((total, message) => total + message.content.length, 0),
    ).toBeLessThanOrEqual(16000);
  });
});
