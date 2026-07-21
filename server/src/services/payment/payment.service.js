import crypto from "node:crypto";
import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  BOOKING_STATUS,
} from "../../config/constants.js";
import { appConfig } from "../../config/app.config.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import * as vnpayService from "./vnpay.service.js";
import * as momoService from "./momo.service.js";
import * as sepayService from "./sepay.service.js";
import * as sepayWebhookService from "./sepayWebhook.service.js";
import * as webhookLogService from "./webhookLog.service.js";
import {
  buildSafeWebhookLogEntry,
  PAYMENT_OBLIGATION_ERROR_CODES,
  validateCallbackObligation,
} from "./paymentCallbackObligation.policy.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import * as bookingService from "../booking/booking.service.js";
import { processPaymentLedger } from "../booking/financialCore.service.js";
import { createPaymentTransition } from "./paymentTransition.service.js";
import { createRefundTransition } from "./refundTransition.service.js";

const PAYMENT_CODE_PREFIX = process.env.PAYMENT_CODE_PREFIX || "DDG";
const PAYMENT_CODE_RANDOM_LENGTH = 7;

const defaultPaymentCallbackDependencies = Object.freeze({
  prisma,
  logger,
  vnpayService,
  momoService,
  webhookLogService,
  eventEmitter,
  EVENTS,
  processPaymentLedger,
  paymentTransition: null,
});

const defaultSePayBankWebhookDependencies = Object.freeze({
  prisma,
  logger,
  sepayService,
  sepayWebhookService,
  webhookLogService,
  eventEmitter,
  EVENTS,
  processPaymentLedger,
  paymentTransition: null,
});

const defaultSePayRefundWebhookDependencies = Object.freeze({
  prisma,
  logger,
  sepayService,
  sepayWebhookService,
  webhookLogService,
  refundTransitionFactory: createRefundTransition,
});

export function createPaymentCallbackHandlers(overrides = {}) {
  const dependencies = { ...defaultPaymentCallbackDependencies, ...overrides };
  return {
    processVNPayIPN: (query) =>
      processVNPayIPNWithDependencies(query, dependencies),
    processMoMoIPN: (body) => processMoMoIPNWithDependencies(body, dependencies),
  };
}

export function createPaymentSePayBankWebhookHandlers(overrides = {}) {
  const dependencies = { ...defaultSePayBankWebhookDependencies, ...overrides };
  return {
    processSePayBankWebhook: (body, headers, rawBody) =>
      processSePayBankWebhookWithDependencies(body, headers, rawBody, dependencies),
  };
}

export function createPaymentSePayRefundWebhookHandlers(overrides = {}) {
  const dependencies = { ...defaultSePayRefundWebhookDependencies, ...overrides };
  return {
    processSePayRefundWebhook: (body, headers, rawBody) =>
      processSePayRefundWebhookWithDependencies(body, headers, rawBody, dependencies),
  };
}

/**
 * Creates/refinalizes refund attempts for protected operational endpoints.
 * SePay bank refunds are operator-initiated bank transfers: this records the
 * canonical pending obligation first and returns its stable transfer reference.
 */
