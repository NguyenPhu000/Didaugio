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
});

export function createPaymentCallbackHandlers(overrides = {}) {
  const dependencies = { ...defaultPaymentCallbackDependencies, ...overrides };
  return {
    processVNPayIPN: (query) =>
      processVNPayIPNWithDependencies(query, dependencies),
    processMoMoIPN: (body) => processMoMoIPNWithDependencies(body, dependencies),
  };
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

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          paidAt: new Date(),
          bankCode: bankCode || null,
          transactionId: transactionNo || null,
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

      // Update booking to paid_pending_confirm (NOT confirmed)
      const bookingForTx = await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.PAID_PENDING_CONFIRM,
          paymentStatus: PAYMENT_STATUS.PAID,
          confirmedAt: null,
        },
        select: {
          id: true,
          businessId: true,
          originalPrice: true,
          discountAmount: true,
          finalPrice: true,
          service: {
            select: { business: { select: { commissionRate: true } } },
          },
        },
      });

      // Process financial ledger (commission split + frozen balance)
      const commissionRate =
        Number(bookingForTx.service?.business?.commissionRate) || 10;
      await processPaymentLedger(
        tx,
        bookingForTx.id,
        bookingForTx.finalPrice,
        commissionRate,
        bookingForTx.businessId,
      );

      await tx.bookingActionLog.create({
        data: {
          bookingId: payment.booking_id,
          action: "approve",
          actorUserId: null,
          metadata: { source: "payment_gateway", gateway: "VNPAY" },
        },
      });

      return {
        type: "SUCCESS",
        payment: updatedPayment,
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

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          paidAt: new Date(),
          transactionId: transId || null,
          paymentData: {
            resultCode,
            message: message || null,
            transId: transId || null,
            gateway: "MOMO",
            processedAt: new Date().toISOString(),
          },
        },
      });

      // Update booking to paid_pending_confirm (NOT confirmed)
      const bookingForTx = await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.PAID_PENDING_CONFIRM,
          paymentStatus: PAYMENT_STATUS.PAID,
          confirmedAt: null,
        },
        select: {
          id: true,
          businessId: true,
          originalPrice: true,
          discountAmount: true,
          finalPrice: true,
          service: {
            select: { business: { select: { commissionRate: true } } },
          },
        },
      });

      // Process financial ledger (commission split + frozen balance)
      const commissionRate =
        Number(bookingForTx.service?.business?.commissionRate) || 10;
      await processPaymentLedger(
        tx,
        bookingForTx.id,
        bookingForTx.finalPrice,
        commissionRate,
        bookingForTx.businessId,
      );

      await tx.bookingActionLog.create({
        data: {
          bookingId: payment.booking_id,
          action: "approve",
          actorUserId: null,
          metadata: { source: "payment_gateway", gateway: "MOMO" },
        },
      });

      return {
        type: "SUCCESS",
        payment: updatedPayment,
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

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          paidAt: new Date(),
          transactionId: transactionId || orderId || null,
          bankCode: sepayMethod || null,
          paymentData: {
            sepayOrderId: orderId,
            transactionId,
            paymentMethod: sepayMethod,
            transactionDate,
            gateway: "SEPAY",
            processedAt: new Date().toISOString(),
          },
        },
      });

      const bookingForTx = await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.PAID_PENDING_CONFIRM,
          paymentStatus: PAYMENT_STATUS.PAID,
          confirmedAt: null,
        },
        select: {
          id: true,
          businessId: true,
          originalPrice: true,
          discountAmount: true,
          finalPrice: true,
          service: {
            select: { business: { select: { commissionRate: true } } },
          },
        },
      });

      const commissionRate =
        Number(bookingForTx.service?.business?.commissionRate) || 10;
      await processPaymentLedger(
        tx,
        bookingForTx.id,
        bookingForTx.finalPrice,
        commissionRate,
        bookingForTx.businessId,
      );

      await tx.bookingActionLog.create({
        data: {
          bookingId: payment.booking_id,
          action: "approve",
          actorUserId: null,
          metadata: { source: "payment_gateway", gateway: "SEPAY" },
        },
      });

      return {
        type: "SUCCESS",
        payment: updatedPayment,
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
  const webhookLogId = await webhookLogService.logWebhook({
    gateway: "SEPAY_BANK",
    payload: body,
    signature: headers["x-sepay-signature"] || null,
  });

  try {
    // Verify HMAC-SHA256 signature if configured
    const signature = headers["x-sepay-signature"] || "";
    const timestamp = headers["x-sepay-timestamp"] || "";
    const bodyForSignature = rawBody || (typeof body === "string" ? body : JSON.stringify(body));

    const sigResult = sepayWebhookService.verifyWebhookSignature(
      bodyForSignature,
      signature,
      timestamp,
    );
    if (!sigResult.valid) {
      await webhookLogService.markError({
        transactionRef: body?.code || null,
        webhookLogId,
        errorMsg: `Signature verification failed: ${sigResult.error}`,
      });
      return sepayService.buildIpnError(sigResult.error);
    }

    // Parse bank transaction
    const parseResult = sepayWebhookService.parseBankWebhook(body);
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

    // Idempotency: check if we already processed this SePay transaction
    const existingWebhook = await prisma.paymentWebhookLog.findFirst({
      where: {
        gateway: "SEPAY_BANK",
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
      // Match by code (= transactionRef in Payment table)
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, booking_id
        FROM payments
        WHERE transaction_ref = ${code}
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

      // Verify amount matches
      if (payment.amount !== transferAmount) {
        logger.warn("SePay bank webhook amount mismatch", {
          expected: payment.amount,
          received: transferAmount,
          code,
        });
        return {
          type: "AMOUNT_MISMATCH",
          expected: payment.amount,
          received: transferAmount,
        };
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          paidAt: new Date(),
          transactionId: String(sepayTransactionId),
          bankCode: gateway || null,
          paymentData: {
            sepayTransactionId,
            gateway,
            transactionDate,
            referenceCode,
            transferAmount,
            source: "sepay_bank_webhook",
            processedAt: new Date().toISOString(),
          },
        },
      });

      const bookingForTx = await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.PAID_PENDING_CONFIRM,
          paymentStatus: PAYMENT_STATUS.PAID,
          confirmedAt: null,
        },
        select: {
          id: true,
          businessId: true,
          finalPrice: true,
          service: {
            select: { business: { select: { commissionRate: true } } },
          },
        },
      });

      const commissionRate =
        Number(bookingForTx.service?.business?.commissionRate) || 10;
      await processPaymentLedger(
        tx,
        bookingForTx.id,
        bookingForTx.finalPrice,
        commissionRate,
        bookingForTx.businessId,
      );

      await tx.bookingActionLog.create({
        data: {
          bookingId: payment.booking_id,
          action: "approve",
          actorUserId: null,
          metadata: {
            source: "sepay_bank_webhook",
            gateway,
            sepayTransactionId,
          },
        },
      });

      return {
        type: "SUCCESS",
        payment: updatedPayment,
        bookingId: payment.booking_id,
      };
    });

    if (result.type && result.type !== "NOT_FOUND" && webhookLogId) {
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

    if (result.type === "ALREADY_PROCESSED") {
      return sepayService.buildIpnSuccess();
    }

    if (result.type === "AMOUNT_MISMATCH") {
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
    logger.error("processSePayBankWebhook error", {
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

/**
 * Process SePay outgoing bank transaction webhook.
 * Matches money-out events to payout transfers or refunded payments.
 */
export async function processSePayRefundWebhook(body, headers = {}, rawBody = null) {
  const webhookLogId = await webhookLogService.logWebhook({
    gateway: "SEPAY_BANK_REFUND",
    payload: body,
    signature: headers["x-sepay-signature"] || null,
  });

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
      await webhookLogService.markError({
        transactionRef: body?.code || null,
        webhookLogId,
        errorMsg: `Signature verification failed: ${sigResult.error}`,
      });
      return sepayService.buildIpnError(sigResult.error);
    }

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
          const refundedAmount = Number(payment.refund_amount || 0);
          if (refundedAmount > 0 && Number(transferAmount) > refundedAmount) {
            logger.warn("SePay refund webhook payment amount exceeds refund", {
              transactionRef: code,
              refundedAmount,
              received: transferAmount,
            });
            return { type: "AMOUNT_MISMATCH", transactionRef: code };
          }

          const paymentData =
            payment.payment_data && typeof payment.payment_data === "object"
              ? payment.payment_data
              : {};

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              paymentData: {
                ...paymentData,
                refundTransfer: {
                  sepayTransactionId,
                  gateway,
                  transactionDate,
                  referenceCode,
                  transferAmount,
                  confirmedAt: new Date().toISOString(),
                },
              },
            },
          });

          return { type: "PAYMENT_REFUND_CONFIRMED", transactionRef: code };
        }
      }

      return { type: "NOT_FOUND", transactionRef: code };
    });

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
  { amount, reason } = {},
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

  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw new ServiceError(
      "Chỉ có thể hoàn tiền đơn đã thanh toán",
      422,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const refundAmt = amount ?? payment.amount;

  return bookingService.refund(
    payment.bookingId,
    { refundAmount: refundAmt, refundReason: reason },
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
