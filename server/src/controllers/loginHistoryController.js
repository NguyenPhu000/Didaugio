import * as loginHistoryService from "../services/loginHistoryService.js";
import { ERROR_CODES } from "../config/messages.js";
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
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const currentUserId = req.user?.userId;
    const roleId = req.user?.roleId;
    const queryData = { ...validation.data };

    // Nếu không phải admin (roleId <= 2), chỉ cho xem sessions của chính mình
    if (roleId > 2) {
      queryData.userId = currentUserId;
    }

    const result = await loginHistoryService.getAll(queryData);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách lịch sử đăng nhập thành công",
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
        data: null,
        message: "Session ID không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const session = await loginHistoryService.getById(id);

    const currentUserId = req.user?.userId;
    const roleId = req.user?.roleId;

    // Nếu không phải admin (roleId <= 2) và session không thuộc user hiện tại
    if (roleId > 2 && session.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Bạn không có quyền xem session này",
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    res.json({
      success: true,
      data: session,
      message: "Lấy chi tiết phiên đăng nhập thành công",
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
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const currentUserId = req.user?.userId;
    const roleId = req.user?.roleId;

    // Lấy session để kiểm tra ownership
    const sessionToRevoke = await loginHistoryService.getById(
      validation.data.sessionId,
    );

    // Nếu không phải admin (roleId <= 2) và session không thuộc user hiện tại
    if (roleId > 2 && sessionToRevoke.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Bạn không có quyền vô hiệu hóa session này",
        errorCode: ERROR_CODES.FORBIDDEN,
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
        data: null,
        message: "User ID không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    // Kiểm tra quyền: user chỉ được revoke sessions của chính mình hoặc admin
    const currentUserId = req.user?.userId;
    const roleId = req.user?.roleId;

    // Nếu không phải admin (roleId <= 2) và không phải user đang thao tác với chính mình
    if (roleId > 2 && userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Bạn không có quyền thực hiện thao tác này",
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    // Get current session ID from request (nếu có)
    const currentSessionId = req.body.currentSessionId
      ? parseInt(req.body.currentSessionId)
      : null;

    const result = await loginHistoryService.revokeAllExcept(
      userId,
      currentSessionId,
    );

    res.json({
      success: true,
      message: `Đã vô hiệu hóa ${result.count} sessions`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
