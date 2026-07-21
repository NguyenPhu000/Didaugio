import { describe, expect, it } from "vitest";
import { TAG_TYPES } from "./tagConstants";

describe("tag type options", () => {
  it("only exposes values accepted by the tag API", () => {
    expect(Object.keys(TAG_TYPES)).toEqual([
      "general",
      "feature",
      "amenity",
      "cuisine",
      "activity",
      "atmosphere",
    ]);
  });
});
