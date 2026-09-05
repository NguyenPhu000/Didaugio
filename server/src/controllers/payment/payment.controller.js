// MAP: payment.controller
// ├── ROUTE: src/routes/payment/payment.routes.js
// └── SERVICE: src/services/payment/{payment.service.js, vnpay.service.js, sepay.service.js, cashflow.service.js}

import * as paymentService from "../../services/payment/payment.service.js";
import * as vnpayService from "../../services/payment/vnpay.service.js";
import * as cashflowService from "../../services/payment/cashflow.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import { rejectRefundSchema } from "../../models/schemas/payment/payment.schema.js";

function successResponse(
  res,
  data,
  message = "Thành công",
  errorCode,
  pagination,
) {
  return res
    .status(200)
    .json({ success: true, data, message, errorCode, pagination });
}

function errorResponse(res, status, message, errorCode) {
  return res
    .status(status)
    .json({ success: false, data: null, message, errorCode });
}

const normalizeRedirectId = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed) : null;
};

const paymentResultRedirect = (baseUrl, params = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  return `${baseUrl}?${query.toString()}`;
};

const resolvePaymentResultBase = (isMobile, frontendUrl, mobileScheme) =>
  isMobile
    ? `${mobileScheme.endsWith("/") ? mobileScheme : `${mobileScheme}/`}payment/result`
    : `${frontendUrl.replace(/\/+$/u, "")}/payment/result`;

/**
 * POST /api/payments/checkout
 * Auth: User (JWT)
 * Body: { bookingId, paymentMethod, ipAddress? }
 */
