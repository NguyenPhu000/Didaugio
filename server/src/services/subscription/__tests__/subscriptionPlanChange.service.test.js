import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScheduledDowngradeMetadata,
  clearScheduledDowngrade,
  getPlanChangeDirection,
  getScheduledDowngrade,
  getSubscriptionPrice,
} from "../subscriptionPlanChange.service.js";

test("getPlanChangeDirection classifies upgrade, downgrade, and same plan", () => {
  const basic = { id: 1, sortOrder: 10 };
  const plus = { id: 2, sortOrder: 20 };

  assert.equal(getPlanChangeDirection(basic, plus), "upgrade");
  assert.equal(getPlanChangeDirection(plus, basic), "downgrade");
  assert.equal(getPlanChangeDirection(basic, { ...basic }), "same");
});

test("getSubscriptionPrice prefers yearly price only for yearly cycle", () => {
  const plan = { priceMonthly: 99000, priceYearly: 990000 };

  assert.equal(getSubscriptionPrice(plan, "monthly"), 99000);
  assert.equal(getSubscriptionPrice(plan, "yearly"), 990000);
  assert.equal(getSubscriptionPrice({ ...plan, priceYearly: null }, "yearly"), 99000);
});

test("buildScheduledDowngradeMetadata stores downgrade at current period end", () => {
  const effectiveAt = new Date("2026-07-31T16:59:59.000Z");
  const requestedAt = new Date("2026-06-28T08:00:00.000Z");
  const metadata = buildScheduledDowngradeMetadata(
    { autoRenew: true },
    {
      currentPlanId: 3,
      targetPlan: { id: 1, name: "Basic", slug: "basic" },
      effectiveAt,
      requestedAt,
    },
  );

  assert.equal(metadata.autoRenew, true);
  assert.deepEqual(metadata.scheduledDowngrade, {
    currentPlanId: 3,
    targetPlanId: 1,
    targetPlanName: "Basic",
    targetPlanSlug: "basic",
    effectiveAt: "2026-07-31T16:59:59.000Z",
    requestedAt: "2026-06-28T08:00:00.000Z",
  });
  assert.equal(getScheduledDowngrade(metadata).targetPlanId, 1);
});

test("clearScheduledDowngrade removes only the downgrade marker", () => {
  const metadata = clearScheduledDowngrade({
    autoRenew: true,
    scheduledDowngrade: { targetPlanId: 1 },
  });

  assert.deepEqual(metadata, { autoRenew: true });
});
