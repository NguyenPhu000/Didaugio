import * as systemSettingsService from "../../services/settings/systemSettings.service.js";

export const getSettings = async (req, res, next) => {
  try {
    const data = await systemSettingsService.getMergedSettings();
    res.json({
      success: true,
      data,
      message: "Đã tải cài đặt hệ thống.",
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
      message: "Đã lưu cài đặt hệ thống.",
    });
  } catch (error) {
    next(error);
  }
};