export async function checkout(req, res, next) {
  try {
    const { bookingId, paymentMethod, ipAddress, clientType } = req.body;
    const userId = req.user.userId;

    if (!bookingId) {
      return errorResponse(
        res,
        400,
        "bookingId là bắt buộc",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    if (!paymentMethod) {
      return errorResponse(
        res,
        400,
        "paymentMethod là bắt buộc",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const result = await paymentService.createCheckout({
      bookingId,
      paymentMethod,
      clientType: clientType || "web",
      ipAddress:
        ipAddress || req.ip || req.connection?.remoteAddress || "127.0.0.1",
      userId,
    });

    return successResponse(
      res,
      {
        paymentUrl: result.paymentUrl,
        deeplink: result.deeplink || null,
        sepayFields: result.sepayFields || null,
        qrUrl: result.qrUrl || null,
        bankName: result.bankName || null,
        bankAccountNumber: result.bankAccountNumber || null,
        bankAccountName: result.bankAccountName || null,
        amount: result.amount ?? null,
        paymentId: result.paymentId,
        transactionRef: result.transactionRef,
      },
      "Tao link thanh toan thanh cong",
    );
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(
        res,
        error.statusCode,
        error.message,
        error.errorCode,
      );
    }
    next(error);
  }
}

/**
 * GET /api/payments/vnpay-ipn
 * Auth: None (server-to-server webhook)
 * Query params from VNPay
 */
export async function vnpayIpn(req, res, next) {
  try {
    const result = await paymentService.processVNPayIPN(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/momo-ipn
 * Auth: None (server-to-server webhook)
 * Body: JSON from MoMo
 */
export async function momoIpn(req, res, next) {
  try {
    const result = await paymentService.processMoMoIPN(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/momo-return
 * Auth: None (browser redirect from MoMo)
 * Only for UI redirect — does NOT write to DB.
 */
export function momoReturn(req, res, next) {
  const { clientType, bookingId, paymentId } = req.query;
  const isMobile = clientType === "mobile";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const mobileScheme = process.env.MOBILE_DEEP_LINK || "didigaugio://";

  const resultBase = resolvePaymentResultBase(isMobile, frontendUrl, mobileScheme);
  return res.redirect(paymentResultRedirect(resultBase, {
    status: "pending_verify",
    bookingId: normalizeRedirectId(bookingId),
    paymentId: normalizeRedirectId(paymentId),
  }));
}

/**
 * GET /api/payments/vnpay-return
 * Auth: None (browser redirect)
 * Only for UI redirect — does NOT write to DB.
 */
export function vnpayReturn(req, res, next) {
  const { clientType, bookingId, paymentId } = req.query;
  const isMobile = clientType === "mobile";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const mobileScheme = process.env.MOBILE_DEEP_LINK || "didigaugio://";

  const verifyResult = vnpayService.verifyReturn(req.query);

  if (!verifyResult.valid) {
    const failUrl = isMobile
      ? `${mobileScheme}payment/result?status=error&message=signature_invalid`
      : `${frontendUrl}/payment/result?status=error&message=signature_invalid`;
    return res.redirect(failUrl);
  }

  const resultBase = resolvePaymentResultBase(isMobile, frontendUrl, mobileScheme);
  return res.redirect(paymentResultRedirect(resultBase, {
    status: "pending_verify",
    bookingId: normalizeRedirectId(bookingId),
    paymentId: normalizeRedirectId(paymentId),
  }));
}

/**
 * GET /api/payments/sepay-return
 * Auth: None (browser redirect from SePay)
 * Only for UI redirect — does NOT write to DB.
 */
export function sepayReturn(req, res, next) {
  const { clientType, bookingId, paymentId } = req.query;
  const isMobile = clientType === "mobile";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const mobileScheme = process.env.MOBILE_DEEP_LINK || "didigaugio://";

  const resultBase = resolvePaymentResultBase(isMobile, frontendUrl, mobileScheme);
  return res.redirect(paymentResultRedirect(resultBase, {
    status: "pending_verify",
    bookingId: normalizeRedirectId(bookingId),
    paymentId: normalizeRedirectId(paymentId),
  }));
}

/**
 * POST /api/payments/sepay-webhook
 * Auth: None (server-to-server webhook from SePay Webhooks system)
 * Body: JSON { id, gateway, code, content, transferType, transferAmount, ... }
 *
 * This is the SePay bank transaction webhook (Dashboard → Tích hợp → Webhooks),
 * separate from the SePay checkout flow.
 */
export async function sepayBankWebhook(req, res, next) {
  try {
    const result = await paymentService.processSePayBankWebhook(
      req.body,
      req.headers,
      req.rawBody,
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/sepay-webhook-refund
 * Auth: None (server-to-server outgoing bank webhook from SePay)
 */
export async function sepayRefundWebhook(req, res, next) {
  try {
    const result = await paymentService.processSePayRefundWebhook(
      req.body,
      req.headers,
      req.rawBody,
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/:id
 * Auth: User (JWT)
 * User can only see their own payments; Admin sees all.
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, roleId } = req.user;

    const payment = await paymentService.getPaymentById(id, { userId, roleId });

    return successResponse(res, {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      transactionRef: payment.transactionRef,
      bankCode: payment.bankCode,
      status: payment.status,
      paidAt: payment.paidAt,
      refundAmount: payment.refundAmount,
      refundedAt: payment.refundedAt,
      refundReason: payment.refundReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking: payment.booking
        ? {
            bookingCode: payment.booking.bookingCode,
            status: payment.booking.status,
            finalPrice: payment.booking.finalPrice,
            serviceName: payment.booking.service?.name,
            placeName: payment.booking.service?.place?.name,
          }
        : null,
    });
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(
        res,
        error.statusCode,
        error.message,
        error.errorCode,
      );
    }
    next(error);
  }
}

/**
 * POST /api/payments/:id/refund
 * Auth: Admin (hasPermission("payments.refund"))
 * Body: { amount?, reason? }
 */
export async function refund(req, res, next) {
  try {
    const result = await paymentService.refundPayment(
      req.params.id,
      { amount: req.body.amount, reason: req.body.reason, idempotencyKey: req.body.idempotencyKey },
      req.user.userId,
    );

    return successResponse(
      res,
      {
        id: result.payment?.id || result.id,
        status: result.paymentStatus,
        refundAmount: result.payment?.refundAmount,
        refundedAt: result.payment?.refundedAt,
        refundReason: result.payment?.refundReason,
      },
      "Hoàn tiền thành công",
    );
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(
        res,
        error.statusCode,
        error.message,
        error.errorCode,
      );
    }
    next(error);
  }
}

/**
 * GET /api/payments/by-booking/:bookingId
 * Auth: booking owner or super-admin/admin.  This is read-only and returns
 * the same public payment DTO as GET /:id.
 */
export async function getByBooking(req, res, next) {
  try {
    const payment = await paymentService.getPaymentByBookingId(req.params.bookingId, req.user);
    return successResponse(res, {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      transactionRef: payment.transactionRef,
      bankCode: payment.bankCode,
      status: payment.status,
      paidAt: payment.paidAt,
      refundAmount: payment.refundAmount,
      refundedAt: payment.refundedAt,
      refundReason: payment.refundReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking: payment.booking
        ? {
            bookingCode: payment.booking.bookingCode,
            status: payment.booking.status,
            finalPrice: payment.booking.finalPrice,
            serviceName: payment.booking.service?.name,
            placeName: payment.booking.service?.place?.name,
          }
        : null,
    });
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(res, error.statusCode, error.message, error.errorCode);
    }
    next(error);
  }
}

/** Protected operational path: persist the outgoing SePay refund obligation before bank action. */
export async function initiateSePayRefund(req, res, next) {
  try {
    const result = await paymentService.createPaymentRefundOrchestrator().initiateSePayBankRefund(
      req.params.id,
      { ...req.body, actorUserId: req.user.userId },
    );
    return successResponse(res, {
      refundAttemptId: result.attempt.id,
      status: result.status,
      replayed: result.replayed,
      transferReference: result.transferReference,
    }, "Đã tạo lệnh hoàn SePay đang chờ xác nhận");
  } catch (error) {
    if (error.name === "ServiceError") return errorResponse(res, error.statusCode, error.message, error.errorCode);
    next(error);
  }
}

/** Protected, bounded recovery for a single pending manual refund after post-commit finalizer failure. */
export async function recoverPendingManualRefund(req, res, next) {
  try {
    const result = await paymentService.createPaymentRefundOrchestrator().recoverPendingManualRefund(req.body.refundAttemptId);
    return successResponse(res, {
      refundAttemptId: result.attempt.id,
      status: result.status,
      replayed: result.replayed,
      refundAmount: result.refundedAmount,
    }, "Đã xử lý refund pending");
  } catch (error) {
    if (error.name === "ServiceError") return errorResponse(res, error.statusCode, error.message, error.errorCode);
    next(error);
  }
}

export async function rejectRefund(req, res, next) {
  try {
    const validation = rejectRefundSchema.safeParse(req.body || {});
    if (!validation.success) {
      return errorResponse(
        res,
        400,
        "Dữ liệu không hợp lệ",
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    const { reason } = validation.data;
    const result = await paymentService.rejectRefund(req.params.id, reason);

    return successResponse(
      res,
      { id: result.id, refundReason: result.refundReason },
      "Từ chối yêu cầu hoàn tiền thành công",
    );
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(
        res,
        error.statusCode,
        error.message,
        error.errorCode,
      );
    }
    next(error);
  }
}

export async function getAdminPayments(req, res, next) {
  try {
    const result = await paymentService.getAdminPayments(req.query);
    return successResponse(
      res,
      result.data,
      "Lấy danh sách thanh toán thành công",
      undefined,
      result.pagination,
    );
  } catch (error) {
    if (error.name === "ServiceError") {
      return errorResponse(
        res,
        error.statusCode,
        error.message,
        error.errorCode,
      );
    }
    next(error);
  }
}

export async function getAdminCashflow(req, res, next) {
  try {
    const result = await cashflowService.getCashflow(req.query);
    return successResponse(
      res,
      result.rows,
      "Lay dong tien thanh cong",
      undefined,
      result.pagination,
    );
  } catch (error) {
    next(error);
  }
}

export async function getAdminCashflowSummary(req, res, next) {
  try {
    const data = await cashflowService.getCashflowSummary(req.query);
    return successResponse(res, data, "Lay tong quan dong tien thanh cong");
  } catch (error) {
    next(error);
  }
}
