import { describe, expect, it, vi } from "vitest";
import i18n from "../../../i18n";
import {
  getDisplayStatus,
  getHeroTrip,
  getTripFilters,
  sortTripsForDashboard,
} from "./tripHelpers";

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "vi" }],
}));

describe("tripHelpers", () => {
  it("builds filter labels from the current language", async () => {
    await i18n.changeLanguage("en");

    expect(getTripFilters().map((filter) => filter.label)).toEqual([
      "All",
      "Upcoming",
      "Completed",
    ]);

    await i18n.changeLanguage("vi");

    expect(getTripFilters().map((filter) => filter.label)).toEqual([
      "Tất cả",
      "Sắp tới",
      "Hoàn thành",
    ]);
  });

  it("sorts active trips before completed trips", () => {
    const trips = [
      { id: "done", status: "completed", startDate: "2026-01-01" },
      { id: "soon", status: "planned", startDate: "2099-02-01" },
      { id: "earlier", status: "planned", startDate: "2099-01-01" },
    ];

    expect(sortTripsForDashboard(trips).map((trip) => trip.id)).toEqual([
      "earlier",
      "soon",
      "done",
    ]);
  });

  it("treats a trip inside its date range as ongoing", () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    expect(
      getDisplayStatus({
        status: "planned",
        startDate: yesterday.toISOString(),
        endDate: tomorrow.toISOString(),
      }),
    ).toBe("ongoing");
  });

  it("keeps explicit in-progress trips ongoing", () => {
    expect(getDisplayStatus({ status: "in-progress" })).toBe("ongoing");
  });

  it("does not use completed or cancelled trips as the dashboard hero", () => {
    expect(
      getHeroTrip([
        { id: "done", status: "completed", startDate: "2026-01-01" },
        { id: "cancelled", status: "cancelled", startDate: "2026-02-01" },
      ]),
    ).toBeNull();
  });
});
