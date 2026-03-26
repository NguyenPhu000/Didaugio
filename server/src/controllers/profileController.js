import profileService from "../services/profileService.js";
import appService from "../services/appService.js";
import { ERROR_CODES } from "../config/messages.js";

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
      req.body,
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
      avatarUrl,
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
      req.body,
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
      req.body,
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

const getUserId = (req) => req.user?.userId || req.user?.id || null;

const parseId = (raw) => {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};

export const getProfileSummary = async (req, res, next) => {
  try {
    const data = await appService.getMyProfileSummary(getUserId(req));
    res.json({
      success: true,
      data,
      message: "Lấy tổng quan hồ sơ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedPlaces = async (req, res, next) => {
  try {
    const result = await appService.getMySavedPlaces(getUserId(req), req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách địa điểm đã lưu thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const savePlace = async (req, res, next) => {
  try {
    const placeId = parseId(req.params.placeId);
    if (!placeId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID địa điểm không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const data = await appService.savePlace(
      getUserId(req),
      placeId,
      req.body?.note || null,
    );
    res.status(201).json({ success: true, data, message: "Đã lưu địa điểm" });
  } catch (error) {
    next(error);
  }
};

export const unsavePlace = async (req, res, next) => {
  try {
    const placeId = parseId(req.params.placeId);
    if (!placeId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID địa điểm không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    await appService.unsavePlace(getUserId(req), placeId);
    res.json({ success: true, data: null, message: "Đã bỏ lưu địa điểm" });
  } catch (error) {
    next(error);
  }
};

export const getMyTrips = async (req, res, next) => {
  try {
    const result = await appService.getMyTrips(getUserId(req), req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách chuyến đi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const generateTrip = async (req, res, next) => {
  try {
    const trip = await appService.generateAndSaveTrip(
      getUserId(req),
      req.body || {},
    );
    res.status(201).json({
      success: true,
      data: trip,
      message: "Tạo chuyến đi thành công",
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
  getProfileSummary,
  getSavedPlaces,
  savePlace,
  unsavePlace,
  getMyTrips,
  generateTrip,
};
