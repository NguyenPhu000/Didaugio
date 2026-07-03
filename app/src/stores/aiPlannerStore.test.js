import { describe, expect, test } from "vitest";
import { removeDraftPreviewMessages } from "./aiPlannerStore";

describe("aiPlannerStore helpers", () => {
  test("removes old draft preview messages but keeps normal conversation", () => {
    const messages = [
      { id: "u1", role: "user", text: "Tạo lịch trình 1 ngày" },
      { id: "p1", role: "assistant", text: "Draft cũ", isDraftPreview: true },
      { id: "c1", role: "assistant", text: "Chat thường", source: "chat" },
    ];

    expect(removeDraftPreviewMessages(messages)).toEqual([
      { id: "u1", role: "user", text: "Tạo lịch trình 1 ngày" },
      { id: "c1", role: "assistant", text: "Chat thường", source: "chat" },
    ]);
  });

  test("removes legacy draft previews created before the marker existed", () => {
    const messages = [
      {
        id: "legacy",
        role: "assistant",
        text: "Draft cũ",
        suggestedPlaces: [{ id: 1 }],
        selectedPlaceIds: [1],
      },
      { id: "done", role: "assistant", text: "Trip đã tạo", plan: { id: 2 } },
    ];

    expect(removeDraftPreviewMessages(messages)).toEqual([
      { id: "done", role: "assistant", text: "Trip đã tạo", plan: { id: 2 } },
    ]);
  });
});
