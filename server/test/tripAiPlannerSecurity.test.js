import assert from "node:assert/strict";
import test from "node:test";
import {
  assertAuthoritativeItineraryPlaces,
  buildTripDestinations,
  canUseTripItineraryFallback,
  filterItineraryToSelectedPlaces,
} from "../src/services/trip/tripAiPlanner.service.js";

const itinerary = {
  title: "Preview",
  description: "Preview",
  totalDays: 2,
  estimatedCost: 300_000,
  days: [
    {
      dayNumber: 1,
      theme: "Day 1",
      destinations: [
        { placeId: 1, order: 1 },
        { placeId: 2, order: 2 },
        { placeId: 1, order: 3 },
      ],
    },
    {
      dayNumber: 2,
      theme: "Day 2",
      destinations: [
        { placeId: 2, order: 1 },
        { placeId: 3, order: 2 },
      ],
    },
  ],
};

test("confirmation rejects a draft place outside the authoritative DB candidates", () => {
  assert.throws(
    () => assertAuthoritativeItineraryPlaces(itinerary, new Set([1, 2])),
    (error) =>
      error.statusCode === 400 &&
      error.code === "AI_INVALID_REQUEST",
  );
});

test("confirmation accepts an authoritative preview and removes every unselected occurrence", () => {
  assert.equal(
    assertAuthoritativeItineraryPlaces(itinerary, new Set([1, 2, 3])),
    itinerary,
  );

  const filtered = filterItineraryToSelectedPlaces(
    itinerary,
    new Set([2, 3]),
  );

  assert.deepEqual(
    filtered.days.map((day) => day.destinations.map((item) => item.placeId)),
    [[2], [2, 3]],
  );
  assert.deepEqual(
    itinerary.days.map((day) => day.destinations.map((item) => item.placeId)),
    [[1, 2, 1], [2, 3]],
    "filtering must not mutate the submitted preview",
  );

  assert.throws(
    () => filterItineraryToSelectedPlaces(itinerary, new Set([4])),
    (error) => error.code === "AI_INVALID_REQUEST",
    "a DB-valid ID that was not in the preview cannot be injected at confirm time",
  );

  const stops = buildTripDestinations({
    tripId: 10,
    days: itinerary.days,
    allowedPlaceIds: new Set([1, 2, 3]),
    selectedPlaceIdSet: new Set([2, 3]),
    allPlaces: [{ id: 1 }, { id: 2 }, { id: 3 }],
  });
  assert.deepEqual(stops.map((stop) => stop.placeId), [2, 2, 3]);
});

test("trip generation falls back on provider timeouts but never invalid AI output", () => {
  assert.equal(
    canUseTripItineraryFallback({ code: "AI_TIMEOUT", statusCode: 504 }),
    true,
  );
  assert.equal(
    canUseTripItineraryFallback({
      code: "AI_INVALID_OUTPUT",
      statusCode: 502,
    }),
    false,
  );
});
