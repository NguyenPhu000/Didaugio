import { BOOKING_STATUS, PAYMENT_STATUS } from "../../config/constants.js";
import ServiceError from "../../utils/serviceError.js";
import { processPaymentLedger as defaultProcessPaymentLedger } from "../booking/financialCore.service.js";
import { PAYMENT_OBLIGATION_ERROR_CODES } from "./paymentCallbackObligation.policy.js";

export const PAYMENT_TRANSITION_ERROR_CODES = Object.freeze({
  OVER_COLLECTION: "PAYMENT_OVER_COLLECTION",
  DUPLICATE_TRANSACTION: "PAYMENT_DUPLICATE_TRANSACTION",
  ALREADY_FINAL: "PAYMENT_ALREADY_FINAL",
});

function valueOf(record, snakeCase, camelCase = snakeCase) {
  return record?.[snakeCase] ?? record?.[camelCase];
}

function validationError(message) {
  return new ServiceError(message, 400, "VALIDATION_ERROR");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

function normalizeCommand(command) {
  const amount = Number(command?.amount);
  const currency = String(command?.currency || "").trim().toUpperCase();
  const source = String(command?.source || "").trim().toLowerCase();
  const method = String(command?.method || "").trim();
  const idempotencyKey = String(command?.idempotencyKey || "").trim();
  const externalTransactionId = String(command?.externalTransactionId || "").trim();
  const gateway = String(command?.gateway || source || "").trim().toUpperCase();

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw validationError("Payment receipt amount must be a positive safe integer");
  }
  if (!currency || !source || !method || !idempotencyKey || !externalTransactionId) {
    throw validationError("Payment receipt requires currency, source, method, idempotency key, and external reference");
  }
  if (source === "manual" && (!Number.isInteger(command.actorUserId) || !String(command.reason || "").trim())) {
    throw validationError("Manual payment receipt requires an actor and reason");
  }

  return {
    ...command,
    amount,
    currency,
    source,
    method,
    gateway,
    idempotencyKey,
    externalTransactionId,
    reason: command.reason ? String(command.reason).trim() : null,
  };
}

function replayFingerprint(command) {
  return JSON.stringify(stableValue({
    amount: command.amount,
    currency: command.currency,
    source: command.source,
    gateway: command.gateway,
    method: command.method,
    externalTransactionId: command.externalTransactionId,
    actorUserId: command.actorUserId ?? null,
    reason: command.reason ?? null,
    metadata: command.metadata || {},
  }));
}

function assertSameReceiptCommand(receipt, command, paymentId, fingerprint) {
  const isSame =
    Number(receipt.paymentId) === paymentId &&
    receipt.metadata?._replayFingerprint === fingerprint;
  if (!isSame) {
    throw new ServiceError(
      "Idempotency or external transaction reference conflicts with an existing receipt",
      409,
      PAYMENT_TRANSITION_ERROR_CODES.DUPLICATE_TRANSACTION,
    );
  }
}

async function lockPayment(tx, command) {
  const paymentId = Number(command.paymentId);
  const transactionRef = String(command.transactionRef || "").trim();
  if (!Number.isInteger(paymentId) && !transactionRef) {
    throw validationError("Payment receipt requires paymentId or transactionRef");
  }

  const rows = Number.isInteger(paymentId)
    ? await tx.$queryRaw`
        SELECT id, status, amount, currency, transaction_ref, booking_id, paid_at
        FROM payments WHERE id = ${paymentId} LIMIT 1 FOR UPDATE
      `
    : await tx.$queryRaw`
        SELECT id, status, amount, currency, transaction_ref, booking_id, paid_at
        FROM payments WHERE transaction_ref = ${transactionRef} LIMIT 1 FOR UPDATE
      `;
  if (!rows?.length) {
    throw new ServiceError("Payment not found", 404, "NOT_FOUND");
  }
  return rows[0];
}

function receiptResult({ receipt, payment, collectedAmount, replayed, transitioned }) {
  const obligation = Number(valueOf(payment, "amount"));
  const status = collectedAmount === obligation ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID;
  return {
    receipt,
    collectedAmount,
    outstandingAmount: obligation - collectedAmount,
    status,
    replayed: Boolean(replayed),
    transitioned: Boolean(transitioned),
  };
}

