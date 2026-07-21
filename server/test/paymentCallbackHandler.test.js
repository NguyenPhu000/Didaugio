import assert from "node:assert/strict";
import test from "node:test";
import {
  createPaymentCallbackHandlers,
} from "../src/services/payment/payment.service.js";

const EXPECTED_PAYMENT = {
  id: 10,
  status: "unpaid",
  amount: 125000,
  currency: "VND",
  transaction_ref: "DDG-REF-123",
  booking_id: 22,
};

function createHarness({ gateway, payment = EXPECTED_PAYMENT, verified = true, callback }) {
  payment = { ...payment };
  const calls = {
    sequence: [],
    paymentUpdate: 0,
    bookingUpdate: 0,
    ledger: 0,
    wallet: 0,
    financialLedger: 0,
    actionLog: 0,
    logWebhook: [],
    markProcessed: 0,
    markError: [],
    errors: [],
  };
  const receipts = [];

  const tx = {
    $queryRaw: async () => [payment],
    payment: {
      update: async ({ data }) => {
        calls.paymentUpdate += 1;
        Object.assign(payment, data);
        return payment;
      },
    },
    paymentReceipt: {
      findUnique: async ({ where: { idempotencyKey } }) =>
        receipts.find((receipt) => receipt.idempotencyKey === idempotencyKey) || null,
      findFirst: async ({ where: { gateway: receiptGateway, externalTransactionId } }) =>
        receipts.find(
          (receipt) =>
            receipt.gateway === receiptGateway &&
            receipt.externalTransactionId === externalTransactionId,
        ) || null,
      aggregate: async () => ({
        _sum: {
          amount: receipts
            .filter((receipt) => receipt.status === "succeeded")
            .reduce((sum, receipt) => sum + receipt.amount, 0),
        },
      }),
      create: async ({ data }) => {
        const receipt = { id: receipts.length + 1, ...data };
        receipts.push(receipt);
        return receipt;
      },
    },
    booking: {
      update: async () => {
        calls.bookingUpdate += 1;
        return {
          id: payment.booking_id,
          businessId: 31,
          finalPrice: payment.amount,
          service: { business: { commissionRate: 10 } },
        };
      },
    },
    bookingActionLog: {
      create: async () => {
        calls.actionLog += 1;
      },
    },
    partnerWallet: {
      update: async () => {
        calls.wallet += 1;
      },
    },
    financialLedger: {
      create: async () => {
        calls.financialLedger += 1;
      },
    },
  };

  const vnpayService = {
    verifyIpn: () => {
      calls.sequence.push("verify");
      return verified
        ? {
            valid: true,
            data: {
              transactionRef: callback.reference,
              responseCode: callback.outcome ?? "00",
              amount: callback.amount,
              currency: callback.currency,
            },
          }
        : { valid: false, error: "Invalid signature" };
    },
    buildIpnResponse: (RspCode, Message) => ({ RspCode, Message }),
  };
  const momoService = {
    verifyIpnSignature: () => {
      calls.sequence.push("verify");
      return verified ? { valid: true } : { valid: false, error: "Invalid signature" };
    },
    buildIpnResponse: (resultCode, message) => ({ resultCode, message }),
  };

  const handlers = createPaymentCallbackHandlers({
    prisma: {
      $transaction: async (work) => work(tx),
      booking: {
        findUnique: async () => ({
          id: payment.booking_id,
          bookingCode: "BOOKING-1",
          userId: 51,
          businessId: 31,
          service: { business: { ownerId: 61 } },
        }),
      },
    },
    vnpayService,
    momoService,
    webhookLogService: {
      logWebhook: async (entry) => {
        calls.sequence.push("logWebhook");
        calls.logWebhook.push(entry);
        return { id: 9 };
      },
      markProcessed: async () => {
        calls.markProcessed += 1;
      },
      markError: async (entry) => {
        calls.markError.push(entry);
      },
    },
    processPaymentLedger: async () => {
      calls.ledger += 1;
    },
    eventEmitter: { emit: () => {} },
    logger: { error: (...args) => calls.errors.push(args) },
  });

  return { handlers, calls, receipts };
}

function assertNoMutation(calls) {
  assert.deepEqual(
    {
      paymentUpdate: calls.paymentUpdate,
      bookingUpdate: calls.bookingUpdate,
      ledger: calls.ledger,
      wallet: calls.wallet,
      financialLedger: calls.financialLedger,
      actionLog: calls.actionLog,
    },
    {
      paymentUpdate: 0,
      bookingUpdate: 0,
      ledger: 0,
      wallet: 0,
      financialLedger: 0,
      actionLog: 0,
    },
  );
}

