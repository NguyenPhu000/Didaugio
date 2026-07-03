import { describe, expect, it } from "vitest";
import {
  getDistrictSelectionState,
  getDistrictViewport,
} from "./placeMapDistrictGuard";

const districts = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: 12, name: "Ninh Kieu" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.75, 10.0],
            [105.85, 10.0],
            [105.85, 10.1],
            [105.75, 10.1],
            [105.75, 10.0],
          ],
        ],
      },
    },
  ],
};

describe("placeMapDistrictGuard", () => {
  it("allows points inside the selected district", () => {
    const state = getDistrictSelectionState({
      districts,
      districtId: 12,
      latitude: 10.05,
      longitude: 105.8,
    });

    expect(state).toMatchObject({
      locked: true,
      inside: true,
      districtName: "Ninh Kieu",
    });
  });

  it("blocks points outside the selected district", () => {
    const state = getDistrictSelectionState({
      districts,
      districtId: 12,
      latitude: 10.2,
      longitude: 105.8,
    });

    expect(state).toMatchObject({
      locked: true,
      inside: false,
      districtName: "Ninh Kieu",
    });
  });

  it("does not lock selection before a district is selected", () => {
    const state = getDistrictSelectionState({
      districts,
      districtId: null,
      latitude: 10.2,
      longitude: 105.8,
    });

    expect(state).toMatchObject({
      locked: false,
      inside: true,
      districtName: null,
    });
  });

  it("returns a viewport centered on the district boundary", () => {
    const viewport = getDistrictViewport({ districts, districtId: 12 });

    expect(viewport).toMatchObject({
      latitude: 10.05,
      longitude: 105.8,
      zoom: 12,
    });
  });
});
