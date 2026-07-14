import { describe, expect, it } from "vitest";
import {
  CATEGORY_ICON_MAP,
  DEFAULT_CATEGORY_ICON,
  getCategoryIconName,
} from "../categoryConstants";

describe("getCategoryIconName", () => {
  it("uses the MDI identifier configured by the category API", () => {
    expect(getCategoryIconName({ icon: "temple-buddhist" })).toBe(
      "temple-buddhist",
    );
  });

  it("uses the shared fallback for unknown icons", () => {
    expect(getCategoryIconName({ icon: "unknown" })).toBe(
      DEFAULT_CATEGORY_ICON,
    );
  });

  it("provides an SVG path for every icon exposed by the picker", () => {
    expect(Object.values(CATEGORY_ICON_MAP).every(Boolean)).toBe(true);
  });
});