export function createPaymentRefundOrchestrator({ db = prisma, refundTransitionFactory = createRefundTransition } = {}) {
  if (!db?.$transaction || !db?.refundAttempt) throw new Error("createPaymentRefundOrchestrator requires a Prisma client");
  const transition = refundTransitionFactory({ prisma: db });

  async function initiateSePayBankRefund(paymentId, { amount, reason, idempotencyKey, actorUserId } = {}) {
    const normalizedPaymentId = Number(paymentId);
    if (!Number.isInteger(normalizedPaymentId) || normalizedPaymentId <= 0) {
      throw new ServiceError("Payment ID không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    const normalizedIdempotencyKey = String(idempotencyKey || "").trim();
    if (!normalizedIdempotencyKey) throw new ServiceError("Idempotency key không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
    return db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw`
        SELECT id, status, currency, transaction_ref
        FROM payments WHERE id = ${normalizedPaymentId} LIMIT 1 FOR UPDATE
      `;
      const payment = rows?.[0];
      if (!payment) throw new ServiceError("Không tìm thấy giao dịch", 404, ERROR_CODES.NOT_FOUND);
      if (![PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(payment.status)) {
        throw new ServiceError("Chỉ có thể tạo lệnh hoàn SePay cho giao dịch đã thanh toán", 422, ERROR_CODES.VALIDATION_ERROR);
      }
      // Keep references opaque, deterministic, and short enough for bank transfer fields.
      const transferReference = `SEPAY-REFUND-${payment.id}-${crypto.createHash("sha256").update(normalizedIdempotencyKey).digest("hex").slice(0, 24)}`;
      const existing = await tx.refundAttempt.findUnique({ where: { idempotencyKey: normalizedIdempotencyKey } });
      if (existing) {
        if (existing.metadata?.transferReference !== transferReference) {
          throw new ServiceError("Refund transfer reference conflicts with an existing attempt", 409, "REFUND_DUPLICATE");
        }
        const replay = await transition.createRefundIntentInTransaction(tx, {
          paymentId: payment.id,
          amount: Number(existing.amount),
          currency: payment.currency,
          source: "gateway",
          gateway: "SEPAY_BANK",
          idempotencyKey: normalizedIdempotencyKey,
          actorUserId,
          reason,
          metadata: { channel: "sepay_bank_refund_initiation", transferReference },
        });
        return { ...replay, transferReference };
      }
      const conflictingReference = await tx.refundAttempt.findFirst({
        where: { metadata: { path: ["transferReference"], equals: transferReference } },
      });
      if (conflictingReference) {
        throw new ServiceError("Refund transfer reference conflicts with an existing attempt", 409, "REFUND_DUPLICATE");
      }
      const [collections, completedRefunds] = await Promise.all([
        tx.paymentReceipt.aggregate({ where: { paymentId: payment.id, status: "succeeded" }, _sum: { amount: true } }),
        tx.refundAttempt.aggregate({ where: { paymentId: payment.id, status: "succeeded" }, _sum: { amount: true } }),
      ]);
      // This only chooses a default amount; the shared transition owns the
      // pending+succeeded reservation ceiling for every source.
      const available = Number(collections?._sum?.amount || 0) - Number(completedRefunds?._sum?.amount || 0);
      const canonicalAmount = amount === undefined ? available : Number(amount);
      if (!Number.isSafeInteger(canonicalAmount) || canonicalAmount <= 0 || canonicalAmount > available) {
        throw new ServiceError("Số tiền hoàn vượt quá số tiền đã thu", 422, "REFUND_EXCEEDS_COLLECTED");
      }
      const intent = await transition.createRefundIntentInTransaction(tx, {
        paymentId: payment.id,
        amount: canonicalAmount,
        currency: payment.currency,
        source: "gateway",
        gateway: "SEPAY_BANK",
        idempotencyKey: normalizedIdempotencyKey,
        actorUserId,
        reason,
        metadata: { channel: "sepay_bank_refund_initiation", transferReference },
      });
      return { ...intent, transferReference };
    });
  }

  async function recoverPendingManualRefund(refundAttemptId) {
    const id = Number(refundAttemptId);
    if (!Number.isInteger(id) || id <= 0) throw new ServiceError("Refund attempt ID không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
    const attempt = await db.refundAttempt.findUnique({ where: { id } });
    if (!attempt) throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404, ERROR_CODES.NOT_FOUND);
    if (attempt.source !== "manual") throw new ServiceError("Chỉ có thể khôi phục refund thủ công", 409, "REFUND_INVALID_RESULT");
    return transition.succeedRefundAttempt({ refundAttemptId: id });
  }

  return { initiateSePayBankRefund, recoverPendingManualRefund };
}

/**
 * Generate a short, user-friendly payment code.
 * Format: {PREFIX}{RANDOM_ALPHANUMERIC} — e.g., DDG3KAUQ190
 * The bookingId is encoded in the random part for uniqueness.
 */
function generatePaymentCode(bookingId) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-3);
  let random = "";
  const seed = `${bookingId}-${Date.now()}-${crypto.randomUUID()}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  for (let i = 0; i < PAYMENT_CODE_RANDOM_LENGTH - 3; i++) {
    const idx = parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length;
    random += chars[idx];
  }
  return `${PAYMENT_CODE_PREFIX}${timestamp}${random}`;
}

/**
 * Create a payment checkout: validates booking, creates Payment record,
 * generates payment URL for the selected gateway.
 *
 * @param {Object} opts
 * @param {number} opts.bookingId
 * @param {string} opts.paymentMethod  - "VNPAY" | "MOMO"
 * @param {string} opts.ipAddress
 * @param {number} opts.userId
 * @param {string} [opts.clientType]  - "web" | "mobile" — determines return URL
 * @returns {Promise<{ paymentUrl: string, paymentId: number, transactionRef: string }>}
 */
export async function createCheckout({
  bookingId,
  paymentMethod,
  ipAddress,
  userId,
  clientType = "web",
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId, 10) },
    select: {
      id: true,
      userId: true,
      finalPrice: true,
      status: true,
      paymentStatus: true,
      bookingCode: true,
    },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  if (booking.userId !== userId) {
    throw new ServiceError(
      "Booking không thuộc về bạn",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw new ServiceError(
      `Booking đang ở trạng thái "${booking.status}", không thể thanh toán`,
      422,
      ERROR_CODES.BOOKING_INVALID_STATUS,
    );
  }

  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ServiceError(
      "Booking đã được thanh toán",
      422,
      ERROR_CODES.CONFLICT,
    );
  }

  const normalizedMethod = paymentMethod.toUpperCase();
  if (
    normalizedMethod !== PAYMENT_METHODS.VNPAY &&
    normalizedMethod !== PAYMENT_METHODS.MOMO &&
    normalizedMethod !== PAYMENT_METHODS.SEPAY
  ) {
    throw new ServiceError(
      "Phương thức thanh toán không hỗ trợ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const amount = booking.finalPrice;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ServiceError(
      "Số tiền thanh toán không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // Reuse existing UNPAID payment for this booking (avoid unique constraint violation)
  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: PAYMENT_STATUS.UNPAID },
    select: { id: true, transactionRef: true },
  });

  let payment;
  if (existingPayment) {
    // Update method & idempotency key, keep same transactionRef
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        paymentMethod: normalizedMethod,
        idempotencyKey: crypto.randomUUID(),
      },
      select: { id: true, transactionRef: true },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount,
        paymentMethod: normalizedMethod,
        transactionRef: generatePaymentCode(booking.id),
        idempotencyKey: crypto.randomUUID(),
        status: PAYMENT_STATUS.UNPAID,
      },
      select: { id: true, transactionRef: true },
    });
  }

  const orderInfo = `Thanh toán booking ${booking.bookingCode}`;
  const transactionRef = payment.transactionRef;

  // Build the return URL: server endpoint that handles redirect logic.
  // For mobile, the server will forward to the app deep link.
  const serverBase = appConfig.apiBaseUrl;
  const returnPath =
    normalizedMethod === PAYMENT_METHODS.VNPAY
      ? "vnpay-return"
      : normalizedMethod === PAYMENT_METHODS.MOMO
        ? "momo-return"
        : "sepay-return";
  const returnUrl = `${serverBase}/api/payments/${returnPath}?clientType=${clientType}&bookingId=${booking.id}&paymentId=${payment.id}`;

  let paymentUrl;
  let momoDeeplink = null;
  let sepayFields = null;
  let qrInfo = null;
  try {
    if (normalizedMethod === PAYMENT_METHODS.VNPAY) {
      paymentUrl = vnpayService.createPaymentUrl({
        amount,
        transactionRef,
        orderInfo,
        ipAddress: ipAddress || "127.0.0.1",
        returnUrl,
      });
    } else if (normalizedMethod === PAYMENT_METHODS.SEPAY) {
      // QR chuyển khoản trực tiếp (không dùng gateway redirect).
      // Nội dung CK = transactionRef → webhook bank match theo field này.
      const bankInfo = sepayService.getBankInfo();
      const qrUrl = sepayService.buildQrUrl({ amount, transactionRef });
      qrInfo = {
        qrUrl,
        bankName: bankInfo.bankName,
        bankAccountNumber: bankInfo.bankAccountNumber,
        bankAccountName: bankInfo.bankAccountName,
      };
      // Giữ paymentUrl = qrUrl để tương thích các client cũ
      paymentUrl = qrUrl;
    } else {
      const momoResult = await momoService.createPaymentUrl({
        amount,
        transactionRef,
        orderInfo,
        returnUrl,
      });
      paymentUrl = momoResult.paymentUrl;
      momoDeeplink = momoResult.deeplink;
      if (momoResult.transId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { transactionId: momoResult.transId },
        });
      }
    }
  } catch (gatewayError) {
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
    throw gatewayError;
  }

  return {
    paymentUrl,
    deeplink: momoDeeplink,
    sepayFields,
    qrUrl: qrInfo?.qrUrl || null,
    bankName: qrInfo?.bankName || null,
    bankAccountNumber: qrInfo?.bankAccountNumber || null,
    bankAccountName: qrInfo?.bankAccountName || null,
    amount,
    paymentId: payment.id,
    transactionRef: payment.transactionRef,
  };
}

/**
 * Process VNPay IPN (server-to-server callback).
 * Uses $transaction with $queryRaw FOR UPDATE for pessimistic locking.
 * Idempotent: if payment already "paid" or "fully_refunded", returns RspCode "02".
 */
export async function processVNPayIPN(query) {
  return processVNPayIPNWithDependencies(
    query,
    defaultPaymentCallbackDependencies,
  );
}

async function processVNPayIPNWithDependencies(query, dependencies) {
  const {
    prisma,
    logger,
    vnpayService,
    webhookLogService,
    eventEmitter,
    EVENTS,
    processPaymentLedger,
    paymentTransition,
  } = dependencies;

  let verifyResult;
  try {
    verifyResult = vnpayService.verifyIpn(query);
  } catch (error) {
    const webhookLogId = await webhookLogService.logWebhook(
      buildSafeWebhookLogEntry({
        gateway: "VNPAY",
        reference: query.vnp_TxnRef,
        outcome: "verification_error",
        hasSignature: Boolean(query.vnp_SecureHash),
      }),
    );
    await webhookLogService.markError({
      transactionRef: query.vnp_TxnRef || null,
      webhookLogId,
      errorMsg: "PAYMENT_SIGNATURE_VERIFICATION_ERROR",
    });
    logger.error("processVNPayIPN signature verification error", {
      transactionRef: query.vnp_TxnRef,
    });
    return vnpayService.buildIpnResponse("99", "System error");
  }

  const webhookLogId = await webhookLogService.logWebhook(
    buildSafeWebhookLogEntry({
      gateway: "VNPAY",
      reference: query.vnp_TxnRef,
      outcome: verifyResult.valid ? "received" : "signature_invalid",
      hasSignature: Boolean(query.vnp_SecureHash),
    }),
  );

  try {
    if (!verifyResult.valid) {
      await webhookLogService.markError({
        transactionRef: query.vnp_TxnRef || null,
        webhookLogId,
        errorMsg: "PAYMENT_SIGNATURE_INVALID",
      });
      return vnpayService.buildIpnResponse(
        "97",
        verifyResult.error || "Invalid signature",
      );
    }

    const {
      transactionRef,
      responseCode,
      amount,
      currency,
      bankCode,
      transactionNo,
      payDate,
    } = verifyResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, currency, transaction_ref, booking_id
        FROM payments
        WHERE transaction_ref = ${transactionRef}
        LIMIT 1
        FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        return { type: "NOT_FOUND" };
      }

      const payment = locked[0];

      const obligation = validateCallbackObligation({
        gateway: "VNPAY",
        payment,
        callback: {
          reference: transactionRef,
          amount,
          currency,
        },
      });
      if (!obligation.valid) {
        return { type: "OBLIGATION_MISMATCH", code: obligation.code };
      }

      if (
        payment.status === PAYMENT_STATUS.PAID ||
        payment.status === PAYMENT_STATUS.FULLY_REFUNDED
      ) {
        return { type: "ALREADY_PROCESSED", status: payment.status };
      }

      if (responseCode !== "00") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PAYMENT_STATUS.UNPAID,
            paymentData: {
              responseCode,
              bankCode: bankCode || null,
              transactionNo: transactionNo || null,
              payDate: payDate || null,
              gateway: "VNPAY",
              processedAt: new Date().toISOString(),
            },
          },
        });
        return { type: "FAILED", responseCode };
      }

      const transition = paymentTransition || createPaymentTransition({ processPaymentLedger });
      const collection = await transition.recordSucceededReceipt(tx, {
        paymentId: payment.id,
        amount: Number(amount) / 100,
        currency,
        source: "gateway",
        gateway: "VNPAY",
        method: PAYMENT_METHODS.VNPAY,
        idempotencyKey: `vnpay:${transactionNo || transactionRef}`,
        externalTransactionId: transactionNo || transactionRef,
        bankCode,
        paymentData: {
          responseCode,
          bankCode: bankCode || null,
          transactionNo: transactionNo || null,
          payDate: payDate || null,
          gateway: "VNPAY",
          processedAt: new Date().toISOString(),
        },
      });

      return {
        type: collection.replayed ? "ALREADY_PROCESSED" : "SUCCESS",
        bookingId: payment.booking_id,
      };
    });

    if (result.type && result.type !== "NOT_FOUND" && result.type !== "OBLIGATION_MISMATCH") {
      await webhookLogService.markProcessed({ transactionRef, webhookLogId });
    }

    if (result.type === "NOT_FOUND") {
      await webhookLogService.markError({
        transactionRef: transactionRef || null,
        webhookLogId,
        errorMsg: PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH,
      });
      return vnpayService.buildIpnResponse("01", "Order not found");
    }

    if (result.type === "OBLIGATION_MISMATCH") {
      await webhookLogService.markError({
        transactionRef: transactionRef || null,
        webhookLogId,
        errorMsg: result.code,
      });
      return vnpayService.buildIpnResponse("04", "Invalid callback obligation");
    }

    if (result.type === "ALREADY_PROCESSED") {
      return vnpayService.buildIpnResponse("02", "Order already confirmed");
    }

    if (result.type === "FAILED") {
      return vnpayService.buildIpnResponse("00", "Confirm success");
    }

    if (result.type === "SUCCESS") {
      const booking = await prisma.booking.findUnique({
        where: { id: result.bookingId },
        select: {
          id: true,
          bookingCode: true,
          userId: true,
          businessId: true,
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { id: true, ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.PAID, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        businessId: booking.businessId,
        businessOwnerId: booking.service?.business?.ownerId,
        source: "payment_gateway",
        paymentMethod: PAYMENT_METHODS.VNPAY,
      });

      return vnpayService.buildIpnResponse("00", "Confirm success");
    }
  } catch (error) {
    logger.error("processVNPayIPN error", {
      error: error.message,
      transactionRef: query.vnp_TxnRef,
    });
    await webhookLogService.markError({
      transactionRef: query.vnp_TxnRef || null,
      webhookLogId,
      errorMsg: error.message,
    });
    return vnpayService.buildIpnResponse("99", "System error");
  }
}

/**
 * Process MoMo IPN (server-to-server callback).
 * Idempotent: if payment already "paid" or "fully_refunded", returns resultCode 0.
 */
export async function processMoMoIPN(body) {
  return processMoMoIPNWithDependencies(
    body,
    defaultPaymentCallbackDependencies,
  );
}

async function processMoMoIPNWithDependencies(body, dependencies) {
  const {
    prisma,
    logger,
    momoService,
    webhookLogService,
    eventEmitter,
    EVENTS,
    processPaymentLedger,
    paymentTransition,
  } = dependencies;

  let verifyResult;
  try {
    verifyResult = momoService.verifyIpnSignature(body);
  } catch (error) {
    const webhookLogId = await webhookLogService.logWebhook(
      buildSafeWebhookLogEntry({
        gateway: "MOMO",
        reference: body.orderId,
        outcome: "verification_error",
        hasSignature: Boolean(body.signature),
      }),
    );
    await webhookLogService.markError({
      transactionRef: body.orderId || null,
      webhookLogId,
      errorMsg: "PAYMENT_SIGNATURE_VERIFICATION_ERROR",
    });
    logger.error("processMoMoIPN signature verification error", {
      orderId: body.orderId,
    });
    return momoService.buildIpnResponse(1001, "System error");
  }

  const webhookLogId = await webhookLogService.logWebhook(
    buildSafeWebhookLogEntry({
      gateway: "MOMO",
      reference: body.orderId,
      outcome: verifyResult.valid ? "received" : "signature_invalid",
      hasSignature: Boolean(body.signature),
    }),
  );

  try {
    if (!verifyResult.valid) {
      await webhookLogService.markError({
        transactionRef: body.orderId || null,
        webhookLogId,
        errorMsg: "PAYMENT_SIGNATURE_INVALID",
      });
      return momoService.buildIpnResponse(
        1000,
        verifyResult.error || "Invalid signature",
      );
    }

    const { orderId, amount, transId, resultCode, message } = body;

    const dbResult = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, currency, transaction_ref, booking_id
        FROM payments
        WHERE transaction_ref = ${orderId}
        LIMIT 1
        FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        return { type: "NOT_FOUND" };
      }

      const payment = locked[0];

      const obligation = validateCallbackObligation({
        gateway: "MOMO",
        payment,
        callback: {
          reference: orderId,
          amount,
        },
      });
      if (!obligation.valid) {
        return { type: "OBLIGATION_MISMATCH", code: obligation.code };
      }

      if (
        payment.status === PAYMENT_STATUS.PAID ||
        payment.status === PAYMENT_STATUS.FULLY_REFUNDED
      ) {
        return { type: "ALREADY_PROCESSED", status: payment.status };
      }

      if (resultCode !== 0) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PAYMENT_STATUS.UNPAID,
            paymentData: {
              resultCode,
              message: message || null,
              transId: transId || null,
              gateway: "MOMO",
              processedAt: new Date().toISOString(),
            },
          },
        });
        return { type: "FAILED", resultCode };
      }

      const transition = paymentTransition || createPaymentTransition({ processPaymentLedger });
      const collection = await transition.recordSucceededReceipt(tx, {
        paymentId: payment.id,
        amount: Number(amount),
        currency: "VND",
        source: "gateway",
        gateway: "MOMO",
        method: PAYMENT_METHODS.MOMO,
        idempotencyKey: `momo:${transId || orderId}`,
        externalTransactionId: transId || orderId,
        paymentData: {
          resultCode,
          message: message || null,
          transId: transId || null,
          gateway: "MOMO",
          processedAt: new Date().toISOString(),
        },
      });

      return {
        type: collection.replayed ? "ALREADY_PROCESSED" : "SUCCESS",
        bookingId: payment.booking_id,
      };
    });

    if (
      dbResult.type &&
      dbResult.type !== "NOT_FOUND" &&
      dbResult.type !== "OBLIGATION_MISMATCH"
    ) {
      await webhookLogService.markProcessed({
        transactionRef: orderId,
        webhookLogId,
      });
    }

    if (dbResult.type === "NOT_FOUND") {
      await webhookLogService.markError({
        transactionRef: orderId || null,
        webhookLogId,
        errorMsg: PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH,
      });
      return momoService.buildIpnResponse(1000, "Order not found");
    }

    if (dbResult.type === "OBLIGATION_MISMATCH") {
      await webhookLogService.markError({
        transactionRef: orderId || null,
        webhookLogId,
        errorMsg: dbResult.code,
      });
      return momoService.buildIpnResponse(1000, "Invalid callback obligation");
    }

    if (dbResult.type === "ALREADY_PROCESSED") {
      return momoService.buildIpnResponse(0, "Order already confirmed");
    }

    if (dbResult.type === "FAILED") {
      return momoService.buildIpnResponse(0, "Confirm success");
    }

    if (dbResult.type === "SUCCESS") {
      const booking = await prisma.booking.findUnique({
        where: { id: dbResult.bookingId },
        select: {
          id: true,
          bookingCode: true,
          userId: true,
          businessId: true,
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { id: true, ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.PAID, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        businessId: booking.businessId,
        businessOwnerId: booking.service?.business?.ownerId,
        source: "payment_gateway",
        paymentMethod: PAYMENT_METHODS.MOMO,
      });

      return momoService.buildIpnResponse(0, "Confirm success");
    }
  } catch (error) {
    logger.error("processMoMoIPN error", {
      error: error.message,
      orderId: body.orderId,
    });
    await webhookLogService.markError({
      transactionRef: body.orderId || null,
      webhookLogId,
      errorMsg: error.message,
    });
    return momoService.buildIpnResponse(1001, "System error");
  }
}

/**
 * Process SePay IPN (server-to-server callback).
 * SePay sends POST JSON with { notification_type, order, transaction }.
 * Idempotent: if payment already "paid" or "fully_refunded", returns success.
 */
export async function processSePayIPN(body) {
  const webhookLogId = await webhookLogService.logWebhook({
    gateway: "SEPAY",
    payload: body,
    signature: null,
  });

  try {
    const parseResult = sepayService.parseIPN(body);
    if (!parseResult.valid) {
      await webhookLogService.markError({
        transactionRef: body?.order?.order_invoice_number || null,
        webhookLogId,
        errorMsg: parseResult.error,
      });
      return sepayService.buildIpnError(parseResult.error);
    }

    const {
      transactionRef,
      orderId,
      amount,
      transactionId,
      paymentMethod: sepayMethod,
      transactionDate,
    } = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, booking_id
        FROM payments
        WHERE transaction_ref = ${transactionRef}
        LIMIT 1
        FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        return { type: "NOT_FOUND" };
      }

      const payment = locked[0];

      if (
        payment.status === PAYMENT_STATUS.PAID ||
        payment.status === PAYMENT_STATUS.FULLY_REFUNDED
      ) {
        return { type: "ALREADY_PROCESSED", status: payment.status };
      }

      if (Number(payment.amount) !== Number(amount)) {
        logger.warn("SePay IPN amount mismatch", {
          transactionRef,
          expected: Number(payment.amount),
          received: Number(amount),
        });
        return { type: "AMOUNT_MISMATCH" };
      }

      const collection = await createPaymentTransition({ processPaymentLedger })
        .recordSucceededReceipt(tx, {
          paymentId: payment.id,
          amount: Number(amount),
          currency: "VND",
          source: "gateway",
          gateway: "SEPAY",
          method: PAYMENT_METHODS.SEPAY,
          idempotencyKey: `sepay:${transactionId || orderId || transactionRef}`,
          externalTransactionId: transactionId || orderId || transactionRef,
          bankCode: sepayMethod,
          paymentData: {
            sepayOrderId: orderId,
            transactionId,
            paymentMethod: sepayMethod,
            transactionDate,
            gateway: "SEPAY",
            processedAt: new Date().toISOString(),
          },
        });

      return {
        type: collection.replayed ? "ALREADY_PROCESSED" : "SUCCESS",
        bookingId: payment.booking_id,
      };
    });

    if (result.type && !["NOT_FOUND", "AMOUNT_MISMATCH"].includes(result.type)) {
      await webhookLogService.markProcessed({ transactionRef, webhookLogId });
    }

    if (result.type === "NOT_FOUND") {
      return sepayService.buildIpnError("Order not found");
    }

    if (result.type === "ALREADY_PROCESSED") {
      return sepayService.buildIpnSuccess();
    }

    if (result.type === "AMOUNT_MISMATCH") {
      await webhookLogService.markError({
        transactionRef,
        webhookLogId,
        errorMsg: "Amount mismatch",
      });
      return sepayService.buildIpnError("Amount mismatch");
    }

    if (result.type === "SUCCESS") {
      const booking = await prisma.booking.findUnique({
        where: { id: result.bookingId },
        select: {
          id: true,
          bookingCode: true,
          userId: true,
          businessId: true,
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { id: true, ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.PAID, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        businessId: booking.businessId,
        businessOwnerId: booking.service?.business?.ownerId,
        source: "payment_gateway",
        paymentMethod: PAYMENT_METHODS.SEPAY,
      });

      return sepayService.buildIpnSuccess();
    }
  } catch (error) {
    logger.error("processSePayIPN error", { error: error.message, body });
    await webhookLogService.markError({
      transactionRef: body?.order?.order_invoice_number || null,
      webhookLogId,
      errorMsg: error.message,
    });
    return sepayService.buildIpnError("System error");
  }
}

/**
 * Process SePay bank transaction webhook.
 * This is from SePay Webhooks system (Dashboard → Tích hợp → Webhooks),
 * NOT from Payment Gateway IPN.
 *
 * Matches incoming bank transfers to pending Payments by `code` field (= transactionRef).
 * Uses sepayTransactionId for idempotency (INSERT IGNORE pattern).
 *
 * @param {Object} body - Raw webhook body from SePay
 * @param {Object} headers - Request headers (for signature verification)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function processSePayBankWebhook(body, headers = {}, rawBody = null) {
  return processSePayBankWebhookWithDependencies(
    body,
    headers,
    rawBody,
    defaultSePayBankWebhookDependencies,
  );
}

function buildSePayBankWebhookLog(reference, outcome) {
  return buildSafeWebhookLogEntry({
    gateway: "SEPAY_BANK",
    reference,
    outcome,
    hasSignature: true,
  });
}

function validateSePayBankObligation(payment, { reference, amount }) {
  const paymentReference = payment.transaction_ref ?? payment.transactionRef;
  if (!reference || reference !== paymentReference) {
    return { valid: false, code: PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH };
  }
  if (!Number.isSafeInteger(amount) || amount <= 0 || Number(payment.amount) !== amount) {
    return { valid: false, code: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH };
  }
  if (String(payment.currency || "").toUpperCase() !== "VND") {
    return { valid: false, code: PAYMENT_OBLIGATION_ERROR_CODES.CURRENCY_MISMATCH };
  }
  return { valid: true, code: null };
}

async function processSePayBankWebhookWithDependencies(body, headers, rawBody, dependencies) {
  const {
    prisma,
    logger,
    sepayService,
    sepayWebhookService,
    webhookLogService,
    eventEmitter,
    EVENTS,
    processPaymentLedger,
    paymentTransition,
  } = dependencies;
  let webhookLogId = null;
  try {
    const signature = headers["x-sepay-signature"] || "";
    const timestamp = headers["x-sepay-timestamp"] || "";
    const bodyForSignature = rawBody || (typeof body === "string" ? body : JSON.stringify(body));
    let sigResult;
    try {
      sigResult = sepayWebhookService.verifyWebhookSignature(
        bodyForSignature,
        signature,
        timestamp,
      );
    } catch (error) {
      webhookLogId = (await webhookLogService.logWebhook(
        buildSePayBankWebhookLog(body?.code, "verification_error"),
      ))?.id;
      if (webhookLogId) {
        await webhookLogService.markError({
          transactionRef: body?.code || null,
          webhookLogId,
          errorMsg: "PAYMENT_SIGNATURE_VERIFICATION_ERROR",
        });
      }
      logger.error("processSePayBankWebhook signature verification error", { code: body?.code || null });
      return sepayService.buildIpnError("System error");
    }
    if (!sigResult.valid) {
      webhookLogId = (await webhookLogService.logWebhook(
        buildSePayBankWebhookLog(body?.code, "signature_invalid"),
      ))?.id;
      if (webhookLogId) {
        await webhookLogService.markError({
          transactionRef: body?.code || null,
          webhookLogId,
          errorMsg: "PAYMENT_SIGNATURE_INVALID",
        });
      }
      return sepayService.buildIpnError(sigResult.error);
    }

    const parseResult = sepayWebhookService.parseBankWebhook(body);
    webhookLogId = (await webhookLogService.logWebhook(
      buildSePayBankWebhookLog(body?.code, parseResult.valid ? "received" : "ignored"),
    ))?.id;
    if (!parseResult.valid) {
      if (webhookLogId) {
        await webhookLogService.markError({
          transactionRef: body?.code || null,
          webhookLogId,
          errorMsg: parseResult.error,
        });
      }
      // Return success for non-matchable transactions (no code, wrong type) to avoid retries
      return sepayService.buildIpnSuccess();
    }

    const {
      sepayTransactionId,
      code,
      transferAmount,
      gateway,
      transactionDate,
      referenceCode,
    } = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, currency, transaction_ref, booking_id
        FROM payments
        WHERE transaction_ref = ${code}
        LIMIT 1
        FOR UPDATE
      `;

      if (!locked || locked.length === 0) {
        return { type: "NOT_FOUND" };
      }

      const payment = locked[0];
      const obligation = validateSePayBankObligation(payment, {
        reference: code,
        amount: Number(transferAmount),
      });
      if (!obligation.valid) return { type: "OBLIGATION_MISMATCH", code: obligation.code };

      const transition = paymentTransition || createPaymentTransition({ processPaymentLedger });
      const collection = await transition.recordSucceededReceipt(tx, {
        paymentId: payment.id,
        transactionRef: code,
        amount: Number(transferAmount),
        currency: "VND",
        source: "gateway",
        gateway: "SEPAY_BANK",
        method: PAYMENT_METHODS.SEPAY,
        idempotencyKey: `sepay-bank:${sepayTransactionId}`,
        externalTransactionId: String(sepayTransactionId),
        bankCode: gateway || null,
        paymentData: {
          gateway,
          transactionDate,
          referenceCode,
          source: "sepay_bank_webhook",
          processedAt: new Date().toISOString(),
        },
      });

      return {
        type: collection.replayed ? "ALREADY_PROCESSED" : "SUCCESS",
        bookingId: payment.booking_id,
      };
    });

    if (result.type && !["NOT_FOUND", "OBLIGATION_MISMATCH"].includes(result.type) && webhookLogId) {
      await webhookLogService.markProcessed({
        transactionRef: code,
        webhookLogId,
      });
    }

    if (result.type === "NOT_FOUND") {
      logger.info("SePay bank webhook: no matching payment", {
        code,
        transferAmount,
      });
      return sepayService.buildIpnSuccess();
    }

    if (result.type === "OBLIGATION_MISMATCH") {
      if (webhookLogId) {
        await webhookLogService.markError({ transactionRef: code, webhookLogId, errorMsg: result.code });
      }
      return sepayService.buildIpnSuccess();
    }

    if (result.type === "ALREADY_PROCESSED") {
      return sepayService.buildIpnSuccess();
    }

    if (result.type === "SUCCESS") {
      const booking = await prisma.booking.findUnique({
        where: { id: result.bookingId },
        select: {
          id: true,
          bookingCode: true,
          userId: true,
          businessId: true,
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { id: true, ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.PAID, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        businessId: booking.businessId,
        businessOwnerId: booking.service?.business?.ownerId,
        source: "sepay_bank_webhook",
        paymentMethod: PAYMENT_METHODS.SEPAY,
      });

      return sepayService.buildIpnSuccess();
    }
  } catch (error) {
    logger.error("processSePayBankWebhook error", { error: error.message, code: body?.code || null });
    if (webhookLogId) {
      await webhookLogService.markError({
        transactionRef: body?.code || null,
        webhookLogId,
        errorMsg: error.message,
      });
    }
    return sepayService.buildIpnError("System error");
  }
}

