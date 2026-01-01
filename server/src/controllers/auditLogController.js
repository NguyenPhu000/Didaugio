import * as auditLogService from "../services/auditLogService.js";
import { auditLogQuerySchema } from "../models/schemas/activitySchema.js";

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
        message: "Dữ liệu không hợp lệ",
        errors: validation.error.errors,
      });
    }

    const result = await auditLogService.getAll(validation.data);

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
 * GET /api/audit-logs/:id
 * Lấy chi tiết một audit log
 */
export const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const log = await auditLogService.getById(id);

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};
