import * as bookingService from "../services/bookingService.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await bookingService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await bookingService.getStats(
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const booking = await bookingService.getById(req.params.id);
    res.json({
      success: true,
      data: booking,
      message: "Lấy chi tiết booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const booking = await bookingService.confirm(
      req.params.id,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Xác nhận booking thành công",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const booking = await bookingService.cancel(
      req.params.id,
      req.body.cancelReason,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Hủy booking thành công",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const complete = async (req, res, next) => {
  try {
    const booking = await bookingService.complete(
      req.params.id,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Hoàn thành booking thành công",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const markNoShow = async (req, res, next) => {
  try {
    const booking = await bookingService.markNoShow(
      req.params.id,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Đánh dấu không đến thành công",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getQR = async (req, res, next) => {
  try {
    const qr = await bookingService.getQR(req.params.id);
    res.json({
      success: true,
      data: qr,
      message: "Lấy mã QR booking thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const bulkConfirm = async (req, res, next) => {
  try {
    const results = await bookingService.bulkConfirm(
      req.body.bookingIds,
      req.user.userId,
    );
    const successCount = results.filter((r) => r.success).length;
    res.json({
      success: true,
      message: `Đã xác nhận ${successCount}/${results.length} booking`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkCancel = async (req, res, next) => {
  try {
    const results = await bookingService.bulkCancel(
      req.body.bookingIds,
      req.body.cancelReason,
      req.user.userId,
    );
    const successCount = results.filter((r) => r.success).length;
    res.json({
      success: true,
      message: `Đã hủy ${successCount}/${results.length} booking`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
