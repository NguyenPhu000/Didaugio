import assert from "node:assert/strict";
import test from "node:test";
import { cancel, cancelMyBooking } from "../src/services/booking/booking.service.js";
import { quickRejectBooking } from "../src/services/booking/bookingSchedule.service.js";

function harness({ userId = 7 } = {}) {
  const persisted = { id: 41, userId, status: "pending", voucherId: null, bookingCode: "B41", paymentStatus: "paid", businessId: 3, businessEarned: 90 };
  const calls = [];
  const tx = {
    $queryRaw: async () => [],
    $executeRaw: async () => 1,
    booking: {
      findUnique: async () => ({ ...persisted }),
      update: async ({ data }) => { calls.push("booking-update"); Object.assign(persisted, data); return { ...persisted }; },
    },
    bookingActionLog: { create: async () => { calls.push("action-log"); } },
  };
  const attempts = [];
  const overrides = {
    prisma: { $transaction: async (work) => work(tx) },
    createCancelledRefundIntentInTransaction: async () => { calls.push("refund-intent"); const attempt = { id: 88, status: "pending" }; attempts.push(attempt); return { attempt }; },
    finalizeCancelledRefund: async () => { calls.push("finalize"); throw new Error("gateway unavailable"); },
    eventEmitter: { emit: () => calls.push("emit") },
    expirePendingBookings: async () => calls.push("expire"),
    getById: async () => ({ ...persisted }),
  };
  return { persisted, attempts, calls, overrides };
}

for (const [name, invoke, expectedStatus] of [
  ["cancel", (o) => cancel(41, "Customer cancelled", 7, "user", o), "cancelled"],
  ["cancelMyBooking", (o) => cancelMyBooking(41, 7, "Customer cancelled", o), "cancelled"],
  ["quickRejectBooking", (o) => quickRejectBooking(41, "Business rejected", 9, undefined, o), "rejected"],
]) {
  test(`${name} commits booking outcome and pending refund before a recoverable finalizer failure`, async () => {
    const { persisted, attempts, calls, overrides } = harness();
    await assert.rejects(invoke(overrides), /gateway unavailable/);
    assert.equal(persisted.status, expectedStatus);
    assert.deepEqual(attempts, [{ id: 88, status: "pending" }]);
    assert.deepEqual(calls.filter((call) => ["booking-update", "refund-intent", "action-log", "finalize"].includes(call)), ["booking-update", "refund-intent", "action-log", "finalize"]);
    assert.equal(calls.includes("emit"), false);
  });
}
