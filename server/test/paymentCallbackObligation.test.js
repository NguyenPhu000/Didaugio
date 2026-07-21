import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSafeWebhookLogEntry,
  PAYMENT_OBLIGATION_ERROR_CODES,
  validateCallbackObligation,
} from "../src/services/payment/paymentCallbackObligation.policy.js";

const payment = {
  amount: 125000,
  currency: "VND",
  transactionRef: "DDG-REF-123",
};

test("VNPay callback obligation accepts an exact signed amount, currency, and reference", () => {
  const result = validateCallbackObligation({
    gateway: "VNPAY",
    payment,
    callback: {
      reference: "DDG-REF-123",
      amount: "12500000",
      currency: "vnd",
    },
  });

  assert.deepEqual(result, { valid: true, code: null });
});

test("VNPay callback obligation rejects a wrong amount without exposing callback data", () => {
  const result = validateCallbackObligation({
    gateway: "VNPAY",
    payment,
    callback: {
      reference: "DDG-REF-123",
      amount: "12499900",
      currency: "VND",
      signature: "secret-signature",
    },
  });

  assert.deepEqual(result, {
    valid: false,
    code: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
  });
  assert.equal(JSON.stringify(result).includes("secret-signature"), false);
});

test("callback obligation rejects malformed, fractional, unsafe, and non-positive amounts", () => {
  const invalidCallbacks = [
    { gateway: "VNPAY", amount: undefined },
    { gateway: "VNPAY", amount: "12500001" },
    { gateway: "VNPAY", amount: "99999999999999999999999900" },
    { gateway: "MOMO", amount: "125000" },
    { gateway: "MOMO", amount: 125000.5 },
    { gateway: "MOMO", amount: 0 },
    { gateway: "MOMO", amount: -1 },
    { gateway: "MOMO", amount: Number.MAX_SAFE_INTEGER + 1 },
  ];

  for (const { gateway, amount } of invalidCallbacks) {
    const result = validateCallbackObligation({
      gateway,
      payment,
      callback: {
        reference: payment.transactionRef,
        amount,
        currency: "VND",
      },
    });
    assert.deepEqual(result, {
      valid: false,
      code: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
    });
  }
});

test("callback obligation rejects wrong gateway currency and missing reference", () => {
  const wrongCurrency = validateCallbackObligation({
    gateway: "VNPAY",
    payment,
    callback: {
      reference: payment.transactionRef,
      amount: "12500000",
      currency: "USD",
    },
  });
  const missingReference = validateCallbackObligation({
    gateway: "VNPAY",
    payment,
    callback: { reference: null, amount: "12500000", currency: "VND" },
  });

  assert.deepEqual(wrongCurrency, {
    valid: false,
    code: PAYMENT_OBLIGATION_ERROR_CODES.CURRENCY_MISMATCH,
  });
  assert.deepEqual(missingReference, {
    valid: false,
    code: PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH,
  });

  assert.deepEqual(
    validateCallbackObligation({
      gateway: "MOMO",
      payment: { ...payment, currency: "USD" },
      callback: { reference: payment.transactionRef, amount: 125000 },
    }),
    {
      valid: false,
      code: PAYMENT_OBLIGATION_ERROR_CODES.CURRENCY_MISMATCH,
    },
  );
});

test("matching paid replays are eligible for idempotent acknowledgement while mismatched replays are rejected", () => {
  const matchingReplay = validateCallbackObligation({
    gateway: "MOMO",
    payment,
    callback: { reference: payment.transactionRef, amount: 125000, currency: "VND" },
  });
  const mismatchedReplay = validateCallbackObligation({
    gateway: "MOMO",
    payment,
    callback: { reference: payment.transactionRef, amount: 1, currency: "VND" },
  });

  assert.deepEqual(matchingReplay, { valid: true, code: null });
  assert.deepEqual(mismatchedReplay, {
    valid: false,
    code: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
  });
});

test("webhook mismatch log entries retain only safe gateway metadata", () => {
  const entry = buildSafeWebhookLogEntry({
    gateway: "VNPAY",
    reference: "DDG-REF-123",
    outcome: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
    hasSignature: false,
    callback: {
      vnp_SecureHash: "signature-secret",
      credential: "credential-secret",
      amount: "12500000",
    },
  });

  assert.deepEqual(entry, {
    gateway: "VNPAY",
    payload: {
      gateway: "VNPAY",
      reference: "DDG-REF-123",
      outcome: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
      hasSignature: false,
    },
    signature: null,
  });
  assert.equal(JSON.stringify(entry).includes("secret"), false);
});
