import * as paymentService from "../../services/payment/payment.service.js";
import * as vnpayService from "../../services/payment/vnpay.service.js";
import * as sepayService from "../../services/payment/sepay.service.js";
import * as cashflowService from "../../services/payment/cashflow.service.js";
import { appConfig } from "../../config/app.config.js";
import { PAYMENT_METHODS } from "../../config/constants.js";
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

  const resultCode = parseInt(req.query.resultCode || "1000", 10);
  const orderId = req.query.orderId || "";

  const baseParams = `bookingId=${bookingId || ""}&paymentId=${paymentId || ""}`;
  if (resultCode === 0) {
    const successUrl = isMobile
      ? `${mobileScheme}payment/result?status=success&${baseParams}`
      : `${frontendUrl}/payment/result?status=success&ref=${orderId}`;
    return res.redirect(successUrl);
  } else {
    const message = encodeURIComponent(req.query.message || "");
    const failUrl = isMobile
      ? `${mobileScheme}payment/result?status=failed&${baseParams}&code=${resultCode}&message=${message}`
      : `${frontendUrl}/payment/result?status=failed&ref=${orderId}&code=${resultCode}`;
    return res.redirect(failUrl);
  }
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

  const { responseCode, transactionRef } = verifyResult.data;

  const baseParams = `bookingId=${bookingId || ""}&paymentId=${paymentId || ""}`;
  if (responseCode === "00") {
    const successUrl = isMobile
      ? `${mobileScheme}payment/result?status=success&${baseParams}`
      : `${frontendUrl}/payment/result?status=success&ref=${transactionRef}`;
    return res.redirect(successUrl);
  } else {
    const failUrl = isMobile
      ? `${mobileScheme}payment/result?status=failed&${baseParams}&code=${responseCode}`
      : `${frontendUrl}/payment/result?status=failed&ref=${transactionRef}&code=${responseCode}`;
    return res.redirect(failUrl);
  }
}

/**
 * POST /api/payments/sepay-ipn
 * Auth: None (server-to-server webhook from SePay)
 * Body: JSON { notification_type, order, transaction }
 */
export async function sepayIpn(req, res, next) {
  try {
    const result = await paymentService.processSePayIPN(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
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

  const baseParams = `bookingId=${bookingId || ""}&paymentId=${paymentId || ""}`;

  // SePay redirects to success_url on success, error_url on error, cancel_url on cancel.
  // We use the same URL with a status query param to differentiate.
  const status = req.query.status || "success";

  if (status === "success") {
    const successUrl = isMobile
      ? `${mobileScheme}payment/result?status=success&${baseParams}`
      : `${frontendUrl}/payment/result?status=success&${baseParams}`;
    return res.redirect(successUrl);
  }

  const failUrl = isMobile
    ? `${mobileScheme}payment/result?status=failed&${baseParams}`
    : `${frontendUrl}/payment/result?status=failed&${baseParams}`;
  return res.redirect(failUrl);
}

/**
 * GET /api/payments/sepay-checkout-form/:paymentId
 * Auth: None (opened in browser by mobile app)
 * Renders an HTML page with auto-submit form to SePay checkout URL.
 * Used by mobile clients that cannot POST directly to SePay.
 */
export async function sepayCheckoutForm(req, res, next) {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId, {
      userId: null,
      roleId: 1, // admin-level to bypass ownership check for form rendering
    });

    if (!payment || payment.paymentMethod !== PAYMENT_METHODS.SEPAY) {
      return res.status(404).send("Payment not found");
    }

    const serverBase = appConfig.apiBaseUrl;
    const clientType = req.query.clientType || "mobile";
    const successUrl = `${serverBase}/api/payments/sepay-return?clientType=${clientType}&bookingId=${payment.bookingId}&paymentId=${payment.id}`;
    const errorUrl = `${successUrl}&status=error`;
    const cancelUrl = `${successUrl}&status=cancel`;

    const sepayResult = await sepayService.createCheckoutForm({
      amount: payment.amount,
      transactionRef: payment.transactionRef,
      orderInfo: `Thanh toan booking ${payment.bookingId}`,
      successUrl,
      errorUrl,
      cancelUrl,
    });

    const fieldsHtml = Object.entries(sepayResult.fields)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, "&quot;")}" />`,
      )
      .join("\n    ");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanh toán SePay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f7; }
    .container { text-align: center; padding: 32px; max-width: 360px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #1D1D1F; }
    p { color: #666; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
    button { background: #1D1D1F; color: #fff; border: none; padding: 16px 40px; border-radius: 22px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; }
    button:active { opacity: 0.8; }
    .info { margin-top: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#128179;</div>
    <h2>Thanh toán qua SePay</h2>
    <p>Bấm nút bên dưới để chuyển đến cổng thanh toán SePay</p>
    <form id="sepay-form" action="${sepayResult.checkoutUrl}" method="POST">
      ${fieldsHtml}
      <button type="submit">Tiến hành thanh toán</button>
    </form>
    <p class="info">Mã đơn: ${payment.transactionRef}</p>
  </div>
</body>
</html>`);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/sepay-webhook
 * Auth: None (server-to-server webhook from SePay Webhooks system)
 * Body: JSON { id, gateway, code, content, transferType, transferAmount, ... }
 *
 * This is the SePay bank transaction webhook (Dashboard → Tích hợp → Webhooks),
 * separate from the Payment Gateway IPN (/sepay-ipn).
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
