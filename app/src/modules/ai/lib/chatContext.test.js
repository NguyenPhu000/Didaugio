import { describe, expect, it } from "vitest";
import { buildSafeChatContext } from "./chatContext";

describe("buildSafeChatContext", () => {
  it("omits invalid optional fields and sanitizes bounded list fields", () => {
    expect(
      buildSafeChatContext(
        {
          currentLocation: { latitude: 91, longitude: 105 },
          currentCity: "x".repeat(121),
          timeOfDay: null,
          preferences: [],
          visitedPlaceIds: [1, "2", -1, 1, null],
        },
        false,
      ),
    ).toEqual({
      visitedPlaceIds: [1, 2],
      isPlaceQuery: false,
    });
  });

  it("does not coerce null coordinate members into a valid zero coordinate", () => {
    expect(
      buildSafeChatContext(
        {
          currentLocation: { latitude: null, longitude: null },
        },
        true,
      ),
    ).toEqual({ isPlaceQuery: true });
  });

  it("preserves server-valid empty strings, arrays, objects, and false", () => {
    expect(
      buildSafeChatContext(
        {
          currentCity: "   ",
          timeOfDay: "",
          preferences: {},
          visitedPlaceIds: [],
        },
        false,
      ),
    ).toEqual({
      currentCity: "",
      timeOfDay: "",
      preferences: {},
      visitedPlaceIds: [],
      isPlaceQuery: false,
    });
  });
});
