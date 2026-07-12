import { describe, expect, it } from "vitest";
import {
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "./placeDisplay";

describe("placeDisplay", () => {
  it("normalizes rating fields", () => {
    expect(getPlaceRatingValue({ ratingAvg: "4.7" })).toBe(4.7);
    expect(getPlaceRatingValue({ averageRating: 4.3 })).toBe(4.3);
    expect(getPlaceRatingValue({ ratingAvg: "bad" })).toBe(0);
  });

  it("normalizes review count fields", () => {
    expect(getPlaceReviewCount({ reviewCount: "12" })).toBe(12);
    expect(getPlaceReviewCount({ _count: { reviews: 8 } })).toBe(8);
    expect(getPlaceReviewCount({ reviewCount: "bad" })).toBe(0);
  });
});
