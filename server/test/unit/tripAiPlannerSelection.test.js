import assert from "node:assert/strict";
import test from "node:test";

import { reconcileGeneratedItinerarySelection } from "../../src/services/trip/tripAiPlanner.service.js";

const destination = (placeId, order) => ({
  placeId,
  order,
  startTime: "08:00",
  endTime: "10:00",
  durationMinutes: 120,
  note: null,
  transportToNext: null,
  estimatedCost: 50_000,
});

test("generated preview removes deselected places and inserts newly selected approved places", () => {
  const itinerary = {
    title: "Cần Thơ 2 ngày",
    description: null,
    totalDays: 2,
    estimatedCost: 100_000,
    days: [
      {
        dayNumber: 1,
        theme: "Ngày 1",
        destinations: [destination(11, 1), destination(12, 2)],
      },
      {
        dayNumber: 2,
        theme: "Ngày 2",
        destinations: [destination(13, 1)],
      },
    ],
  };

  const result = reconcileGeneratedItinerarySelection(
    itinerary,
    new Set([11, 14]),
    new Set([11, 12, 13, 14]),
  );

  assert.deepEqual(
    result.days.flatMap((day) =>
      day.destinations.map((item) => item.placeId),
    ),
    [11, 14],
  );
  assert.deepEqual(
    result.days.flatMap((day) =>
      day.destinations.map((item) => item.order),
    ),
    [1, 1],
  );
  assert.equal(result.estimatedCost, 50_000);
});

test("generated preview drops stale IDs while preserving valid current selections", () => {
  const itinerary = {
    title: "Cần Thơ 1 ngày",
    description: null,
    totalDays: 1,
    estimatedCost: 100_000,
    days: [
      {
        dayNumber: 1,
        theme: "Ngày 1",
        destinations: [destination(21, 1), destination(999, 2)],
      },
    ],
  };

  const result = reconcileGeneratedItinerarySelection(
    itinerary,
    new Set([21, 999]),
    new Set([21]),
  );

  assert.deepEqual(
    result.days[0].destinations.map((item) => item.placeId),
    [21],
  );
});
