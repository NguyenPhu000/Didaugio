import crypto from "node:crypto";
import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";
import { PAYMENT_STATUS, BOOKING_STATUS } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import * as vnpayService from "./vnpay.service.js";
import * as momoService from "./momo.service.js";
import * as webhookLogService from "./webhookLog.service.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import * as bookingService from "../booking/booking.service.js";

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
export async function createCheckout({ bookingId, paymentMethod, ipAddress, userId, clientType = "web" }) {
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
    throw new ServiceError("Booking không thuộc về bạn", 403, ERROR_CODES.FORBIDDEN);
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw new ServiceError(
      `Booking đang ở trạng thái "${booking.status}", không thể thanh toán`,
      422,
      ERROR_CODES.BOOKING_INVALID_STATUS,
    );
  }

  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new ServiceError("Booking đã được thanh toán", 422, ERROR_CODES.CONFLICT);
  }

  const normalizedMethod = paymentMethod.toUpperCase();
  if (normalizedMethod !== "VNPAY" && normalizedMethod !== "MOMO") {
    throw new ServiceError(
      "Phương thức thanh toán không hỗ trợ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const amount = booking.finalPrice;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ServiceError("Số tiền thanh toán không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const existingPaymentCount = await prisma.payment.count({
    where: { bookingId: booking.id },
  });
  const attemptCount = existingPaymentCount + 1;
  const transactionRef = `DDG_BKG_${booking.id}_${attemptCount}`;
  const idempotencyKey = crypto.randomUUID();

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      amount,
      paymentMethod: normalizedMethod,
      transactionRef,
      idempotencyKey,
      status: PAYMENT_STATUS.UNPAID,
    },
    select: { id: true, transactionRef: true },
  });

  const orderInfo = `Thanh toan booking ${booking.bookingCode}`;

  // Build the return URL: server endpoint that handles redirect logic.
  // For mobile, the server will forward to the app deep link.
  const serverBase = process.env.API_BASE_URL || `http://localhost:8081`;
  const returnUrl = `${serverBase}/api/payments/${normalizedMethod === "VNPAY" ? "vnpay-return" : "momo-return"}?clientType=${clientType}&bookingId=${booking.id}&paymentId=${payment.id}`;

  let paymentUrl;
  try {
    if (normalizedMethod === "VNPAY") {
      paymentUrl = vnpayService.createPaymentUrl({
        amount,
        transactionRef,
        orderInfo,
        ipAddress: ipAddress || "127.0.0.1",
        returnUrl,
      });
    } else {
      const momoResult = await momoService.createPaymentUrl({
        amount,
        transactionRef,
        orderInfo,
        returnUrl,
      });
      paymentUrl = momoResult.paymentUrl;
      if (momoResult.transId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { transactionId: momoResult.transId },
        });
      }
    }
  } catch (gatewayError) {
    await prisma.payment
      .delete({ where: { id: payment.id } })
      .catch(() => {});
    throw gatewayError;
  }

  return {
    paymentUrl,
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
  const webhookLogId = await webhookLogService.logWebhook({
    gateway: "VNPAY",
    payload: query,
    signature: query.vnp_SecureHash || null,
  });

  try {
    const verifyResult = vnpayService.verifyIpn(query);
    if (!verifyResult.valid) {
      await webhookLogService.markError({
        transactionRef: query.vnp_TxnRef || null,
        webhookLogId,
        errorMsg: verifyResult.error,
      });
      return vnpayService.buildIpnResponse("97", verifyResult.error || "Invalid signature");
    }

    const { transactionRef, responseCode, amount, bankCode, transactionNo, payDate } =
      verifyResult.data;

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

      await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.CONFIRMED,
          confirmedAt: new Date(),
          paymentStatus: PAYMENT_STATUS.PAID,
        },
      });

      await tx.bookingTransaction.upsert({
        where: { bookingId: payment.booking_id },
        update: {},
        create: {
          bookingId: payment.booking_id,
          businessId: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { businessId: true },
            })
          ).businessId,
          originalPrice: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { originalPrice: true },
            })
          ).originalPrice,
          finalPrice: payment.amount,
          discountAmount: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { discountAmount: true },
            })
          ).discountAmount,
          commissionRate: 10,
          commissionAmount: Math.floor(payment.amount * 10 / 100),
          netAmount: payment.amount - Math.floor(payment.amount * 10 / 100),
          completedAt: new Date(),
          source: "payment_gateway",
        },
      });

      return { type: "SUCCESS", payment: updatedPayment, bookingId: payment.booking_id };
    });

    if (result.type && result.type !== "NOT_FOUND") {
      await webhookLogService.markProcessed({ transactionRef, webhookLogId });
    }

    if (result.type === "NOT_FOUND") {
      return vnpayService.buildIpnResponse("01", "Order not found");
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
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.CONFIRMED, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        confirmedBy: null,
        source: "payment_gateway",
        paymentMethod: "VNPAY",
      });

      return vnpayService.buildIpnResponse("00", "Confirm success");
    }
  } catch (error) {
    logger.error("processVNPayIPN error", { error: error.message, transactionRef: query.vnp_TxnRef });
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
  const webhookLogId = await webhookLogService.logWebhook({
    gateway: "MOMO",
    payload: body,
    signature: body.signature || null,
  });

  try {
    const verifyResult = momoService.verifyIpnSignature(body);
    if (!verifyResult.valid) {
      await webhookLogService.markError({
        transactionRef: body.orderId || null,
        webhookLogId,
        errorMsg: verifyResult.error,
      });
      return momoService.buildIpnResponse(1000, verifyResult.error || "Invalid signature");
    }

    const { orderId, amount, transId, resultCode, message } = body;

    const dbResult = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw`
        SELECT id, status, amount, booking_id
        FROM payments
        WHERE transaction_ref = ${orderId}
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

      await tx.booking.update({
        where: { id: payment.booking_id },
        data: {
          status: BOOKING_STATUS.CONFIRMED,
          confirmedAt: new Date(),
          paymentStatus: PAYMENT_STATUS.PAID,
        },
      });

      await tx.bookingTransaction.upsert({
        where: { bookingId: payment.booking_id },
        update: {},
        create: {
          bookingId: payment.booking_id,
          businessId: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { businessId: true },
            })
          ).businessId,
          originalPrice: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { originalPrice: true },
            })
          ).originalPrice,
          finalPrice: payment.amount,
          discountAmount: (
            await tx.booking.findUnique({
              where: { id: payment.booking_id },
              select: { discountAmount: true },
            })
          ).discountAmount,
          commissionRate: 10,
          commissionAmount: Math.floor(payment.amount * 10 / 100),
          netAmount: payment.amount - Math.floor(payment.amount * 10 / 100),
          completedAt: new Date(),
          source: "payment_gateway",
        },
      });

      return { type: "SUCCESS", payment: updatedPayment, bookingId: payment.booking_id };
    });

    if (dbResult.type && dbResult.type !== "NOT_FOUND") {
      await webhookLogService.markProcessed({ transactionRef: orderId, webhookLogId });
    }

    if (dbResult.type === "NOT_FOUND") {
      return momoService.buildIpnResponse(1000, "Order not found");
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
          service: {
            select: {
              place: { select: { name: true } },
              business: { select: { ownerId: true } },
            },
          },
        },
      });

      eventEmitter.emit(EVENTS.BOOKING.CONFIRMED, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        confirmedBy: null,
        source: "payment_gateway",
        paymentMethod: "MOMO",
      });

      return momoService.buildIpnResponse(0, "Confirm success");
    }
  } catch (error) {
    logger.error("processMoMoIPN error", { error: error.message, orderId: body.orderId });
    await webhookLogService.markError({
      transactionRef: body.orderId || null,
      webhookLogId,
      errorMsg: error.message,
    });
    return momoService.buildIpnResponse(1001, "System error");
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
export async function refundPayment(paymentId, { amount, reason } = {}, adminUserId) {
  const id = parseInt(paymentId, 10);
  if (Number.isNaN(id)) {
    throw new ServiceError("Payment ID không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, bookingId: true, amount: true, status: true },
  });

  if (!payment) {
    throw new ServiceError("Không tìm thấy giao dịch", 404, ERROR_CODES.NOT_FOUND);
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
    throw new ServiceError("Payment ID không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, status: true, refundReason: true },
  });

  if (!payment) {
    throw new ServiceError("Không tìm thấy giao dịch", 404, ERROR_CODES.NOT_FOUND);
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
      { booking: { guestName: { contains: search, mode: "insensitive" } } },
      { booking: { service: { place: { name: { contains: search, mode: "insensitive" } } } } },
      { booking: { service: { place: { business: { name: { contains: search, mode: "insensitive" } } } } } },
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
                    business: { select: { id: true, name: true } },
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
    throw new ServiceError("Payment ID không hợp lệ", 400, ERROR_CODES.VALIDATION_ERROR);
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
                      name: true,
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
    throw new ServiceError("Bạn không có quyền xem payment này", 403, ERROR_CODES.FORBIDDEN);
  }

  return payment;
}
