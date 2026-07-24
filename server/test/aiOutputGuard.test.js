import assert from "node:assert/strict";
import test from "node:test";
import {
  assertItineraryPlaceIds,
  validateHybridPlanOutput,
} from "../src/services/ai/aiOutputGuard.js";
import {
  buildValidatedCachedItineraryResult,
  parseAndValidateItineraryOutput,
} from "../src/services/ai/itineraryOutput.js";
import { itineraryDraftSchema } from "../src/models/schemas/trip/trip.schema.js";

const places = [{ id: 1 }, { id: "2" }, { id: 3 }];

function validHybridPlan(overrides = {}) {
  return {
    tripSummary: {
      totalEstimatedPriceFrom: 0,
      totalEstimatedPriceTo: 100000,
      currency: "VND",
      costBreakdown: {
        food: { from: 0, to: 100000 },
        tickets: { from: 0, to: 0 },
        transportEstimated: { from: 0, to: 0 },
      },
    },
    timeline: [
      { timeSlot: "Sáng", placeId: 1, reason: "Điểm khởi đầu thuận tiện" },
      { timeSlot: "Trưa", placeId: 2, reason: "Phù hợp để nghỉ và ăn trưa" },
    ],
    ...overrides,
  };
}

function assertInvalidOutput(callback) {
  assert.throws(callback, (error) => {
    assert.equal(error.statusCode, 502);
    assert.equal(error.code, "AI_INVALID_OUTPUT");
    return true;
  });
}

function validItinerary(overrides = {}) {
  return {
    title: "Một ngày ở Cần Thơ",
    description: "Lịch trình hợp lệ",
    totalDays: 1,
    estimatedCost: 100000,
    days: [
      {
        dayNumber: 1,
        theme: "Khám phá",
        destinations: [
          {
            placeId: 1,
            order: 1,
            startTime: "08:00",
            endTime: "10:00",
            durationMinutes: 120,
            note: "Tham quan",
            transportToNext: "Đi bộ",
            estimatedCost: 100000,
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("hybrid output accepts only bounded, allow-listed numeric IDs", () => {
  const plan = validateHybridPlanOutput(validHybridPlan(), places);

  assert.deepEqual(plan, {
    tripSummary: validHybridPlan().tripSummary,
    timeline: [
      { timeSlot: "Sáng", placeId: 1, reason: "Điểm khởi đầu thuận tiện" },
      { timeSlot: "Trưa", placeId: 2, reason: "Phù hợp để nghỉ và ăn trưa" },
    ],
  });
});

test("hybrid output rejects malformed structures and out-of-range monetary values", () => {
  assertInvalidOutput(() =>
    validateHybridPlanOutput({ tripSummary: {}, timeline: [] }, places),
  );
  assertInvalidOutput(() =>
    validateHybridPlanOutput(
      validHybridPlan({
        tripSummary: {
          ...validHybridPlan().tripSummary,
          totalEstimatedPriceTo: 1_000_000_001,
        },
      }),
      places,
    ),
  );
  assertInvalidOutput(() =>
    validateHybridPlanOutput(
      validHybridPlan({
        timeline: [{ timeSlot: "Sáng", placeId: 1, reason: "x".repeat(241) }],
      }),
      places,
    ),
  );
});

test("hybrid output rejects duplicate and unknown place IDs", () => {
  assertInvalidOutput(() =>
    validateHybridPlanOutput(
      validHybridPlan({
        timeline: [
          { timeSlot: "Sáng", placeId: 1, reason: "A" },
          { timeSlot: "Trưa", placeId: 1, reason: "B" },
          { timeSlot: "Chiều", placeId: 999, reason: "C" },
        ],
      }),
      places,
    ),
  );
  assertInvalidOutput(() =>
    validateHybridPlanOutput(
      validHybridPlan({
        timeline: [{ timeSlot: "Sáng", placeId: "1", reason: "Không phải số" }],
      }),
      places,
    ),
  );
});

test("itinerary days reject unknown IDs while preserving valid multi-day repeats", () => {
  const days = [
    { dayNumber: 1, destinations: [{ placeId: 1 }] },
    { dayNumber: 2, destinations: [{ placeId: 1 }, { placeId: 2 }] },
  ];

  assert.deepEqual(assertItineraryPlaceIds(days, places), [
    { dayNumber: 1, destinations: [{ placeId: 1 }] },
    { dayNumber: 2, destinations: [{ placeId: 1 }, { placeId: 2 }] },
  ]);
  assertInvalidOutput(() =>
    assertItineraryPlaceIds([{ dayNumber: 1, destinations: [{ placeId: 9 }] }], places),
  );
  assertInvalidOutput(() =>
    assertItineraryPlaceIds([{ dayNumber: 1, destinations: [{ placeId: "1" }] }], places),
  );
});

test("unparseable itinerary provider output maps to AI_INVALID_OUTPUT", () => {
  assertInvalidOutput(() =>
    parseAndValidateItineraryOutput("this is not itinerary JSON", places),
  );
});

test("provider itinerary output is never looser than the confirmation preview contract", () => {
  const valid = validItinerary();
  const parsed = parseAndValidateItineraryOutput(JSON.stringify(valid), places);
  assert.equal(itineraryDraftSchema.safeParse(parsed).success, true);

  for (const invalid of [
    validItinerary({ title: "x".repeat(201) }),
    validItinerary({
      days: [
        {
          ...valid.days[0],
          destinations: [
            {
              ...valid.days[0].destinations[0],
              startTime: "morning",
              endTime: "later",
            },
          ],
        },
      ],
    }),
    validItinerary({
      days: [
        {
          ...valid.days[0],
          destinations: [
            {
              ...valid.days[0].destinations[0],
              distanceToNext: 999,
            },
          ],
        },
      ],
    }),
  ]) {
    assertInvalidOutput(() =>
      parseAndValidateItineraryOutput(JSON.stringify(invalid), places),
    );
  }
});

test("only a validated cache hit is returned without mutating cached data", () => {
  const validCache = { itineraryData: validItinerary() };
  const originalCache = structuredClone(validCache);
  const validResult = buildValidatedCachedItineraryResult(validCache, places);

  assert.deepEqual(validResult, {
    parsed: validItinerary(),
    raw: JSON.stringify(validItinerary()),
    tokensUsed: 0,
    responseTimeMs: 0,
  });
  assert.deepEqual(validCache, originalCache);

  const invalidResult = buildValidatedCachedItineraryResult(
    {
      itineraryData: validItinerary({
        days: [{
          ...validItinerary().days[0],
          destinations: [{ ...validItinerary().days[0].destinations[0], placeId: 999 }],
        }],
      }),
    },
    places,
  );

  assert.equal(invalidResult, null);
});
