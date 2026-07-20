import { describe, expect, it, vi } from "vitest";
import { getTripSelectorItemViewModel } from "./tripSelectorDisplay";

vi.mock("../../../constants/api", () => ({
  API_BASE_CANDIDATES: ["https://api.didaugio.vn/api"],
  API_BASE_URL: "https://api.didaugio.vn/api",
}));

describe("trip selector display", () => {
  it("uses the trip title and resolved trip cover in add-to-trip rows", () => {
    const model = getTripSelectorItemViewModel({
      id: 42,
      title: "Weekend Can Tho",
      name: "Legacy name",
      thumbnailUrl: "/uploads/trips/weekend.jpg",
      destinations: [{ id: 1 }, { id: 2 }],
    });

    expect(model.title).toBe("Weekend Can Tho");
    expect(model.thumbnail).toContain("/uploads/trips/weekend.jpg");
    expect(model.destinationCount).toBe(2);
  });

  it("falls back to name then id when a trip has no title", () => {
    expect(getTripSelectorItemViewModel({ id: 7, name: "Legacy Trip" }).title).toBe(
      "Legacy Trip",
    );
    expect(getTripSelectorItemViewModel({ id: 8 }).title).toBe("Trip #8");
  });
});