for (const gateway of ["VNPAY", "MOMO"]) {
  const invoke = async (handlers, callback) =>
    gateway === "VNPAY"
      ? handlers.processVNPayIPN({
          vnp_TxnRef: callback.reference,
          vnp_SecureHash: "signature-secret",
        })
      : handlers.processMoMoIPN({
          orderId: callback.reference,
          amount: callback.amount,
          resultCode: callback.outcome ?? 0,
          signature: "signature-secret",
        });

  const validCallback = {
    reference: EXPECTED_PAYMENT.transaction_ref,
    amount: gateway === "VNPAY" ? "12500000" : 125000,
    currency: "VND",
  };

  test(`${gateway} verifies the signature before writing a safe webhook audit record`, async () => {
    const { handlers, calls } = createHarness({ gateway, callback: validCallback });
    await invoke(handlers, validCallback);

    assert.deepEqual(calls.sequence.slice(0, 2), ["verify", "logWebhook"]);
    assert.deepEqual(calls.logWebhook[0], {
      gateway,
      payload: { gateway, reference: EXPECTED_PAYMENT.transaction_ref, outcome: "received", hasSignature: true },
      signature: null,
    });
    assert.equal(JSON.stringify(calls.logWebhook[0]).includes("signature-secret"), false);
  });

  for (const [label, callback] of [
    ["amount", { ...validCallback, amount: gateway === "VNPAY" ? "12499900" : 124999 }],
    ["currency", { ...validCallback, currency: "USD" }],
    ["reference", { ...validCallback, reference: "DDG-WRONG-REF" }],
    [
      "failed gateway outcome with a wrong amount",
      { ...validCallback, amount: gateway === "VNPAY" ? "12499900" : 124999, outcome: gateway === "VNPAY" ? "24" : 1001 },
    ],
  ]) {
    test(`${gateway} ${label} mismatch performs no mutation`, async () => {
      const { handlers, calls } = createHarness({
        gateway,
        callback,
        payment:
          gateway === "MOMO" && label === "currency"
            ? { ...EXPECTED_PAYMENT, currency: "USD" }
            : EXPECTED_PAYMENT,
      });
      const result = await invoke(handlers, callback);

      assertNoMutation(calls);
      assert.equal(calls.markProcessed, 0);
      assert.equal(calls.markError.length, 1);
      assert.deepEqual(
        result,
        gateway === "VNPAY"
          ? { RspCode: label === "reference" ? "04" : "04", Message: "Invalid callback obligation" }
          : { resultCode: 1000, message: "Invalid callback obligation" },
      );
    });
  }

  test(`${gateway} matching paid replay is acknowledged idempotently, while a mismatched replay is rejected`, async () => {
    const paidPayment = { ...EXPECTED_PAYMENT, status: "paid" };
    const matching = createHarness({ gateway, payment: paidPayment, callback: validCallback });
    const matchingResult = await invoke(matching.handlers, validCallback);
    assertNoMutation(matching.calls);
    assert.equal(matching.calls.markProcessed, 1);
    assert.deepEqual(
      matchingResult,
      gateway === "VNPAY"
        ? { RspCode: "02", Message: "Order already confirmed" }
        : { resultCode: 0, message: "Order already confirmed" },
    );

    const mismatchedCallback = {
      ...validCallback,
      amount: gateway === "VNPAY" ? "12499900" : 124999,
    };
    const mismatched = createHarness({ gateway, payment: paidPayment, callback: mismatchedCallback });
    const mismatchedResult = await invoke(mismatched.handlers, mismatchedCallback);
    assertNoMutation(mismatched.calls);
    assert.equal(mismatched.calls.markProcessed, 0);
    assert.equal(mismatched.calls.markError.length, 1);
    assert.deepEqual(
      mismatchedResult,
      gateway === "VNPAY"
        ? { RspCode: "04", Message: "Invalid callback obligation" }
        : { resultCode: 1000, message: "Invalid callback obligation" },
    );
  });
}

test("invalid signatures are logged only after verification", async () => {
  const callback = { reference: EXPECTED_PAYMENT.transaction_ref, amount: "12500000", currency: "VND" };
  const { handlers, calls } = createHarness({ gateway: "VNPAY", callback, verified: false });
  const result = await handlers.processVNPayIPN({
    vnp_TxnRef: callback.reference,
    vnp_SecureHash: "signature-secret",
  });

  assert.deepEqual(calls.sequence.slice(0, 2), ["verify", "logWebhook"]);
  assert.equal(calls.markError.length, 1);
  assert.equal(calls.markError[0].errorMsg, "PAYMENT_SIGNATURE_INVALID");
  assert.deepEqual(result, { RspCode: "97", Message: "Invalid signature" });
});

test("gateway handlers persist one canonical receipt and one ledger transition for an exact callback replay", async () => {
  const callback = { reference: EXPECTED_PAYMENT.transaction_ref, amount: "12500000", currency: "VND" };
  const { handlers, calls, receipts } = createHarness({ gateway: "VNPAY", callback });
  const query = {
    vnp_TxnRef: callback.reference,
    vnp_SecureHash: "signature-secret",
  };

  const first = await handlers.processVNPayIPN(query);
  const replay = await handlers.processVNPayIPN(query);

  assert.deepEqual(first, { RspCode: "00", Message: "Confirm success" }, JSON.stringify(calls.errors));
  assert.deepEqual(replay, { RspCode: "02", Message: "Order already confirmed" });
  assert.equal(receipts.length, 1);
  assert.equal(calls.ledger, 1);
  assert.equal(calls.actionLog, 1);
});
