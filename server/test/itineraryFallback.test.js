import assert from "node:assert/strict";
import test from "node:test";
import { itineraryPreviewSchema } from "../src/models/schemas/trip/itineraryPreview.schema.js";
import { generateFallbackItinerary } from "../src/services/ai/itinerary.service.js";

test("ordinary itinerary fallback keeps its deterministic cost breakdown", () => {
  const preferences = { totalDays: 1, groupSize: 1 };
  const places = [
    { id: 1, name: "A", priceFrom: 50_000 },
    { id: 2, name: "B", priceFrom: 60_000 },
    { id: 3, name: "C", priceFrom: 70_000 },
  ];

  const result = generateFallbackItinerary(preferences, places);

  assert.equal(itineraryPreviewSchema.safeParse(result).success, true);
  assert.equal(result.estimatedCost, 180_000);
  assert.deepEqual(
    result.days[0].destinations.map((destination) => ({
      placeId: destination.placeId,
      estimatedCost: destination.estimatedCost,
    })),
    [
      { placeId: 1, estimatedCost: 50_000 },
      { placeId: 2, estimatedCost: 60_000 },
      { placeId: 3, estimatedCost: 70_000 },
    ],
  );
  assert.deepEqual(generateFallbackItinerary(preferences, places), result);
});

test("high-cost seven-day fallback stays inside the confirmation money contract", () => {
  const result = generateFallbackItinerary(
    { totalDays: 7, groupSize: 8 },
    [
      { id: 1, name: "Premium A", priceFrom: 20_000_000 },
      { id: 2, name: "Premium B", priceFrom: 20_000_000 },
      { id: 3, name: "Premium C", priceFrom: 20_000_000 },
    ],
  );

  assert.equal(itineraryPreviewSchema.safeParse(result).success, true);
  assert.ok(result.estimatedCost <= 1_000_000_000);

  const destinationCosts = result.days.flatMap((day) =>
    day.destinations.map((destination) => destination.estimatedCost),
  );
  assert.ok(
    destinationCosts.every(
      (estimatedCost) =>
        Number.isFinite(estimatedCost) &&
        estimatedCost >= 0 &&
        estimatedCost <= 1_000_000_000,
    ),
  );
  assert.equal(
    result.estimatedCost,
    destinationCosts.reduce((total, estimatedCost) => total + estimatedCost, 0),
  );
});