export function createPaymentTransition({ processPaymentLedger = defaultProcessPaymentLedger } = {}) {
  async function receiptSummary(tx, paymentId) {
    const summary = await tx.paymentReceipt.aggregate({
      where: { paymentId, status: "succeeded" },
      _sum: { amount: true },
    });
    return Number(summary?._sum?.amount || 0);
  }

  async function recordSucceededReceipt(tx, rawCommand) {
    const command = normalizeCommand(rawCommand);
    const payment = await lockPayment(tx, command);
    const paymentId = Number(valueOf(payment, "id"));
    const fingerprint = replayFingerprint(command);
    const expectedReference = String(valueOf(payment, "transaction_ref", "transactionRef") || "");
    if (command.transactionRef && command.transactionRef !== expectedReference) {
      throw new ServiceError(
        "Payment reference does not match its obligation",
        422,
        PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH,
      );
    }

    const replay = await tx.paymentReceipt.findUnique({
      where: { idempotencyKey: command.idempotencyKey },
    });
    if (replay) {
      assertSameReceiptCommand(replay, command, paymentId, fingerprint);
      const collectedAmount = await receiptSummary(tx, paymentId);
      return receiptResult({ receipt: replay, payment, collectedAmount, replayed: true });
    }

    const externalReplay = await tx.paymentReceipt.findFirst({
      where: {
        gateway: command.gateway,
        externalTransactionId: command.externalTransactionId,
      },
    });
    if (externalReplay) {
      assertSameReceiptCommand(externalReplay, command, paymentId, fingerprint);
      const collectedAmount = await receiptSummary(tx, paymentId);
      return receiptResult({ receipt: externalReplay, payment, collectedAmount, replayed: true });
    }

    const obligation = Number(valueOf(payment, "amount"));
    const paymentCurrency = String(valueOf(payment, "currency") || "").toUpperCase();
    if (!Number.isSafeInteger(obligation) || obligation <= 0) {
      throw validationError("Payment obligation is invalid");
    }
    if (paymentCurrency !== command.currency) {
      throw new ServiceError(
        "Payment currency does not match its obligation",
        422,
        PAYMENT_OBLIGATION_ERROR_CODES.CURRENCY_MISMATCH,
      );
    }
    if ([PAYMENT_STATUS.PAID, PAYMENT_STATUS.FULLY_REFUNDED].includes(valueOf(payment, "status"))) {
      throw new ServiceError("Payment is already final", 409, PAYMENT_TRANSITION_ERROR_CODES.ALREADY_FINAL);
    }

    const collectedBefore = await receiptSummary(tx, paymentId);
    const collectedAmount = collectedBefore + command.amount;
    if (collectedAmount > obligation) {
      throw new ServiceError("Successful receipts exceed the payment obligation", 422, PAYMENT_TRANSITION_ERROR_CODES.OVER_COLLECTION);
    }

    const receipt = await tx.paymentReceipt.create({
      data: {
        paymentId,
        source: command.source,
        gateway: command.gateway,
        amount: command.amount,
        currency: command.currency,
        externalTransactionId: command.externalTransactionId,
        idempotencyKey: command.idempotencyKey,
        actorUserId: command.actorUserId || null,
        status: "succeeded",
        metadata: {
          method: command.method,
          reason: command.reason,
          ...(command.metadata || {}),
          _replayFingerprint: fingerprint,
        },
      },
    });

    if (collectedAmount < obligation) {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PAYMENT_STATUS.PARTIALLY_PAID },
      });
      await tx.booking.update({
        where: { id: Number(valueOf(payment, "booking_id", "bookingId")) },
        data: { paymentStatus: PAYMENT_STATUS.PARTIALLY_PAID },
      });
      return receiptResult({ receipt, payment, collectedAmount });
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PAYMENT_STATUS.PAID,
        paidAt: command.paidAt ? new Date(command.paidAt) : new Date(),
        paymentMethod: command.method,
        transactionId: command.externalTransactionId,
        bankCode: command.bankCode || null,
        paymentData: command.paymentData || undefined,
      },
    });
    const bookingId = Number(valueOf(payment, "booking_id", "bookingId"));
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BOOKING_STATUS.PAID_PENDING_CONFIRM,
        paymentStatus: PAYMENT_STATUS.PAID,
        confirmedAt: null,
      },
      select: {
        id: true,
        businessId: true,
        finalPrice: true,
        service: { select: { business: { select: { commissionRate: true } } } },
      },
    });
    const commissionRate = Number(booking.service?.business?.commissionRate) || 10;
    await processPaymentLedger(tx, booking.id, booking.finalPrice, commissionRate, booking.businessId);
    await tx.bookingActionLog.create({
      data: {
        bookingId,
        action: "approve",
        actorUserId: command.actorUserId || null,
        metadata: { source: command.source, gateway: command.gateway },
      },
    });
    return receiptResult({ receipt, payment, collectedAmount, transitioned: true });
  }

  return { recordSucceededReceipt };
}

export const recordSucceededReceipt = (...args) =>
  createPaymentTransition().recordSucceededReceipt(...args);
