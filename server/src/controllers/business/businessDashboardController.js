/**
 * Business Dashboard Controller - SRP: Xử lý request thống kê dashboard
 */
import * as businessDashboardService from "../../services/business/businessDashboardService.js";

export const getDashboard = async (req, res, next) => {
  try {
    const { preset, dateFrom, dateTo } = req.query;
    const stats = await businessDashboardService.getDashboard(req.user.userId, {
      preset,
      dateFrom,
      dateTo,
    });
    res.json({
      success: true,
      data: stats,
      message: "Lấy dashboard doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};
