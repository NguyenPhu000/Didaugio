import * as auditLogService from "../../services/activity/auditLog.service.js";
import { auditLogQuerySchema } from "../../models/index.js";
import { ERROR_CODES } from "../../config/messages.js";

/**
 * GET /api/audit-logs
 * Lấy danh sách audit logs với filters và pagination
 */
export const getAll = async (req, res, next) => {
  try {
    const validation = auditLogQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const result = await auditLogService.getAll(validation.data);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách nhật ký hệ thống thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/audit-logs/:id
 * Lấy chi tiết một audit log
 */
export const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "ID không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const log = await auditLogService.getById(id);

    res.json({
      success: true,
      data: log,
      message: "Lấy chi tiết nhật ký hệ thống thành công",
    });
  } catch (error) {
    next(error);
  }
};
