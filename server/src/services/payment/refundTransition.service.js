import { PAYMENT_STATUS } from "../../config/constants.js";
import ServiceError from "../../utils/serviceError.js";

export const REFUND_TRANSITION_ERROR_CODES = Object.freeze({
  EXCEEDS_COLLECTED: "REFUND_EXCEEDS_COLLECTED",
  DUPLICATE: "REFUND_DUPLICATE",
  INVALID_RESULT: "REFUND_INVALID_RESULT",
});

function validationError(message) {
  return new ServiceError(message, 400, "VALIDATION_ERROR");
}

function asNumber(value) {
  return Number(value ?? 0);
}

function read(record, snakeCase, camelCase = snakeCase) {
  return record?.[snakeCase] ?? record?.[camelCase];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stable(child)]));
  }
  return value;
}

function safeAuditMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return Object.fromEntries(Object.entries(metadata)
    .filter(([key, value]) =>
      !/(?:signature|secret|token|authorization|password|raw)/iu.test(key) &&
      (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null),
    )
    .map(([key, value]) => [key.slice(0, 64), typeof value === "string" ? value.slice(0, 255) : value]));
}

function normalizeIntent(raw) {
  const paymentId = Number(raw?.paymentId);
  const amount = Number(raw?.amount);
  const currency = String(raw?.currency || "").trim().toUpperCase();
  const source = String(raw?.source || "").trim().toLowerCase();
  const idempotencyKey = String(raw?.idempotencyKey || "").trim();
  const gateway = raw?.gateway ? String(raw.gateway).trim().toUpperCase() : null;
  const reason = raw?.reason ? String(raw.reason).trim() : null;

  if (!Number.isInteger(paymentId) || paymentId <= 0 || !Number.isSafeInteger(amount) || amount <= 0 || !currency || !idempotencyKey) {
    throw validationError("Refund requires a payment, positive safe-integer amount, currency, and idempotency key");
  }
  if (!["manual", "gateway"].includes(source)) {
    throw validationError("Refund source must be manual or gateway");
  }
  if (source === "manual" && (!Number.isInteger(raw?.actorUserId) || !reason)) {
    throw validationError("Manual refund requires an authorized actor and reason");
  }
  if (source === "manual" && gateway) {
    throw validationError("Manual refund cannot claim a gateway source");
  }
  if (source === "gateway" && !gateway) {
    throw validationError("Gateway refund requires a gateway");
  }
  return { ...raw, paymentId, amount, currency, source, gateway, idempotencyKey, reason };
}

function intentFingerprint(command) {
  return JSON.stringify(stable({
    paymentId: command.paymentId,
    amount: command.amount,
    currency: command.currency,
    source: command.source,
    gateway: command.gateway,
    actorUserId: command.actorUserId ?? null,
    reason: command.reason ?? null,
    metadata: safeAuditMetadata(command.metadata),
  }));
}

function assertReplay(attempt, command, fingerprint) {
  if (Number(attempt.paymentId) !== command.paymentId || attempt.metadata?._intentFingerprint !== fingerprint) {
    throw new ServiceError("Refund idempotency key conflicts with an existing attempt", 409, REFUND_TRANSITION_ERROR_CODES.DUPLICATE);
  }
}

async function lockPayment(tx, paymentId) {
  const rows = await tx.$queryRaw`
    SELECT id, booking_id, status, amount, currency, refund_amount
    FROM payments WHERE id = ${paymentId} LIMIT 1 FOR UPDATE
  `;
  if (!rows?.length) throw new ServiceError("Payment not found", 404, "NOT_FOUND");
  return rows[0];
}

async function succeededTotal(delegate, paymentId) {
  const summary = await delegate.aggregate({
    where: { paymentId, status: "succeeded" },
    _sum: { amount: true },
  });
  return asNumber(summary?._sum?.amount);
}

function result(attempt, { replayed = false, collectedAmount, refundedAmount } = {}) {
  return { attempt, status: attempt.status, replayed: Boolean(replayed), collectedAmount, refundedAmount };
}

/**
 * Stateful refunds deliberately use two database transactions. `createRefundIntent`
 * commits a pending row before a gateway adapter is called; only `succeedRefundAttempt`
 * moves balances, booking state, and the compatibility payment summary.
 */
