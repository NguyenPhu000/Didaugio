import * as subscriptionService from "../../services/subscription/subscription.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import logger from "../../config/logger.js";

function successResponse(res, data, message = "Thành công", errorCode, pagination) {
  return res.status(200).json({ success: true, data, message, errorCode, pagination });
}

function errorResponse(res, status, message, errorCode) {
  return res.status(status).json({ success: false, data: null, message, errorCode });
}

// ─── Business Endpoints ──────────────────────────────────────────────────────

export async function getCurrentSubscription(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const data = await subscriptionService.getCurrentSubscription(businessId);
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getPlans(_req, res, next) {
  try {
    const data = await subscriptionService.getPlans();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getProration(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const targetPlanId = parseInt(req.query.targetPlanId, 10);
    if (!targetPlanId) {
      return errorResponse(res, 400, "targetPlanId là bắt buộc", ERROR_CODES.VALIDATION_ERROR);
    }

    const data = await subscriptionService.calculateProration(businessId, targetPlanId);
    return successResponse(res, data);
  } catch (error) {
    if (error.message?.includes("không tồn tại") || error.message?.includes("Không tìm thấy")) {
      return errorResponse(res, 404, error.message, ERROR_CODES.NOT_FOUND);
    }
    if (error.message?.includes("đang sử dụng") || error.message?.includes("Chỉ được nâng cấp")) {
      return errorResponse(res, 400, error.message, ERROR_CODES.VALIDATION_ERROR);
    }
    next(error);
  }
}

export async function upgrade(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const { targetPlanId } = req.body;
    if (!targetPlanId) {
      return errorResponse(res, 400, "targetPlanId là bắt buộc", ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await subscriptionService.upgrade(businessId, targetPlanId);
    return successResponse(res, result, "Tạo hóa đơn thanh toán thành công");
  } catch (error) {
    if (error.message?.includes("không tồn tại") || error.message?.includes("Không tìm thấy")) {
      return errorResponse(res, 404, error.message, ERROR_CODES.NOT_FOUND);
    }
    if (
      error.message?.includes("đang sử dụng") ||
      error.message?.includes("Chỉ được nâng cấp") ||
      error.message?.includes("bị khóa")
    ) {
      return errorResponse(res, 400, error.message, ERROR_CODES.VALIDATION_ERROR);
    }
    next(error);
  }
}

export async function downgrade(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "KhÃ´ng tÃ¬m tháº¥y doanh nghiá»‡p", "NO_BUSINESS");
    }

    const { targetPlanId } = req.body;
    if (!targetPlanId) {
      return errorResponse(res, 400, "targetPlanId lÃ  báº¯t buá»™c", ERROR_CODES.VALIDATION_ERROR);
    }

    const result = await subscriptionService.scheduleDowngrade(businessId, targetPlanId);
    return successResponse(res, result, "ÄÃ£ lÃªn lá»‹ch háº¡ gÃ³i cuá»‘i chu ká»³");
  } catch (error) {
    if (error.message?.includes("khÃ´ng tá»“n táº¡i") || error.message?.includes("KhÃ´ng tÃ¬m tháº¥y")) {
      return errorResponse(res, 404, error.message, ERROR_CODES.NOT_FOUND);
    }
    if (
      error.message?.includes("Ä‘ang sá»­ dá»¥ng") ||
      error.message?.includes("Háº¡ gÃ³i") ||
      error.message?.includes("bá»‹ khÃ³a")
    ) {
      return errorResponse(res, 400, error.message, ERROR_CODES.VALIDATION_ERROR);
    }
    next(error);
  }
}

