import * as passwordResetService from "../services/passwordResetService.js";
import {
  passwordResetQuerySchema,
  createPasswordResetSchema,
  resetPasswordSchema,
} from "../models/schemas/activitySchema.js";

/**
 * GET /api/password-resets
 * Lấy danh sách password resets với filters và pagination
 */
export const getAll = async (req, res, next) => {
  try {
    const validation = passwordResetQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const result = await passwordResetService.getAll(validation.data);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/password-resets
 * Tạo yêu cầu reset password
 */
export const create = async (req, res, next) => {
  try {
    const validation = createPasswordResetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const reset = await passwordResetService.create(
      validation.data.email,
      ipAddress
    );

    res.json({
      success: true,
      message: "Nếu email tồn tại, link reset mật khẩu đã được gửi",
      data: reset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/password-resets/reset
 * Reset password bằng token
 */
export const reset = async (req, res, next) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const result = await passwordResetService.reset(
      validation.data.token,
      validation.data.newPassword
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