export function createRefundTransition({ prisma, now = () => new Date() } = {}) {
  if (!prisma?.$transaction) throw new Error("createRefundTransition requires a Prisma client");

  async function createRefundIntentInTransaction(tx, rawCommand) {
    const command = normalizeIntent(rawCommand);
    const fingerprint = intentFingerprint(command);
    {
      const payment = await lockPayment(tx, command.paymentId);
      if (String(read(payment, "currency")).toUpperCase() !== command.currency) {
        throw new ServiceError("Refund currency does not match its payment", 422, "PAYMENT_CURRENCY_MISMATCH");
      }
      const existing = await tx.refundAttempt.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
      if (existing) {
        assertReplay(existing, command, fingerprint);
        return result(existing, { replayed: true });
      }
      const attempt = await tx.refundAttempt.create({
        data: {
          paymentId: command.paymentId,
          source: command.source,
          gateway: command.gateway,
          amount: command.amount,
          currency: command.currency,
          idempotencyKey: command.idempotencyKey,
          actorUserId: command.actorUserId || null,
          status: "pending",
          reason: command.reason,
          metadata: { ...safeAuditMetadata(command.metadata), _intentFingerprint: fingerprint },
        },
      });
      return result(attempt);
    }
  }

  async function createRefundIntent(rawCommand) {
    return prisma.$transaction((tx) => createRefundIntentInTransaction(tx, rawCommand));
  }

  async function succeedRefundAttempt({ refundAttemptId, externalRefundId = null, gateway = null, metadata = {} } = {}) {
    const attemptId = Number(refundAttemptId);
    if (!Number.isInteger(attemptId) || attemptId <= 0) throw validationError("Refund attempt id is invalid");
    const normalizedExternalId = externalRefundId ? String(externalRefundId).trim() : null;
    const normalizedGateway = gateway ? String(gateway).trim().toUpperCase() : null;

    return prisma.$transaction(async (tx) => {
      const attempt = await tx.refundAttempt.findUnique({ where: { id: attemptId } });
      if (!attempt) throw new ServiceError("Refund attempt not found", 404, "NOT_FOUND");
      const payment = await lockPayment(tx, attempt.paymentId);

      if (attempt.status === "succeeded") {
        if (
          (normalizedExternalId && normalizedExternalId !== attempt.externalRefundId) ||
          (normalizedGateway && normalizedGateway !== String(attempt.gateway || "").toUpperCase())
        ) {
          throw new ServiceError("Refund result conflicts with an existing succeeded attempt", 409, REFUND_TRANSITION_ERROR_CODES.DUPLICATE);
        }
        return result(attempt, { replayed: true });
      }
      if (attempt.status !== "pending") {
        throw new ServiceError("Only a pending refund can succeed", 409, REFUND_TRANSITION_ERROR_CODES.INVALID_RESULT);
      }
      if (attempt.source === "manual" && (normalizedExternalId || normalizedGateway)) {
        throw validationError("Manual refund cannot be finalized as a gateway result");
      }
      if (attempt.source === "gateway") {
        if (!normalizedExternalId || normalizedGateway !== String(attempt.gateway || "").toUpperCase()) {
          throw validationError("Gateway refund result requires its matching gateway and external reference");
        }
        const externalReplay = await tx.refundAttempt.findFirst({
          where: { gateway: normalizedGateway, externalRefundId: normalizedExternalId },
        });
        if (externalReplay && externalReplay.id !== attempt.id) {
          throw new ServiceError("Gateway refund reference conflicts with an existing attempt", 409, REFUND_TRANSITION_ERROR_CODES.DUPLICATE);
        }
      }

      const paymentId = Number(read(payment, "id"));
      const [collectedAmount, refundedBefore] = await Promise.all([
        succeededTotal(tx.paymentReceipt, paymentId),
        succeededTotal(tx.refundAttempt, paymentId),
      ]);
      const refundedAmount = refundedBefore + asNumber(attempt.amount);
      if (refundedAmount > collectedAmount) {
        throw new ServiceError("Refund exceeds succeeded collection", 422, REFUND_TRANSITION_ERROR_CODES.EXCEEDS_COLLECTED);
      }

      const bookingId = Number(read(payment, "booking_id", "bookingId"));
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new ServiceError("Booking not found for payment", 409, "PAYMENT_BOOKING_MISMATCH");

      // Lock mutable balance rows before debiting. This prevents concurrent payout/refund
      // transitions from observing stale buckets while the payment lock serializes refunds.
      await tx.$queryRaw`SELECT id FROM partner_wallets WHERE business_id = ${booking.businessId} FOR UPDATE`;
      const platformWallet = await tx.platformWallet.findFirst();
      if (platformWallet) await tx.$queryRaw`SELECT id FROM platform_wallets WHERE id = ${platformWallet.id} FOR UPDATE`;
      const settled = await tx.financialLedger.findFirst({ where: { bookingId, type: "SETTLE" } });

      // Allocate from canonical cumulative totals so partial refunds cannot lose cents.
      const originalCommission = asNumber(booking.adminEarned ?? booking.commissionAmount);
      const commissionTotal = Math.floor((refundedAmount * originalCommission) / collectedAmount);
      const commissionBefore = Math.floor((refundedBefore * originalCommission) / collectedAmount);
      const commissionDebit = commissionTotal - commissionBefore;
      const businessDebit = asNumber(attempt.amount) - commissionDebit;
      if (businessDebit < 0) throw new ServiceError("Refund allocation is invalid", 409, REFUND_TRANSITION_ERROR_CODES.INVALID_RESULT);

      if (businessDebit > 0) {
        await tx.partnerWallet.update({
          where: { businessId: booking.businessId },
          data: { [settled ? "balance" : "frozenBalance"]: { decrement: businessDebit } },
        });
      }
      if (commissionDebit > 0 && !platformWallet) {
        throw new ServiceError("Platform wallet is missing for refund reversal", 409, REFUND_TRANSITION_ERROR_CODES.INVALID_RESULT);
      }
      if (commissionDebit > 0) {
        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: { balance: { decrement: commissionDebit }, totalEarned: { decrement: commissionDebit } },
        });
      }

      const nextStatus = refundedAmount === collectedAmount ? PAYMENT_STATUS.FULLY_REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
      const completedAt = now();
      const updatedAttempt = await tx.refundAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "succeeded",
          externalRefundId: normalizedExternalId,
          completedAt,
          metadata: { ...(attempt.metadata || {}), ...safeAuditMetadata(metadata), finalizedAt: completedAt.toISOString() },
        },
      });
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: nextStatus,
          refundAmount: refundedAmount,
          refundedAt: completedAt,
          refundReason: attempt.reason || null,
        },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: nextStatus,
          businessEarned: { decrement: businessDebit },
        },
      });
      await tx.financialLedger.create({
        data: {
          bookingId,
          type: "REFUND",
          amount: asNumber(attempt.amount),
          description: `Canonical refund attempt #${attempt.id} for booking #${bookingId}`,
        },
      });
      return result(updatedAttempt, { collectedAmount, refundedAmount });
    });
  }

  async function failRefundAttempt({ refundAttemptId, reason } = {}) {
    const attemptId = Number(refundAttemptId);
    const failureReason = String(reason || "").trim();
    if (!Number.isInteger(attemptId) || attemptId <= 0 || !failureReason) throw validationError("Refund failure requires an attempt and reason");
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.refundAttempt.findUnique({ where: { id: attemptId } });
      if (!attempt) throw new ServiceError("Refund attempt not found", 404, "NOT_FOUND");
      if (attempt.status === "failed") return result(attempt, { replayed: true });
      if (attempt.status !== "pending") throw new ServiceError("Only a pending refund can fail", 409, REFUND_TRANSITION_ERROR_CODES.INVALID_RESULT);
      const failed = await tx.refundAttempt.update({
        where: { id: attempt.id },
        data: { status: "failed", completedAt: now(), metadata: { ...(attempt.metadata || {}), failure: failureReason } },
      });
      return result(failed);
    });
  }

  return { createRefundIntent, createRefundIntentInTransaction, succeedRefundAttempt, failRefundAttempt };
}
