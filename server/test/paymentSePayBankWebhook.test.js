import assert from "node:assert/strict";
import test from "node:test";
import {
  createPaymentSePayBankWebhookHandlers,
} from "../src/services/payment/payment.service.js";
import { createPaymentTransition } from "../src/services/payment/paymentTransition.service.js";

const PAYMENT = {
  id: 17,
  status: "unpaid",
  amount: 125_000,
  currency: "VND",
  transaction_ref: "DDG-SEPAY-17",
  booking_id: 22,
};

function createHarness({ validSignature = true, transferAmount = 125_000 } = {}) {
  const payment = { ...PAYMENT };
  const receipts = [];
  const calls = { sequence: [], paymentUpdate: 0, bookingUpdate: 0, ledger: 0, actionLog: 0, logEntries: [], markError: [], markProcessed: 0 };
  const tx = {
    $queryRaw: async () => [{ ...payment }],
    paymentReceipt: {
      findUnique: async ({ where: { idempotencyKey } }) => receipts.find((receipt) => receipt.idempotencyKey === idempotencyKey) || null,
      findFirst: async ({ where: { gateway, externalTransactionId } }) => receipts.find((receipt) => receipt.gateway === gateway && receipt.externalTransactionId === externalTransactionId) || null,
      aggregate: async () => ({ _sum: { amount: receipts.filter((receipt) => receipt.status === "succeeded").reduce((sum, receipt) => sum + receipt.amount, 0) } }),
      create: async ({ data }) => {
        const receipt = { id: receipts.length + 1, ...data };
        receipts.push(receipt);
        return receipt;
      },
    },
    payment: {
      update: async ({ data }) => {
        calls.paymentUpdate += 1;
        Object.assign(payment, data);
        return payment;
      },
    },
    booking: {
      update: async () => {
        calls.bookingUpdate += 1;
        return { id: payment.booking_id, businessId: 9, finalPrice: payment.amount, service: { business: { commissionRate: 10 } } };
      },
    },
    bookingActionLog: { create: async () => { calls.actionLog += 1; } },
  };
  const handlers = createPaymentSePayBankWebhookHandlers({
    prisma: {
      $transaction: async (work) => work(tx),
      booking: { findUnique: async () => ({ id: payment.booking_id, bookingCode: "B17", userId: 4, businessId: 9, service: { business: { ownerId: 7 } } }) },
    },
    logger: { error: () => {}, info: () => {}, warn: () => {} },
    sepayService: { buildIpnSuccess: () => ({ success: true }), buildIpnError: (message) => ({ success: false, message }) },
    sepayWebhookService: {
      verifyWebhookSignature: () => {
        calls.sequence.push("verify");
        return validSignature ? { valid: true } : { valid: false, error: "Invalid signature" };
      },
      parseBankWebhook: () => ({
        valid: true,
        data: { sepayTransactionId: 17001, code: PAYMENT.transaction_ref, transferAmount, gateway: "VCB", transactionDate: "2027-01-01 10:00:00", referenceCode: "BANK-17" },
      }),
    },
    webhookLogService: {
      logWebhook: async (entry) => {
        calls.sequence.push("log");
        calls.logEntries.push(entry);
        return { id: 71 };
      },
      markError: async (entry) => calls.markError.push(entry),
      markProcessed: async () => { calls.markProcessed += 1; },
    },
    eventEmitter: { emit: () => {} },
    EVENTS: { BOOKING: { PAID: "booking.paid" } },
    paymentTransition: createPaymentTransition({ processPaymentLedger: async () => { calls.ledger += 1; } }),
  });
  return { handlers, payment, receipts, calls };
}

test("SePay bank verifies before writing a sanitized log", async () => {
  const { handlers, calls } = createHarness({ validSignature: false });
  const result = await handlers.processSePayBankWebhook({ code: PAYMENT.transaction_ref, secret: "raw-secret" }, { "x-sepay-signature": "signature-secret" }, "raw-secret");

  assert.deepEqual(calls.sequence, ["verify", "log"]);
  assert.equal(JSON.stringify(calls.logEntries[0]).includes("secret"), false);
  assert.equal(calls.paymentUpdate, 0);
  assert.deepEqual(result, { success: false, message: "Invalid signature" });
});

test("SePay bank obligation mismatch makes zero financial mutations", async () => {
  const { handlers, calls, receipts } = createHarness({ transferAmount: 124_999 });
  const result = await handlers.processSePayBankWebhook({ code: PAYMENT.transaction_ref }, {}, "{}");

  assert.deepEqual(result, { success: true });
  assert.equal(receipts.length, 0);
  assert.equal(calls.paymentUpdate, 0);
  assert.equal(calls.bookingUpdate, 0);
  assert.equal(calls.ledger, 0);
  assert.equal(calls.actionLog, 0);
  assert.equal(calls.markError.length, 1);
});

test("SePay bank success writes one canonical receipt and exact replay has no duplicate ledger", async () => {
  const { handlers, calls, receipts } = createHarness();
  const first = await handlers.processSePayBankWebhook({ code: PAYMENT.transaction_ref }, {}, "{}");
  const replay = await handlers.processSePayBankWebhook({ code: PAYMENT.transaction_ref }, {}, "{}");

  assert.deepEqual(first, { success: true });
  assert.deepEqual(replay, { success: true });
  assert.equal(receipts.length, 1);
  assert.equal(calls.ledger, 1);
  assert.equal(calls.actionLog, 1);
});
