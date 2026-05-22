import profileService from "../../services/profile/profile.service.js";
import appService from "../../services/app/app.service.js";
import * as bookingService from "../../services/booking/booking.service.js";
import { ERROR_CODES } from "../../config/messages.js";
import prisma from "../../config/prismaClient.js";

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
      req.body?.collectionName,
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

export const getSavedTrips = async (req, res, next) => {
  try {
    const data = await appService.getMySavedTrips(getUserId(req));
    res.json({
      success: true,
      data,
      message: "Lấy danh sách chuyến đi đã lưu thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const saveTrip = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID chuyến đi không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const data = await appService.saveTrip(getUserId(req), tripId);
    res.status(201).json({ success: true, data, message: "Đã lưu chuyến đi" });
  } catch (error) {
    next(error);
  }
};

export const unsaveTrip = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.tripId);
    if (!tripId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID chuyến đi không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    await appService.unsaveTrip(getUserId(req), tripId);
    res.json({ success: true, data: null, message: "Đã bỏ lưu chuyến đi" });
  } catch (error) {
    next(error);
  }
};

export const getSavedCollections = async (req, res, next) => {
  try {
    const data = await appService.getMySavedCollections(getUserId(req));
    res.json({
      success: true,
      data,
      message: "Lấy danh sách bộ sưu tập đã lưu thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const renameSavedCollection = async (req, res, next) => {
  try {
    const data = await appService.renameMySavedCollection(
      getUserId(req),
      req.params.name,
      req.body?.name,
    );
    res.json({
      success: true,
      data,
      message: "Đã đổi tên bộ sưu tập",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedCollection = async (req, res, next) => {
  try {
    const data = await appService.deleteMySavedCollection(
      getUserId(req),
      req.params.name,
    );
    res.json({
      success: true,
      data,
      message: "Đã xóa bộ sưu tập",
    });
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

export const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getMyBookings(
      getUserId(req),
      req.query,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách booking của tôi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookingDetail = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID booking không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const booking = await bookingService.getMyBookingDetail(id, getUserId(req));
    res.json({
      success: true,
      data: booking,
      message: "Lấy chi tiết booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookingQR = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID booking không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const qr = await bookingService.getMyBookingQR(id, getUserId(req));
    res.json({
      success: true,
      data: qr,
      message: "Lấy mã QR booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const linkMyBookingToTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID booking không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const booking = await bookingService.linkMyBookingToTrip(
      id,
      getUserId(req),
      req.body || {},
    );

    res.json({
      success: true,
      data: booking,
      message: "Liên kết booking vào trip thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const generateTrip = async (req, res, next) => {
  try {
    const result = await appService.generateAndSaveTrip(
      getUserId(req),
      req.body || {},
    );
    const isPreview = result?.previewOnly === true;

    res.status(isPreview ? 200 : 201).json({
      success: true,
      data: result,
      message: isPreview
        ? "Đã gợi ý địa điểm, hãy chọn và chốt trước khi tạo chuyến đi"
        : "Tạo chuyến đi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req, res, next) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      totalDays,
      travelStyle,
      groupSize,
    } = req.body;
    const trip = await appService.createTrip(getUserId(req), {
      title,
      description,
      startDate,
      endDate,
      totalDays,
      travelStyle,
      groupSize,
    });
    res
      .status(201)
      .json({ success: true, data: trip, message: "Tạo chuyến đi thành công" });
  } catch (error) {
    next(error);
  }
};

export const getTripDetail = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID không hợp lệ" });
    const trip = await appService.getTripDetail(id, getUserId(req));
    if (!trip)
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy chuyến đi",
      });
    res.json({
      success: true,
      data: trip,
      message: "Lấy chi tiết chuyến đi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID không hợp lệ" });
    const trip = await appService.updateTrip(id, getUserId(req), req.body);
    res.json({
      success: true,
      data: trip,
      message: "Cập nhật chuyến đi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID không hợp lệ" });
    await appService.deleteTrip(id, getUserId(req));
    res.json({
      success: true,
      data: null,
      message: "Xóa chuyến đi thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const addDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    if (!tripId)
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID không hợp lệ" });
    const { placeId, dayNumber = 1, order = 0, note } = req.body;
    const dest = await appService.addDestination(tripId, getUserId(req), {
      placeId,
      dayNumber,
      order,
      note,
    });
    res.status(201).json({
      success: true,
      data: dest,
      message: "Đã thêm địa điểm vào lịch trình",
    });
  } catch (error) {
    next(error);
  }
};

export const removeDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId)
      return res
        .status(400)
        .json({ success: false, data: null, message: "ID không hợp lệ" });
    await appService.removeDestination(tripId, destId, getUserId(req));
    res.json({
      success: true,
      data: null,
      message: "Đã xóa địa điểm khỏi lịch trình",
    });
  } catch (error) {
    next(error);
  }
};

export const reorderDestinations = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    if (!tripId)
      return res.status(400).json({ success: false, data: null, message: "ID khong hop le", errorCode: ERROR_CODES.VALIDATION_ERROR });
    const { dayNumber, orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0)
      return res.status(400).json({ success: false, data: null, message: "Danh sach sap xep khong hop le", errorCode: ERROR_CODES.VALIDATION_ERROR });
    const destinations = await appService.reorderDestinations(tripId, getUserId(req), { dayNumber, orderedIds });
    res.json({ success: true, data: destinations, message: "Da cap nhat thu tu lich trinh" });
  } catch (error) {
    next(error);
  }
};

export const updateDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId)
      return res.status(400).json({ success: false, data: null, message: "ID khong hop le", errorCode: ERROR_CODES.VALIDATION_ERROR });
    const dest = await appService.updateDestination(tripId, destId, getUserId(req), req.body);
    res.json({ success: true, data: dest, message: "Da cap nhat dia diem" });
  } catch (error) {
    next(error);
  }
};

export const moveDestination = async (req, res, next) => {
  try {
    const tripId = parseId(req.params.id);
    const destId = parseId(req.params.destId);
    if (!tripId || !destId)
      return res.status(400).json({ success: false, data: null, message: "ID khong hop le", errorCode: ERROR_CODES.VALIDATION_ERROR });
    const { newDayNumber, newOrder } = req.body;
    const dest = await appService.moveDestination(tripId, destId, getUserId(req), { newDayNumber, newOrder });
    res.json({ success: true, data: dest, message: "Da chuyen dia diem sang ngay khac" });
  } catch (error) {
    next(error);
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "pushToken là bắt buộc",
        errorCode: "MISSING_PUSH_TOKEN",
      });
    }

    await prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { pushToken },
    });

    res.json({
      success: true,
      data: null,
      message: "Cập nhật push token thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Không thể cập nhật push token",
      error: error.message,
    });
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
  getSavedTrips,
  saveTrip,
  unsaveTrip,
  getSavedCollections,
  renameSavedCollection,
  deleteSavedCollection,
  getMyTrips,
  getMyBookings,
  getMyBookingDetail,
  getMyBookingQR,
  linkMyBookingToTrip,
  generateTrip,
  createTrip,
  getTripDetail,
  updateTrip,
  deleteTrip,
  addDestination,
  removeDestination,
  reorderDestinations,
  updateDestination,
  moveDestination,
  updatePushToken,
};
