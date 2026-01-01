import * as loginHistoryService from "../services/loginHistoryService.js";
import {
  loginHistoryQuerySchema,
  revokeSessionSchema,
} from "../models/schemas/activitySchema.js";

/**
 * GET /api/login-history
 * Lấy danh sách login history (user sessions) với filters và pagination
 */
export const getAll = async (req, res, next) => {
  try {
    const validation = loginHistoryQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const result = await loginHistoryService.getAll(validation.data);

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
 * GET /api/login-history/:id
 * Lấy chi tiết một login session
 */
export const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Session ID không hợp lệ",
      });
    }

    const session = await loginHistoryService.getById(id);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/login-history/revoke
 * Revoke (vô hiệu hóa) một session
 */
export const revoke = async (req, res, next) => {
  try {
    const validation = revokeSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const session = await loginHistoryService.revoke(validation.data.sessionId);

    res.json({
      success: true,
      message: "Đã vô hiệu hóa session",
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/login-history/revoke-all/:userId
 * Revoke tất cả sessions của user (trừ current)
 */
export const revokeAll = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "User ID không hợp lệ",
      });
    }

    // Get current refresh token from request (nếu có)
    const currentRefreshToken = req.body.currentRefreshToken || null;

    const result = await loginHistoryService.revokeAllExcept(
      userId,
      currentRefreshToken
    );

    res.json({
      success: true,
      message: `Đã vô hiệu hóa ${result.count} sessions`,
    });
  } catch (error) {
    next(error);
  }
};
