import * as eventService from "../../services/event/event.service.js";

// Helper lấy userId từ request
const getUserId = (req) => req.user?.userId || req.user?.id || null;

// 1. POST /api/v1/events - Tạo sự kiện mới
export const createEvent = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const event = await eventService.createEvent(userId, req.body);
    return res.status(201).json({
      success: true,
      data: event,
      message: "Tạo sự kiện thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 2. PUT /api/v1/events/:id - Cập nhật sự kiện
export const updateEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = await eventService.updateEvent(eventId, req.body);
    return res.json({
      success: true,
      data: event,
      message: "Cập nhật sự kiện thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 3. DELETE /api/v1/events/:id - Xóa sự kiện (dọn dẹp ảnh mồ côi)
export const deleteEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    await eventService.deleteEvent(eventId);
    return res.json({
      success: true,
      data: null,
      message: "Xóa sự kiện thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 4. GET /api/v1/events - Lấy danh sách sự kiện (phân trang)
export const getEvents = async (req, res, next) => {
  try {
    const { status, isFeaturedBanner, search, page, limit } = req.query;
    // Admin/Staff có thể xem tất cả events kể cả inactive
    const isAdmin = req.user && req.user.roleId <= 4;
    const result = await eventService.getEvents({
      status,
      isFeaturedBanner,
      search,
      page,
      limit,
      showAll: isAdmin,
    });
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách sự kiện thành công",
    });
  } catch (error) {
    next(error);
  }
};


// 5. GET /api/v1/events/:id - Lấy chi tiết sự kiện (chứa active count từng chặng)
export const getEventById = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = getUserId(req);
    const event = await eventService.getEventById(eventId, userId);
    return res.json({
      success: true,
      data: event,
      message: "Lấy chi tiết sự kiện thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 6. POST /api/v1/events/:id/join - Tham gia sự kiện và clone Trip mẫu
export const joinEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = getUserId(req);
    const result = await eventService.joinEvent(eventId, userId);
    return res.json({
      success: true,
      data: result.clonedTrip,
      message: result.message || "Tham gia sự kiện và tạo lịch trình thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 7. POST /api/v1/events/:id/ping - Ping vị trí neon ẩn danh
export const pingEvent = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = getUserId(req);
    const { placeId } = req.body;
    const session = await eventService.pingEvent(eventId, placeId, userId);
    return res.json({
      success: true,
      data: session,
      message: "Cập nhật vị trí chặng thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 8. POST /api/v1/events/:id/moments - Upload ảnh khoảnh khắc 1:1 check-in
export const createMoment = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = getUserId(req);
    const moment = await eventService.createMoment(eventId, userId, req.body);
    return res.status(201).json({
      success: true,
      data: moment,
      message: "Đăng tải khoảnh khắc thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 9. GET /api/v1/events/:id/moments - Lấy danh sách ảnh khoảnh khắc chặng ẩn danh
export const getMoments = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { placeId, page, limit } = req.query;
    const result = await eventService.getMoments(eventId, parseInt(placeId, 10), { page, limit });
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách khoảnh khắc thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 10. DELETE /api/v1/events/moments/:momentId - Xóa ảnh khoảnh khắc
export const deleteMoment = async (req, res, next) => {
  try {
    const momentId = parseInt(req.params.momentId, 10);
    const userId = getUserId(req);
    const isAdmin = req.user && req.user.roleId <= 4;
    await eventService.deleteMoment(momentId, userId, isAdmin);
    return res.json({
      success: true,
      data: null,
      message: "Xóa khoảnh khắc thành công",
    });
  } catch (error) {
    next(error);
  }
};

// 11. PUT /api/v1/admin/events/:id/broadcast - Thông báo khẩn cấp từ BTC
export const updateBroadcast = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { broadcastNotice } = req.body;
    const event = await eventService.updateBroadcast(eventId, broadcastNotice);
    return res.json({
      success: true,
      data: event,
      message: "Đăng thông báo khẩn cấp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  joinEvent,
  pingEvent,
  createMoment,
  getMoments,
  deleteMoment,
  updateBroadcast,
};
