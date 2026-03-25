import * as passwordResetService from "../services/passwordResetService.js";
import { ERROR_CODES } from "../config/messages.js";
import {
  passwordResetQuerySchema,
  createPasswordResetSchema,
  activityResetPasswordSchema as resetPasswordSchema,
} from "../models/index.js";

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
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const result = await passwordResetService.getAll(validation.data);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách yêu cầu đặt lại mật khẩu thành công",
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
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const reset = await passwordResetService.create(
      validation.data.email,
      ipAddress,
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
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const result = await passwordResetService.reset(
      validation.data.token,
      validation.data.newPassword,
    );

    res.json({
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
