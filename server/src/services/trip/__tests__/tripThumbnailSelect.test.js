import test from "node:test";
import assert from "node:assert/strict";
import { TRIP_PLACE_SELECT } from "../trip.service.js";

test("TRIP_PLACE_SELECT includes first place image for trip thumbnail fallback", () => {
  assert.equal(TRIP_PLACE_SELECT.thumbnail, true);
  assert.deepEqual(TRIP_PLACE_SELECT.images, {
    take: 1,
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    select: { secureUrl: true, thumbnailUrl: true, imageData: true },
  });
});
