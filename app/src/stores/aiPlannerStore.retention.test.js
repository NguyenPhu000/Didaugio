import { describe, expect, it } from "vitest";
import {
  normalizeMessageCreatedAt,
  trimPersistedMessages,
} from "./aiPlannerRetention";

describe("trimPersistedMessages", () => {
  it("drops messages older than seven days and caps retained history", () => {
    const now = new Date("2026-07-24T00:00:00.000Z");
    const messages = Array.from({ length: 25 }, (_, index) => ({
      id: String(index),
      role: "user",
      content: String(index),
      createdAt:
        index === 0
          ? "2026-07-01T00:00:00.000Z"
          : "2026-07-23T00:00:00.000Z",
    }));

    const result = trimPersistedMessages(messages, now);

    expect(result).toHaveLength(20);
    expect(result.some((message) => message.id === "0")).toBe(false);
  });

  it("falls back to the current timestamp for an invalid message timestamp", () => {
    const now = new Date("2026-07-24T00:00:00.000Z");

    expect(normalizeMessageCreatedAt("not-a-date", now)).toBe(now.toISOString());
  });
});
