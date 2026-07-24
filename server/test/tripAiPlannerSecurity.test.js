import assert from "node:assert/strict";
import test from "node:test";
import { itineraryPreviewSchema } from "../src/models/schemas/trip/itineraryPreview.schema.js";
import * as tripAiPlanner from "../src/services/trip/tripAiPlanner.service.js";
import {
  assertAuthoritativeItineraryPlaces,
  buildTripDestinations,
  canUseTripItineraryFallback,
  filterItineraryToSelectedPlaces,
} from "../src/services/trip/tripAiPlanner.service.js";

const destination = (placeId, order, estimatedCost = 100_000) => ({
  placeId,
  order,
  startTime: null,
  endTime: null,
  durationMinutes: null,
  note: null,
  transportToNext: null,
  estimatedCost,
});

const itinerary = {
  title: "Preview",
  description: "Preview",
  totalDays: 2,
  estimatedCost: 500_000,
  days: [
    {
      dayNumber: 1,
      theme: "Day 1",
      destinations: [
        destination(1, 1),
        destination(2, 2),
        destination(1, 3),
      ],
    },
    {
      dayNumber: 2,
      theme: "Day 2",
      destinations: [
        destination(2, 1),
        destination(3, 2),
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

test("confirmation recomputes the saved cost from only retained destinations", () => {
  const preview = {
    title: "Three stops",
    description: null,
    totalDays: 1,
    estimatedCost: 300_000,
    days: [
      {
        dayNumber: 1,
        theme: "Day 1",
        destinations: [
          destination(1, 1),
          destination(2, 2),
          destination(3, 3),
        ],
      },
    ],
  };

  const filtered = filterItineraryToSelectedPlaces(preview, new Set([2]));
  const stops = buildTripDestinations({
    tripId: 10,
    days: filtered.days,
    allowedPlaceIds: new Set([1, 2, 3]),
    selectedPlaceIdSet: new Set([2]),
  });

  assert.equal(filtered.estimatedCost, 100_000);
  assert.deepEqual(stops.map((stop) => stop.estimatedCost), [100_000]);
  assert.equal(preview.estimatedCost, 300_000);
  assert.equal(preview.days[0].destinations.length, 3);
  assert.equal(itineraryPreviewSchema.safeParse(filtered).success, true);
});

test("confirmation counts repeated retained stops and normalizes unsafe costs without mutation", () => {
  const repeated = {
    title: "Repeated",
    description: null,
    totalDays: 1,
    estimatedCost: 300_000,
    days: [
      {
        dayNumber: 1,
        theme: "Day 1",
        destinations: [
          destination(1, 1),
          destination(2, 2),
          destination(1, 3),
        ],
      },
    ],
  };
  const repeatedFiltered = filterItineraryToSelectedPlaces(
    repeated,
    new Set([1]),
  );
  assert.equal(repeatedFiltered.estimatedCost, 200_000);
  assert.equal(repeatedFiltered.days[0].destinations.length, 2);

  const unsafe = {
    ...repeated,
    estimatedCost: Number.NaN,
    days: [
      {
        ...repeated.days[0],
        destinations: [
          destination(1, 1, 0),
          destination(1, 2, -10),
          destination(1, 3, Number.NaN),
        ],
      },
    ],
  };
  const unsafeFiltered = filterItineraryToSelectedPlaces(
    unsafe,
    new Set([1]),
  );

  assert.equal(unsafeFiltered.estimatedCost, 0);
  assert.deepEqual(
    unsafeFiltered.days[0].destinations.map((stop) => stop.estimatedCost),
    [0, null, null],
  );
  assert.equal(itineraryPreviewSchema.safeParse(unsafeFiltered).success, true);
  assert.ok(Number.isNaN(unsafe.estimatedCost));
  assert.equal(unsafe.days[0].destinations[1].estimatedCost, -10);

  const overLimit = {
    ...repeated,
    estimatedCost: 1_600_000_000,
    days: [
      {
        ...repeated.days[0],
        destinations: [
          destination(1, 1, 800_000_000),
          destination(1, 2, 800_000_000),
        ],
      },
    ],
  };
  const bounded = filterItineraryToSelectedPlaces(
    overLimit,
    new Set([1]),
  );
  assert.equal(bounded.estimatedCost, 1_000_000_000);
  assert.deepEqual(
    bounded.days[0].destinations.map((stop) => stop.estimatedCost),
    [800_000_000, 200_000_000],
  );
  assert.equal(itineraryPreviewSchema.safeParse(bounded).success, true);
});

test("confirmed itinerary validation enforces shared schema and selected-place invariants", () => {
  assert.equal(
    typeof tripAiPlanner.validateConfirmedItinerary,
    "function",
  );

  const filtered = filterItineraryToSelectedPlaces(itinerary, new Set([2]));
  assert.doesNotThrow(() =>
    tripAiPlanner.validateConfirmedItinerary(
      filtered,
      new Set([1, 2, 3]),
      new Set([2]),
    ),
  );
  assert.throws(
    () =>
      tripAiPlanner.validateConfirmedItinerary(
        itinerary,
        new Set([1, 2, 3]),
        new Set([2]),
      ),
    (error) => error.code === "AI_INVALID_REQUEST",
  );
});

test("empty selection keeps the existing no-filter behavior", () => {
  assert.equal(
    filterItineraryToSelectedPlaces(itinerary, new Set()),
    itinerary,
  );
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
