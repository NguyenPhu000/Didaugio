import { describe, expect, it } from "vitest";
import {
  buildTripPreviewStops,
  buildTripPreviewSegments,
} from "./tripRoutePreview";

const destination = (overrides) => ({
  id: overrides.id,
  dayNumber: overrides.dayNumber ?? 1,
  order: overrides.order ?? 0,
  place: {
    id: overrides.placeId ?? overrides.id,
    name: overrides.name ?? `Place ${overrides.id}`,
    latitude: overrides.lat,
    longitude: overrides.lng,
    thumbnail: overrides.thumbnail,
  },
});

describe("tripRoutePreview", () => {
  it("orders valid trip stops and numbers them by itinerary order", () => {
    const stops = buildTripPreviewStops([
      destination({ id: 3, dayNumber: 2, order: 1, lat: "10.04", lng: "105.8" }),
      destination({ id: 1, dayNumber: 1, order: 2, lat: "10.02", lng: "105.7" }),
      destination({ id: 2, dayNumber: 1, order: 1, lat: "10.01", lng: "105.6" }),
      destination({ id: 4, dayNumber: 3, order: 1, lat: null, lng: "105.9" }),
    ]);

    expect(stops.map((stop) => stop.id)).toEqual([2, 1, 3]);
    expect(stops.map((stop) => stop.sequence)).toEqual([1, 2, 3]);
    expect(stops[0].coordinate).toEqual({ latitude: 10.01, longitude: 105.6 });
  });

  it("builds numbered colored route segments with midpoint labels", () => {
    const stops = buildTripPreviewStops([
      destination({ id: 1, order: 1, lat: 10, lng: 106 }),
      destination({ id: 2, order: 2, lat: 10.01, lng: 106.01 }),
      destination({ id: 3, order: 3, lat: 10.03, lng: 106.02 }),
    ]);

    const segments = buildTripPreviewSegments(stops, [
      {
        coordinates: [
          { latitude: 10, longitude: 106 },
          { latitude: 10.005, longitude: 106.004 },
          { latitude: 10.01, longitude: 106.01 },
        ],
        distanceM: 1450,
      },
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      id: "1-2",
      label: "1-2",
      distanceLabel: "1.5 km",
      color: "#EF4444",
    });
    expect(segments[0].labelCoordinate).toEqual({
      latitude: 10.005,
      longitude: 106.004,
    });
    expect(segments[1].label).toBe("2-3");
    expect(segments[1].coordinates).toEqual([
      { latitude: 10.01, longitude: 106.01 },
      { latitude: 10.03, longitude: 106.02 },
    ]);
  });
});
