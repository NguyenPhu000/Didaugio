import { describe, expect, it } from "vitest";
import { mapTripCacheValue } from "./tripCache";

describe("tripCache", () => {
  it("updates direct trip cache values", () => {
    const result = mapTripCacheValue(
      { id: 1, destinations: [{ id: "a" }, { id: "b" }] },
      (trip) => ({
        ...trip,
        destinations: trip.destinations.filter((dest) => dest.id !== "a"),
      }),
    );

    expect(result.destinations).toEqual([{ id: "b" }]);
  });

  it("updates response envelope cache values", () => {
    const result = mapTripCacheValue(
      { success: true, data: { id: 1, destinations: [{ id: "a" }] } },
      (trip) => ({ ...trip, title: "Updated" }),
    );

    expect(result).toEqual({
      success: true,
      data: { id: 1, title: "Updated", destinations: [{ id: "a" }] },
    });
  });

  it("leaves empty cache values unchanged", () => {
    expect(mapTripCacheValue(null, (trip) => trip)).toBeNull();
    expect(mapTripCacheValue(undefined, (trip) => trip)).toBeUndefined();
  });
});
