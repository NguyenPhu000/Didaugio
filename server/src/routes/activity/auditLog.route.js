import express from "express";
import * as auditLogController from "../../controllers/activity/auditLog.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../../middlewares/blockGuestFromAdmin.js";
import { validateParams } from "../../middlewares/validateSchema.js";
import { idSchema } from "../../models/index.js";
import { z } from "zod";

const router = express.Router();

// ECURITY: Block GUEST role from audit logs
router.use(authenticate, blockGuestFromAdmin);

/**
 * @route   GET /api/audit-logs
 * @desc    Lấy danh sách audit logs
 * @access  Private (Admin - cần quyền audit_log.view)
 */
router.get("/", hasPermission("audit_log.view"), auditLogController.getAll);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Lấy chi tiết một audit log
 * @access  Private (Admin - cần quyền audit_log.view)
 */
router.get(
  "/:id",
  hasPermission("audit_log.view"),
  validateParams(z.object({ id: idSchema })),
  auditLogController.getById,
);

export default router;
