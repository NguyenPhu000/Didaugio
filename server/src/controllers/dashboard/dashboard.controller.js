import * as dashboardService from "../../services/dashboard/dashboard.service.js";

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê thành công",
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
      message: "Lấy timeline thành công",
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
      message: "Lấy trạng thái hệ thống thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getOnlineUsers = async (req, res, next) => {
  try {
    const data = await dashboardService.getOnlineUsersCount();
    res.json({
      success: true,
      data,
      message: "Lấy danh sách online thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default { getStats, getTimeline, getHealth, getOnlineUsers };