/**
 * Process SePay outgoing bank transaction webhook.
 * Matches money-out events to payout transfers or refunded payments.
 */
async function processSePayRefundWebhookWithDependencies(body, headers = {}, rawBody = null, dependencies) {
  const {
    prisma,
    logger,
    sepayService,
    sepayWebhookService,
    webhookLogService,
    refundTransitionFactory,
  } = dependencies;
  let webhookLogId = null;

  try {
    const signature = headers["x-sepay-signature"] || "";
    const timestamp = headers["x-sepay-timestamp"] || "";
    const bodyForSignature = rawBody || (typeof body === "string" ? body : JSON.stringify(body));

    const sigResult = sepayWebhookService.verifyWebhookSignature(
      bodyForSignature,
      signature,
      timestamp,
    );
    if (!sigResult.valid) {
      return sepayService.buildIpnError(sigResult.error);
    }

    webhookLogId = (await webhookLogService.logWebhook({
      gateway: "SEPAY_BANK_REFUND",
      payload: { id: body?.id || null, code: body?.code || null, transferAmount: Number(body?.transferAmount) || null, transferType: body?.transferType || null },
      signature: null,
    }))?.id || null;

    const parseResult = sepayWebhookService.parseRefundWebhook(body);
    if (!parseResult.valid) {
      await webhookLogService.markError({
        transactionRef: body?.code || null,
        webhookLogId,
        errorMsg: parseResult.error,
      });
      return sepayService.buildIpnSuccess();
    }

    const {
      sepayTransactionId,
      code,
      payoutId,
      transferAmount,
      gateway,
      transactionDate,
      referenceCode,
    } = parseResult.data;

    const existingWebhook = await prisma.paymentWebhookLog.findFirst({
      where: {
        gateway: "SEPAY_BANK_REFUND",
        processed: true,
        payload: {
          path: ["id"],
          equals: sepayTransactionId,
        },
      },
    });

    if (existingWebhook) {
      return sepayService.buildIpnSuccess();
    }

    const result = await prisma.$transaction(async (tx) => {
      if (payoutId) {
        const payoutRows = await tx.$queryRaw`
          SELECT id, status, amount
          FROM payouts
          WHERE id = ${payoutId}
          LIMIT 1
          FOR UPDATE
        `;

        if (payoutRows?.length) {
          const payout = payoutRows[0];
          if (payout.status === "transferred") {
            return { type: "ALREADY_PROCESSED", transactionRef: code };
          }

          if (Number(payout.amount) !== Number(transferAmount)) {
            logger.warn("SePay refund webhook payout amount mismatch", {
              payoutId,
              expected: payout.amount,
              received: transferAmount,
            });
            return { type: "AMOUNT_MISMATCH", transactionRef: code };
          }

          const transferredAt = transactionDate
            ? new Date(transactionDate)
            : new Date();

          const updatedPayout = await tx.payout.update({
            where: { id: payout.id },
            data: {
              status: "transferred",
              transferredAt,
              note: [
                payout.note,
                `SePay transfer ${sepayTransactionId}${referenceCode ? ` (${referenceCode})` : ""}`,
              ]
                .filter(Boolean)
                .join(" | "),
            },
          });

          // Release the frozen payout amount after SePay confirms money-out.
          await tx.partnerWallet.update({
            where: { businessId: updatedPayout.businessId },
            data: { frozenBalance: { decrement: Number(payout.amount) } },
          });

          // Update platform wallet totalPaidOut
          const platformWallet = await tx.platformWallet.findFirst();
          if (platformWallet) {
            await tx.platformWallet.update({
              where: { id: platformWallet.id },
              data: { totalPaidOut: { increment: Number(payout.amount) } },
            });
          }

          await tx.financialLedger.create({
            data: {
              payoutId: updatedPayout.id,
              type: "WITHDRAW",
              amount: updatedPayout.amount,
              description: `SePay payout transfer #${updatedPayout.id}`,
            },
          });

          return {
            type: "PAYOUT_TRANSFERRED",
            payout: updatedPayout,
            transactionRef: code,
          };
        }
      }

      if (code) {
        const paymentRows = await tx.$queryRaw`
          SELECT id, status, refund_amount, amount, payment_data
          FROM payments
          WHERE transaction_ref = ${code}
          LIMIT 1
          FOR UPDATE
        `;

        if (paymentRows?.length) {
          const payment = paymentRows[0];
          const callbackReference = String(referenceCode || "").trim();
          const replay = await tx.refundAttempt.findFirst({
            where: { gateway: "SEPAY_BANK", externalRefundId: String(sepayTransactionId) },
          });
          if (replay && (replay.paymentId !== payment.id || replay.amount !== Number(transferAmount))) {
            return { type: "AMOUNT_MISMATCH", transactionRef: code };
          }
          if (replay && replay.metadata?.transferReference !== callbackReference) {
            return { type: "AMOUNT_MISMATCH", transactionRef: code };
          }
          if (replay?.status === "succeeded") return { type: "ALREADY_PROCESSED", transactionRef: code };
          const attempt = await tx.refundAttempt.findFirst({
            where: {
              paymentId: payment.id,
              status: "pending",
              gateway: "SEPAY_BANK",
              amount: Number(transferAmount),
              currency: "VND",
              metadata: { path: ["transferReference"], equals: callbackReference },
            },
          });
          if (!attempt) return { type: "AMOUNT_MISMATCH", transactionRef: code };
          return { type: "REFUND_PENDING", transactionRef: code, refundAttemptId: attempt.id };
        }
      }

      return { type: "NOT_FOUND", transactionRef: code };
    });

    if (result.type === "REFUND_PENDING") {
      const transition = refundTransitionFactory({ prisma });
      await transition.succeedRefundAttempt({
        refundAttemptId: result.refundAttemptId,
        gateway: "SEPAY_BANK",
        externalRefundId: String(sepayTransactionId),
        metadata: { gateway, referenceCode: referenceCode || null, transactionDate: transactionDate || null, source: "sepay_refund_webhook" },
      });
      result.type = "PAYMENT_REFUND_CONFIRMED";
    }

    if (result.type !== "NOT_FOUND" && webhookLogId) {
      await webhookLogService.markProcessed({
        transactionRef: result.transactionRef || code || null,
        webhookLogId,
      });
    }

    if (result.type === "NOT_FOUND") {
      logger.info("SePay refund webhook: no matching payout/payment", {
        code,
        payoutId,
        transferAmount,
      });
    }

    return sepayService.buildIpnSuccess();
  } catch (error) {
    logger.error("processSePayRefundWebhook error", {
      error: error.message,
      body,
    });
    if (webhookLogId) {
      await webhookLogService.markError({
        transactionRef: body?.code || null,
        webhookLogId,
        errorMsg: error.message,
      });
    }
    return sepayService.buildIpnError("System error");
  }
}

