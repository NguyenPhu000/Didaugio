import * as staffService from "../../services/business/businessStaff.service.js";

/**
 * GET /api/business/staff
 * List all staff for the current business
 */
export const getAll = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const result = await staffService.getStaffList(businessId, req.query);
    res.json({ success: true, data: result, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/staff/:id
 * Get staff detail
 */
export const getById = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    const staff = await staffService.getStaffDetail(
      businessId,
      parseInt(req.params.id),
    );
    res.json({ success: true, data: staff, message: "OK" });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff
 * Create a new staff account
 */
export const create = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const staff = await staffService.createStaff(businessId, req.body);
    res.status(201).json({
      success: true,
      data: staff,
      message: "Tạo tài khoản nhân viên thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/business/staff/:id
 * Update staff info
 */
export const update = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    const staff = await staffService.updateStaff(
      businessId,
      parseInt(req.params.id),
      req.body,
    );
    res.json({
      success: true,
      data: staff,
      message: "Cập nhật nhân viên thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff/:id/reset-password
 * Reset staff password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    await staffService.resetStaffPassword(
      businessId,
      parseInt(req.params.id),
      req.body.newPassword,
    );
    res.json({
      success: true,
      data: null,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff/:id/deactivate
 * Deactivate staff account
 */
export const deactivate = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    await staffService.deactivateStaff(businessId, parseInt(req.params.id));
    res.json({
      success: true,
      data: null,
      message: "Khóa tài khoản nhân viên thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff/:id/activate
 * Activate staff account
 */
export const activate = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    await staffService.activateStaff(businessId, parseInt(req.params.id));
    res.json({
      success: true,
      data: null,
      message: "Mở khóa tài khoản nhân viên thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  resetPassword,
  deactivate,
  activate,
};
