import { describe, expect, it } from "vitest";
import {
  buildSpatialIndex,
  calculateBearing,
  getDistanceM,
  isOffRoute,
  normalizeHeadingDelta,
  pointToSegmentDistance,
  queryNearbySegments,
  snapToRoute,
} from "./routeEngine";

describe("routeEngine", () => {
  it("projects GPS point onto a route segment in meters", () => {
    const result = pointToSegmentDistance(
      { lat: 10.0005, lng: 105.0001 },
      { lat: 10, lng: 105 },
      { lat: 10.001, lng: 105 },
    );

    expect(result.distance).toBeGreaterThan(10);
    expect(result.distance).toBeLessThan(12);
    expect(result.snappedPoint.lat).toBeCloseTo(10.0005, 5);
    expect(result.snappedPoint.lng).toBeCloseTo(105, 5);
    expect(isOffRoute(result.distance, 50)).toBe(false);
  });

  it("uses latitude and longitude radii separately for R-Tree queries", () => {
    const route = [
      { lat: 60, lng: 0.00075 },
      { lat: 60, lng: 0.00076 },
    ];
    const spatialIndex = buildSpatialIndex(route);

    const candidates = queryNearbySegments(spatialIndex, { lat: 60, lng: 0 }, 50);

    expect(candidates).toContain(0);
  });

  it("prefers same-direction nearby segment to avoid figure-8 trap", () => {
    const route = [
      { lat: 10, lng: 105 },
      { lat: 10.001, lng: 105 },
      { lat: 10.001, lng: 105.00002 },
      { lat: 10, lng: 105.00002 },
    ];
    const spatialIndex = buildSpatialIndex(route);

    const snap = snapToRoute(
      { lat: 10.0005, lng: 105.000012, heading: 180 },
      route,
      null,
      { spatialIndex, heading: 180, searchRadiusM: 20 },
    );

    expect(snap.segmentIndex).toBe(2);
    expect(snap.isSameDirection).toBe(true);
  });

  it("calculates bearing and normalized heading delta", () => {
    expect(calculateBearing({ lat: 10, lng: 105 }, { lat: 10.001, lng: 105 })).toBeCloseTo(0, 0);
    expect(normalizeHeadingDelta(350, 10)).toBe(20);
    expect(getDistanceM({ latitude: 10, longitude: 105 }, { lat: 10, lng: 105 })).toBe(0);
  });
});
