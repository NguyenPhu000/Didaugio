import { describe, expect, it } from "vitest";
import {
  getMarkerDensity,
  MARKER_DENSITY,
  regionToZoom,
  shouldShowMarkerLabelsForRegion,
} from "./mapZoom";

describe("mapZoom", () => {
  it("returns 0 for invalid region or viewport", () => {
    expect(regionToZoom(null, 390)).toBe(0);
    expect(regionToZoom({ longitudeDelta: 0 }, 390)).toBe(0);
    expect(regionToZoom({ longitudeDelta: 0.01 }, 0)).toBe(0);
  });

  it("increases zoom as longitudeDelta gets smaller", () => {
    const wide = regionToZoom({ longitudeDelta: 0.08 }, 390);
    const close = regionToZoom({ longitudeDelta: 0.008 }, 390);

    expect(close).toBeGreaterThan(wide);
  });

  it("maps region to marker label threshold", () => {
    expect(shouldShowMarkerLabelsForRegion({ longitudeDelta: 0.007 }, 390, 15)).toBe(true);
    expect(shouldShowMarkerLabelsForRegion({ longitudeDelta: 0.08 }, 390, 15)).toBe(false);
  });

  it("uses category icons until zoom 13, then shows image markers", () => {
    expect(getMarkerDensity(10)).toBe(MARKER_DENSITY.CATEGORY);
    expect(getMarkerDensity(12.9)).toBe(MARKER_DENSITY.CATEGORY);
    expect(getMarkerDensity(13)).toBe(MARKER_DENSITY.DETAIL);
  });
});
