import * as revenueService from "../../services/business/revenue.service.js";
import * as cashflowService from "../../services/payment/cashflow.service.js";

const getBusinessId = (req) => req.business?.id || req.activeBusiness?.id;

const requireBusiness = (req, res) => {
  const businessId = getBusinessId(req);
  if (!businessId) {
    res.status(403).json({
      success: false,
      data: null,
      message: "Không tìm thấy doanh nghiệp",
      errorCode: "NO_BUSINESS",
    });
    return null;
  }
  return businessId;
};

/**
 * GET /api/business/revenue/overview
 */
export const getOverview = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await revenueService.getOverview(businessId, req.query);
    res.json({ success: true, data, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/timeline
 */
export const getTimeline = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await revenueService.getTimeline(businessId, req.query);
    res.json({ success: true, data, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/by-place
 */
export const getByPlace = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await revenueService.getByPlace(businessId, req.query);
    res.json({ success: true, data, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await revenueService.getTransactions(businessId, req.query);
    res.json({ success: true, data, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/export
 */
export const exportCsv = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const byPlace = await revenueService.getByPlace(businessId, req.query);

    const header = "Địa điểm,Doanh thu,Số booking,Giá trị TB\n";
    const rows = byPlace
      .map(
        (item) =>
          `"${item.placeName}",${item.totalRevenue},${item.bookingCount},${item.avgOrderValue}`
      )
      .join("\n");

    const csv = header + rows;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=revenue_report.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/cashflow
 */
export const getCashflow = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await cashflowService.getCashflow({
      ...req.query,
      businessId,
    });
    res.json({
      success: true,
      data: data.rows,
      message: "OK",
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/revenue/cashflow/summary
 */
export const getCashflowSummary = async (req, res, next) => {
  try {
    const businessId = requireBusiness(req, res);
    if (!businessId) return;

    const data = await cashflowService.getCashflowSummary({ businessId });
    res.json({ success: true, data, message: "OK" });
  } catch (error) {
    next(error);
  }
};

export default {
  getOverview,
  getTimeline,
  getByPlace,
  getTransactions,
  exportCsv,
  getCashflow,
  getCashflowSummary,
};
