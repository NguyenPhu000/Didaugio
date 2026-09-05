import * as systemSettingsService from "../../services/settings/systemSettings.service.js";

export const getSettings = async (req, res, next) => {
  try {
    const data = await systemSettingsService.getMergedSettings();
    res.json({
      success: true,
      data,
      message: "Đã tải cấu hình hệ thống.",
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const err = new Error("Không xác định người dùng.");
      err.statusCode = 401;
      throw err;
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const data = await systemSettingsService.saveSettings(body, userId);
    res.json({
      success: true,
      data,
      message: "Đã lưu cài đặt hệ thống thành công.",
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemLogs = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const data = await systemSettingsService.getSystemLogs(limit);
    res.json({
      success: true,
      data,
      message: "Đã tải nhật ký hệ thống.",
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    const data = await systemSettingsService.getSystemHealth();
    res.json({
      success: true,
      data,
      message: "Đã kiểm tra sức khỏe hệ thống.",
    });
  } catch (error) {
    next(error);
  }
};
