import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./useGroqChat.js", import.meta.url)),
  "utf8",
);

describe("useGroqChat routing contract", () => {
  it("is chat-only", () => {
    expect(source).not.toContain("ITINERARY_PATTERN");
    expect(source).not.toContain("hybrid-plan");
    expect(source).toContain("ENDPOINTS.ai.groqChat");
  });

  it("supports retry without appending a duplicate user message", () => {
    expect(source).toContain("appendUserMessage");
    expect(source).toContain("retryLastMessage");
  });
});
