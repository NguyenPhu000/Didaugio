import assert from "node:assert/strict";
import test from "node:test";
import { createRefundTransition } from "../src/services/payment/refundTransition.service.js";

function createHarness() {
  const payment = { id: 1, booking_id: 2, status: "paid", amount: 100, currency: "VND", refund_amount: 0 };
  const booking = {
    id: 2,
    businessId: 3,
    status: "paid_pending_confirm",
    paymentStatus: "paid",
    adminEarned: 10,
    businessEarned: 90,
  };
  const attempts = [];
  const ledger = [];
  const calls = { partnerWallet: [], platformWallet: [] };
  const tx = {
    $queryRaw: async () => [{ ...payment }],
    payment: { update: async ({ data }) => Object.assign(payment, data) },
    refundAttempt: {
      findUnique: async ({ where }) => attempts.find((item) =>
        (where.idempotencyKey && item.idempotencyKey === where.idempotencyKey) ||
        (where.id && item.id === where.id),
      ) || null,
      findFirst: async ({ where: { gateway, externalRefundId } }) => attempts.find((item) => item.gateway === gateway && item.externalRefundId === externalRefundId) || null,
      aggregate: async () => ({ _sum: { amount: attempts.filter((item) => item.status === "succeeded").reduce((sum, item) => sum + item.amount, 0) } }),
      create: async ({ data }) => { const item = { id: attempts.length + 1, ...data }; attempts.push(item); return item; },
      update: async ({ where: { id }, data }) => Object.assign(attempts.find((item) => item.id === id), data),
    },
    paymentReceipt: { aggregate: async () => ({ _sum: { amount: 100 } }) },
    booking: { findUnique: async () => ({ ...booking }), update: async ({ data }) => Object.assign(booking, data) },
    partnerWallet: { update: async ({ data }) => calls.partnerWallet.push(data) },
    platformWallet: { findFirst: async () => ({ id: 4 }), update: async ({ data }) => calls.platformWallet.push(data) },
    financialLedger: { findFirst: async () => null, create: async ({ data }) => ledger.push(data) },
  };
  return { tx, payment, booking, attempts, ledger, calls };
}

function command(overrides = {}) {
  return { paymentId: 1, source: "manual", amount: 40, currency: "VND", idempotencyKey: "refund-1", actorUserId: 9, reason: "Customer cancellation", ...overrides };
}

test("pending manual refund intent has no wallet or ledger effect", async () => {
  const { tx, attempts, ledger, calls } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const result = await transition.createRefundIntent(command());
  assert.equal(result.status, "pending");
  assert.equal(attempts.length, 1);
  assert.equal(ledger.length, 0);
  assert.equal(calls.partnerWallet.length, 0);
  assert.equal(calls.platformWallet.length, 0);
});

test("failed refund finalization changes only the attempt", async () => {
  const { tx, payment, booking, ledger, calls } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const intent = await transition.createRefundIntent(command());
  const result = await transition.failRefundAttempt({ refundAttemptId: intent.attempt.id, reason: "Gateway declined" });
  assert.equal(result.status, "failed");
  assert.equal(payment.refundAmount || 0, 0);
  assert.equal(booking.paymentStatus, "paid");
  assert.equal(ledger.length, 0);
  assert.equal(calls.partnerWallet.length, 0);
});

test("manual success uses canonical totals, is idempotent, and debits frozen balance once", async () => {
  const { tx, payment, booking, attempts, ledger, calls } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const intent = await transition.createRefundIntent(command());
  const success = await transition.succeedRefundAttempt({ refundAttemptId: intent.attempt.id });
  const replay = await transition.succeedRefundAttempt({ refundAttemptId: intent.attempt.id });
  assert.equal(success.status, "succeeded");
  assert.equal(replay.replayed, true);
  assert.equal(attempts[0].status, "succeeded");
  assert.equal(payment.refundAmount, 40);
  assert.equal(payment.status, "partially_refunded");
  assert.equal(booking.paymentStatus, "partially_refunded");
  assert.deepEqual(calls.partnerWallet, [{ frozenBalance: { decrement: 36 } }]);
  assert.deepEqual(calls.platformWallet, [{ balance: { decrement: 4 }, totalEarned: { decrement: 4 } }]);
  assert.equal(ledger.length, 1);
});

