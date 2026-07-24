import assert from "node:assert/strict";
import test from "node:test";
import { generateHybridFallback } from "../src/services/ai/hybridPlannerFallback.js";

test("hybrid fallback is deterministic and uses only supplied places", () => {
  const places = [
    { id: 4, priceFrom: 50_000, priceTo: 80_000 },
    { id: 7, priceFrom: 0, priceTo: 0 },
    { id: 9, priceFrom: 100_000, priceTo: 150_000 },
    { id: 12, priceFrom: 1, priceTo: 2 },
  ];

  const result = generateHybridFallback(places);

  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(result.timeline.map((item) => item.placeId), [4, 7, 9]);
  assert.equal(result.tripSummary.currency, "VND");
  assert.equal(result.tripSummary.totalEstimatedPriceFrom, 150_000);
  assert.equal(result.tripSummary.totalEstimatedPriceTo, 230_000);
  assert.deepEqual(generateHybridFallback(places), result);
});

test("hybrid fallback never invents IDs or costs from malformed place values", () => {
  const result = generateHybridFallback([
    { id: "not-an-id", priceFrom: 99, priceTo: 100 },
    { id: 2, priceFrom: -1, priceTo: -5 },
    { id: 3, priceFrom: "bad", priceTo: Infinity },
  ]);

  assert.deepEqual(result.timeline.map((item) => item.placeId), [2, 3]);
  assert.equal(result.tripSummary.totalEstimatedPriceFrom, 0);
  assert.equal(result.tripSummary.totalEstimatedPriceTo, 0);
  assert.deepEqual(generateHybridFallback([]).timeline, []);
});
