import * as payoutService from "../../services/business/payout.service.js";

/**
 * GET /api/business/earnings
 * Get earnings summary for the current business
 */
export const getEarnings = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const summary = await payoutService.getEarningsSummary(businessId);
    res.json({ success: true, data: summary, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/payouts
 * Request a payout
 */
export const requestPayout = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const payout = await payoutService.requestPayout(businessId, req.body);
    res.status(201).json({
      success: true,
      data: payout,
      message: "Yêu cầu rút tiền đã được gửi",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/payouts
 * Get payout history for the current business
 */
export const getPayouts = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const result = await payoutService.getPayoutHistory(businessId, req.query);
    res.json({ success: true, data: result, message: "OK" });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Endpoints ───────────────────────────────────────────

/**
 * GET /api/admin/payouts
 * Admin: list all payout requests
 */
export const adminGetAll = async (req, res, next) => {
  try {
    const result = await payoutService.getAllPayouts(req.query);
    res.json({ success: true, data: result, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/payouts/:id/approve
 * Admin: approve a payout
 */
export const adminApprove = async (req, res, next) => {
  try {
    const payout = await payoutService.approvePayout(
      parseInt(req.params.id),
      req.user.userId,
    );
    res.json({
      success: true,
      data: payout,
      message: "Đã duyệt yêu cầu rút tiền",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/payouts/:id/transfer
 * Admin: mark payout as transferred
 */
export const adminTransfer = async (req, res, next) => {
  try {
    const payout = await payoutService.markTransferred(
      parseInt(req.params.id),
      req.user.userId,
    );
    res.json({
      success: true,
      data: payout,
      message: "Đã xác nhận chuyển khoản",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/payouts/:id/reject
 * Admin: reject a payout
 */
export const adminReject = async (req, res, next) => {
  try {
    const payout = await payoutService.rejectPayout(
      parseInt(req.params.id),
      req.user.userId,
      req.body.reason,
    );
    res.json({
      success: true,
      data: payout,
      message: "Đã từ chối yêu cầu rút tiền",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getEarnings,
  requestPayout,
  getPayouts,
  adminGetAll,
  adminApprove,
  adminTransfer,
  adminReject,
};
