import test from "node:test";
import assert from "node:assert/strict";
import { withSavedTripFlags } from "../trip.service.js";

test("withSavedTripFlags marks only saved trips in a trip list", () => {
  const trips = [{ id: 1, title: "A" }, { id: 2, title: "B" }];
  const result = withSavedTripFlags(trips, [{ tripId: 2 }]);

  assert.deepEqual(result, [
    { id: 1, title: "A", isSaved: false },
    { id: 2, title: "B", isSaved: true },
  ]);
});
