import profileService from "../services/profileService.js";

// PROFILE CONTROLLER

/**
 * GET /api/profile
 * Lấy thông tin profile hiện tại
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.userId);
    res.json({
      success: true,
      data: profile,
      message: "Lay thong tin profile thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Cập nhật thông tin profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedProfile = await profileService.updateProfile(
      req.user.userId,
      req.body
    );
    res.json({
      success: true,
      data: updatedProfile,
      message: "Cap nhat profile thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/avatar
 * Cập nhật avatar
 */
export const updateAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    const result = await profileService.updateAvatar(
      req.user.userId,
      avatarUrl
    );
    res.json({
      success: true,
      data: result,
      message: "Cap nhat avatar thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/notifications
 * Cập nhật cài đặt thông báo
 */
export const updateNotificationSettings = async (req, res, next) => {
  try {
    const result = await profileService.updateNotificationSettings(
      req.user.userId,
      req.body
    );
    res.json({
      success: true,
      data: result,
      message: "Cap nhat cai dat thong bao thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/travel-preferences
 * Cập nhật sở thích du lịch
 */
export const updateTravelPreferences = async (req, res, next) => {
  try {
    const result = await profileService.updateTravelPreferences(
      req.user.userId,
      req.body
    );
    res.json({
      success: true,
      data: result,
      message: "Cap nhat so thich du lich thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  updateAvatar,
  updateNotificationSettings,
  updateTravelPreferences,
};