test("partial then full refund allocates the original commission exactly once", async () => {
  const { tx, payment, booking, ledger, calls } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const first = await transition.createRefundIntent(command({ amount: 40, idempotencyKey: "refund-partial" }));
  await transition.succeedRefundAttempt({ refundAttemptId: first.attempt.id });
  const last = await transition.createRefundIntent(command({ amount: 60, idempotencyKey: "refund-full" }));
  await transition.succeedRefundAttempt({ refundAttemptId: last.attempt.id });
  assert.equal(payment.status, "fully_refunded");
  assert.equal(payment.refundAmount, 100);
  assert.deepEqual(calls.partnerWallet, [{ frozenBalance: { decrement: 36 } }, { frozenBalance: { decrement: 54 } }]);
  assert.deepEqual(calls.platformWallet, [
    { balance: { decrement: 4 }, totalEarned: { decrement: 4 } },
    { balance: { decrement: 6 }, totalEarned: { decrement: 6 } },
  ]);
  assert.equal(ledger.length, 2);
  assert.equal(booking.paymentStatus, "fully_refunded");
});

test("settled booking refunds debit available instead of frozen balance", async () => {
  const { tx, calls } = createHarness();
  tx.financialLedger.findFirst = async () => ({ id: 7, type: "SETTLE" });
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const intent = await transition.createRefundIntent(command());
  await transition.succeedRefundAttempt({ refundAttemptId: intent.attempt.id });
  assert.deepEqual(calls.partnerWallet, [{ balance: { decrement: 36 } }]);
});

test("refunds above collected receipts fail closed even when Payment.refundAmount is stale", async () => {
  const { tx, payment, attempts, ledger } = createHarness();
  tx.paymentReceipt.aggregate = async () => ({ _sum: { amount: 50 } });
  payment.refund_amount = 0;
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const intent = await transition.createRefundIntent(command({ amount: 60 }));
  await assert.rejects(transition.succeedRefundAttempt({ refundAttemptId: intent.attempt.id }), (error) => error.errorCode === "REFUND_EXCEEDS_COLLECTED");
  assert.equal(attempts[0].status, "pending");
  assert.equal(ledger.length, 0);
});

test("manual refund requires actor and reason and cannot claim a gateway source", async () => {
  const { tx } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  for (const invalid of [command({ actorUserId: null }), command({ reason: "" }), command({ source: "VNPAY" })]) {
    await assert.rejects(transition.createRefundIntent(invalid), (error) => error.errorCode === "VALIDATION_ERROR");
  }
});

test("gateway finalization safely audits an exact result and rejects a conflicting replay", async () => {
  const { tx, attempts } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  const intent = await transition.createRefundIntent({
    paymentId: 1, source: "gateway", gateway: "VNPAY", amount: 40, currency: "VND", idempotencyKey: "gateway-refund-1",
  });
  await transition.succeedRefundAttempt({
    refundAttemptId: intent.attempt.id,
    gateway: "VNPAY",
    externalRefundId: "gateway-refund-result-1",
    metadata: { providerStatus: "success", signature: "must-not-persist" },
  });
  assert.equal(attempts[0].metadata.signature, undefined);
  await assert.rejects(
    transition.succeedRefundAttempt({ refundAttemptId: intent.attempt.id, gateway: "VNPAY", externalRefundId: "different-result" }),
    (error) => error.errorCode === "REFUND_DUPLICATE",
  );
});

test("idempotency fingerprint and persistence exclude raw credential-like metadata", async () => {
  const { tx, attempts } = createHarness();
  const transition = createRefundTransition({ prisma: { $transaction: (fn) => fn(tx) } });
  await transition.createRefundIntent(command({ metadata: { signature: "secret", token: "secret", channel: "admin" } }));
  assert.equal(attempts[0].metadata.signature, undefined);
  assert.equal(attempts[0].metadata.token, undefined);
  assert.equal(attempts[0].metadata.channel, "admin");
  const replay = await transition.createRefundIntent(command({ metadata: { signature: "different", token: "different", channel: "admin" } }));
  assert.equal(replay.replayed, true);
});