export async function processSePayRefundWebhook(body, headers = {}, rawBody = null) {
  return processSePayRefundWebhookWithDependencies(
    body,
    headers,
    rawBody,
    defaultSePayRefundWebhookDependencies,
  );
}

/**
 * Manual refund by Admin.
 * Delegates to bookingService.refund() which handles partial refund + commission adjustment.
 * Protected by hasPermission("payments.refund") middleware.
 *
 * @param {number} paymentId
 * @param {Object} opts
 * @param {number} [opts.amount]
 * @param {string} [opts.reason]
 * @param {number} adminUserId
 * @returns {Promise<Object>}
 */
export async function refundPayment(
  paymentId,
  { amount, reason, idempotencyKey } = {},
  adminUserId,
) {
  const id = parseInt(paymentId, 10);
  if (Number.isNaN(id)) {
    throw new ServiceError(
      "Payment ID không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, bookingId: true, amount: true, status: true },
  });

  if (!payment) {
    throw new ServiceError(
      "Không tìm thấy giao dịch",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (![PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(payment.status)) {
    throw new ServiceError(
      "Chỉ có thể hoàn tiền đơn đã thanh toán",
      422,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const refundAmt = amount ?? payment.amount;

  return bookingService.refund(
    payment.bookingId,
    { refundAmount: refundAmt, refundReason: reason, idempotencyKey },
    adminUserId,
  );
}

export async function rejectRefund(paymentId, reason) {
  const id = parseInt(paymentId, 10);
  if (Number.isNaN(id)) {
    throw new ServiceError(
      "Payment ID không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, status: true, refundReason: true },
  });

  if (!payment) {
    throw new ServiceError(
      "Không tìm thấy giao dịch",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw new ServiceError(
      "Chỉ có thể từ chối hoàn tiền cho đơn đã thanh toán",
      422,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (payment.refundReason?.startsWith("REJECTED:")) {
    throw new ServiceError(
      "Đơn này đã bị từ chối hoàn tiền trước đó",
      422,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  return prisma.payment.update({
    where: { id },
    data: { refundReason: `REJECTED:${reason}` },
  });
}

export async function getAdminPayments({
  status,
  gateway,
  bookingCode,
  search,
  startDate,
  endDate,
  page = 1,
  limit = 20,
} = {}) {
  const where = {};

  if (status === "rejected") {
    where.status = PAYMENT_STATUS.PAID;
    where.refundReason = { startsWith: "REJECTED:" };
  } else if (status) {
    where.status = status;
  }

  if (gateway) {
    where.paymentMethod = gateway.toUpperCase();
  }

  if (bookingCode) {
    where.booking = {
      is: {
        bookingCode: { contains: bookingCode, mode: "insensitive" },
      },
    };
  }

  if (search) {
    where.OR = [
      {
        booking: {
          is: {
            guestName: { contains: search, mode: "insensitive" },
          },
        },
      },
      {
        booking: {
          is: {
            service: {
              place: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      },
      {
        booking: {
          is: {
            service: {
              place: {
                business: {
                  businessName: { contains: search, mode: "insensitive" },
                },
              },
            },
          },
        },
      },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 20;
  const skip = (currentPage - 1) * currentLimit;

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
            service: {
              include: {
                place: {
                  include: {
                    business: { select: { id: true, businessName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: currentLimit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
}

export async function getPaymentById(paymentId, { userId, roleId }) {
  const id = parseInt(paymentId, 10);
  if (Number.isNaN(id)) {
    throw new ServiceError(
      "Payment ID không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const isAdmin = roleId <= 2;

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      bookingId: true,
      userId: true,
      amount: true,
      currency: true,
      paymentMethod: true,
      transactionId: true,
      transactionRef: true,
      bankCode: true,
      status: true,
      paidAt: true,
      refundAmount: true,
      refundedAt: true,
      refundReason: true,
      createdAt: true,
      updatedAt: true,
      booking: {
        select: {
          bookingCode: true,
          status: true,
          guestName: true,
          guestPhone: true,
          guestEmail: true,
          useDate: true,
          finalPrice: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          service: {
            select: {
              name: true,
              place: {
                select: {
                  name: true,
                  business: {
                    select: {
                      id: true,
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new ServiceError("Payment không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  if (!isAdmin && payment.userId !== userId) {
    throw new ServiceError(
      "Bạn không có quyền xem payment này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return payment;
}
