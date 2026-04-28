import * as dashboardService from "../../services/dashboard/dashboard.service.js";

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
      message: "Lay thong ke thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req, res, next) => {
  try {
    const timeline = await dashboardService.getActivityTimeline();
    res.json({
      success: true,
      data: timeline,
      message: "Lay timeline thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export const getHealth = async (req, res, next) => {
  try {
    const health = await dashboardService.getSystemHealth();
    res.json({
      success: true,
      data: health,
      message: "Lay trang thai he thong thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export default { getStats, getTimeline, getHealth };
