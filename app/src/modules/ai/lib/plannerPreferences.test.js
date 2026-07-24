import { describe, expect, it } from "vitest";
import { inferPlannerPreferences } from "./plannerPreferences";

describe("inferPlannerPreferences", () => {
  it("extracts days, group size, and Vietnamese budget while preserving raw text elsewhere", () => {
    expect(inferPlannerPreferences("Lên lịch 3 ngày giá rẻ dưới 2 triệu cho 2 người")).toEqual({
      totalDays: 3,
      groupSize: 2,
      budget: 2_000_000,
      travelStyle: "budget",
    });
  });

  it("supports k notation and bounds unsafe quantities", () => {
    expect(inferPlannerPreferences("Đi 99 ngày cho 40 người, khoảng 500k")).toMatchObject({
      totalDays: 14,
      groupSize: 12,
      budget: 500_000,
    });
  });
});
