import assert from "node:assert/strict";
import test from "node:test";
import { createPaymentRefundOrchestrator, createPaymentSePayRefundWebhookHandlers } from "../src/services/payment/payment.service.js";

const PAYMENT = { id: 11, booking_id: 21, status: "paid", amount: 100, currency: "VND", transaction_ref: "REFUND-11", refund_amount: 0 };

function createHarness({ valid = true, amount = 100, attempts = [{ id: 1, paymentId: 11, status: "pending", gateway: "SEPAY_BANK", amount: 100, currency: "VND", externalRefundId: null }] } = {}) {
  const payment = { ...PAYMENT };
  const calls = { verify: 0, log: 0, payment: 0, booking: 0, ledger: 0, wallet: 0, processed: 0, errors: 0 };
  const tx = {
    $queryRaw: async (parts) => String(parts.raw || parts).includes("FROM payments") ? [{ ...payment }] : [],
    refundAttempt: {
      findFirst: async ({ where }) => attempts.find((item) =>
        (where.externalRefundId ? item.gateway === where.gateway && item.externalRefundId === where.externalRefundId :
          item.paymentId === where.paymentId && item.status === where.status && item.gateway === where.gateway && item.amount === where.amount && item.currency === where.currency)) || null,
      findUnique: async ({ where }) => attempts.find((item) =>
        (where.id && item.id === where.id) || (where.idempotencyKey && item.idempotencyKey === where.idempotencyKey),
      ) || null,
      aggregate: async () => ({ _sum: { amount: attempts.filter((item) => item.status === "succeeded").reduce((sum, item) => sum + item.amount, 0) } }),
      create: async ({ data }) => { const attempt = { id: attempts.length + 1, ...data }; attempts.push(attempt); return attempt; },
      update: async ({ where: { id }, data }) => Object.assign(attempts.find((item) => item.id === id), data),
    },
    paymentReceipt: { aggregate: async () => ({ _sum: { amount: 100 } }) },
    payment: { update: async ({ data }) => { calls.payment += 1; return Object.assign(payment, data); } },
    booking: {
      findUnique: async () => ({ id: 21, businessId: 3, adminEarned: 10 }),
      update: async () => { calls.booking += 1; },
    },
    partnerWallet: { update: async () => { calls.wallet += 1; } },
    platformWallet: { findFirst: async () => ({ id: 5 }), update: async () => { calls.wallet += 1; } },
    financialLedger: { findFirst: async () => null, create: async () => { calls.ledger += 1; } },
  };
  const prisma = {
      $transaction: async (work) => work(tx),
      paymentWebhookLog: { findFirst: async () => null },
      refundAttempt: { findUnique: async ({ where: { id } }) => attempts.find((item) => item.id === id) || null },
    };
  const handlers = createPaymentSePayRefundWebhookHandlers({
    prisma,
    logger: { error: () => {}, warn: () => {}, info: () => {} },
    sepayService: { buildIpnSuccess: () => ({ success: true }), buildIpnError: (message) => ({ success: false, message }) },
    sepayWebhookService: {
      verifyWebhookSignature: () => { calls.verify += 1; return valid ? { valid: true } : { valid: false, error: "bad-signature" }; },
      parseRefundWebhook: () => ({ valid: true, data: { sepayTransactionId: 901, code: PAYMENT.transaction_ref, payoutId: null, transferAmount: amount, gateway: "VCB", transactionDate: "2027-01-01", referenceCode: "R-901" } }),
    },
    webhookLogService: {
      logWebhook: async () => { calls.log += 1; return { id: 101 }; },
      markProcessed: async () => { calls.processed += 1; },
      markError: async () => { calls.errors += 1; },
    },
  });
  return { handlers, attempts, calls, payment, prisma };
}

test("SePay refund rejects an invalid HMAC before any database audit", async () => {
  const { handlers, calls } = createHarness({ valid: false });
  assert.deepEqual(await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, { "x-sepay-signature": "bad" }, "{}"), { success: false, message: "bad-signature" });
  assert.deepEqual(calls, { verify: 1, log: 0, payment: 0, booking: 0, ledger: 0, wallet: 0, processed: 0, errors: 0 });
});

test("SePay refund amount mismatch leaves payment, booking, wallet and ledger untouched", async () => {
  const { handlers, calls } = createHarness({ amount: 99 });
  assert.deepEqual(await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, {}, "{}"), { success: true });
  assert.equal(calls.payment + calls.booking + calls.wallet + calls.ledger, 0);
});

test("SePay refund finalizes a pending attempt once and treats exact replay as a no-op", async () => {
  const { handlers, calls, attempts, payment } = createHarness();
  assert.deepEqual(await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, {}, "{}"), { success: true });
  assert.equal(attempts[0].status, "succeeded");
  assert.equal(attempts[0].externalRefundId, "901");
  assert.equal(payment.status, "fully_refunded");
  assert.equal(calls.ledger, 1);
  await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, {}, "{}");
  assert.equal(calls.ledger, 1);
});

test("protected SePay initiation persists the gateway attempt before its actual webhook finalizes it", async () => {
  const { handlers, attempts, calls, payment, prisma } = createHarness({ attempts: [] });
  const initiation = await createPaymentRefundOrchestrator({ db: prisma }).initiateSePayBankRefund(
    PAYMENT.id,
    { amount: 100, reason: "Customer cancellation", idempotencyKey: "sepay-init-11", actorUserId: 7 },
  );
  assert.equal(initiation.status, "pending");
  assert.match(initiation.transferReference, /^SEPAY-REFUND-REFUND-11-/);
  assert.deepEqual(attempts[0] && { source: attempts[0].source, gateway: attempts[0].gateway, amount: attempts[0].amount, currency: attempts[0].currency }, { source: "gateway", gateway: "SEPAY_BANK", amount: 100, currency: "VND" });
  assert.equal(calls.ledger, 0);
  await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, {}, "{}");
  assert.equal(attempts[0].status, "succeeded");
  assert.equal(calls.ledger, 1);
  assert.equal(payment.status, "fully_refunded");
});

test("SePay refund rejects a reused external reference with a conflicting amount", async () => {
  const attempts = [{ id: 1, paymentId: 11, status: "succeeded", gateway: "SEPAY_BANK", amount: 100, currency: "VND", externalRefundId: "901" }];
  const { handlers, calls } = createHarness({ amount: 99, attempts });
  assert.deepEqual(await handlers.processSePayRefundWebhook({ code: PAYMENT.transaction_ref }, {}, "{}"), { success: true });
  assert.equal(calls.payment + calls.booking + calls.wallet + calls.ledger, 0);
});
