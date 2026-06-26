import { describe, expect, test } from "vitest";
import {
  NHI_INTENT_TYPES,
  buildNhiSuggestionGroups,
  detectNhiIntent,
  normalizeNhiResponse,
} from "./nhiAssistantExperience";

describe("nhi assistant experience helpers", () => {
  test("routes itinerary requests away from regular chat", () => {
    expect(detectNhiIntent("Lên lịch trình 1 ngày ở Cần Thơ")).toBe(
      NHI_INTENT_TYPES.ITINERARY,
    );
  });

  test("detects place discovery intent for nearby food prompts", () => {
    expect(detectNhiIntent("Gợi ý quán ăn gần đây")).toBe(
      NHI_INTENT_TYPES.PLACE_DISCOVERY,
    );
  });

  test("builds contextual suggestion groups and prioritizes saved places", () => {
    const groups = buildNhiSuggestionGroups({
      hasSavedPlaces: true,
      timeOfDay: "evening",
    });

    expect(groups[0].id).toBe("saved");
    expect(groups.flatMap((group) => group.items).some((item) => item.id === "evening-plan")).toBe(
      true,
    );
  });

  test("normalizes server response into stable UI sections", () => {
    const normalized = normalizeNhiResponse({
      data: {
        reply: "Quán này hợp đi tối nay.",
        relatedPlaces: [{ id: 1, name: "Bến Ninh Kiều" }],
        quickReplies: ["Thêm vào trip"],
      },
    });

    expect(normalized.reply).toBe("Quán này hợp đi tối nay.");
    expect(normalized.suggestedPlaces).toHaveLength(1);
    expect(normalized.quickReplies).toEqual(["Thêm vào trip"]);
    expect(normalized.actions.map((action) => action.type)).toContain("view_map");
  });
});