export async function cancelScheduledDowngrade(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "KhÃ´ng tÃ¬m tháº¥y doanh nghiá»‡p", "NO_BUSINESS");
    }

    const result = await subscriptionService.cancelScheduledDowngrade(businessId);
    return successResponse(res, result, "ÄÃ£ há»§y lá»‹ch háº¡ gÃ³i");
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const result = await subscriptionService.getInvoices(businessId, req.query);
    return successResponse(res, result.data, "Lấy lịch sử hóa đơn thành công", undefined, result.pagination);
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const { reason } = req.body;
    const result = await subscriptionService.cancelSubscription(businessId, reason);
    return successResponse(res, result, "Hủy subscription thành công");
  } catch (error) {
    if (error.message?.includes("đã bị hủy")) {
      return errorResponse(res, 400, error.message, "ALREADY_CANCELED");
    }
    next(error);
  }
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export async function sepayWebhook(req, res, next) {
  try {
    const result = await subscriptionService.processSubscriptionWebhook(req.body, req.headers, req.rawBody);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    }
    return res.status(200).json({ success: false, message: result.message });
  } catch (error) {
    logger.error("[subscription-webhook] Lỗi xử lý webhook", error);
    return res.status(200).json({ success: false, message: "Lỗi xử lý webhook" });
  }
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

export async function adminGetSubscriptions(req, res, next) {
  try {
    const result = await subscriptionService.getAllSubscriptions(req.query);
    return successResponse(res, result.data, "Lấy danh sách subscription thành công", undefined, result.pagination);
  } catch (error) {
    next(error);
  }
}

export async function adminGetStats(_req, res, next) {
  try {
    const data = await subscriptionService.getSubStats();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
}

export async function adminGetPlans(_req, res, next) {
  try {
    const data = await subscriptionService.getAdminPlans();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
}

export async function adminCreatePlan(req, res, next) {
  try {
    const data = await subscriptionService.adminCreatePlan(req.body);
    return successResponse(res, data, "Tạo plan thành công");
  } catch (error) {
    if (error.message?.includes("đã tồn tại")) {
      return errorResponse(res, 400, error.message, ERROR_CODES.EXISTED);
    }
    next(error);
  }
}

export async function adminUpdatePlan(req, res, next) {
  try {
    const planId = parseInt(req.params.id, 10);
    if (!planId) {
      return errorResponse(res, 400, "ID plan không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const data = await subscriptionService.adminUpdatePlan(planId, req.body);
    return successResponse(res, data, "Cập nhật plan thành công");
  } catch (error) {
    if (error.message?.includes("không tồn tại")) {
      return errorResponse(res, 404, error.message, ERROR_CODES.NOT_FOUND);
    }
    if (error.message?.includes("đã tồn tại")) {
      return errorResponse(res, 400, error.message, ERROR_CODES.EXISTED);
    }
    next(error);
  }
}

export async function adminUpdateStatus(req, res, next) {
  try {
    const subscriptionId = parseInt(req.params.id, 10);
    if (!subscriptionId) {
      return errorResponse(res, 400, "ID subscription không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const data = await subscriptionService.adminUpdateStatus(subscriptionId, req.body);
    return successResponse(res, data, "Cập nhật trạng thái thành công");
  } catch (error) {
    if (error.message?.includes("không tồn tại")) {
      return errorResponse(res, 404, error.message, ERROR_CODES.NOT_FOUND);
    }
    next(error);
  }
}

export async function payInvoiceFromWallet(req, res, next) {
  try {
    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return errorResponse(res, 403, "Không tìm thấy doanh nghiệp", "NO_BUSINESS");
    }

    const invoiceId = parseInt(req.params.invoiceId, 10);
    if (!invoiceId) {
      return errorResponse(res, 400, "ID hóa đơn không hợp lệ", ERROR_CODES.VALIDATION_ERROR);
    }

    const data = await subscriptionService.payInvoiceFromWallet(businessId, invoiceId);
    return successResponse(res, data, "Thanh toán từ ví thành công");
  } catch (error) {
    if (error.errorCode === "INSUFFICIENT_WALLET_BALANCE") {
      return errorResponse(res, 400, error.message, error.errorCode);
    }
    if (error.errorCode === "INVOICE_NOT_FOUND" || error.errorCode === "ALREADY_PAID" || error.errorCode === "INVOICE_CANCELED") {
      return errorResponse(res, 400, error.message, error.errorCode);
    }
    next(error);
  }
}
