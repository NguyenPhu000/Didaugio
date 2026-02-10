import express from "express";
import * as auditLogController from "../controllers/auditLogController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { hasPermission } from "../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST role from audit logs
router.use(authenticate, blockGuestFromAdmin);

/**
 * @route   GET /api/audit-logs
 * @desc    Lấy danh sách audit logs
 * @access  Private (Admin - cần quyền audit_log.view)
 */
router.get(
  "/",
  authenticate,
  hasPermission("audit_log.view"),
  auditLogController.getAll,
);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Lấy chi tiết một audit log
 * @access  Private (Admin - cần quyền audit_log.view)
 */
router.get(
  "/:id",
  authenticate,
  hasPermission("audit_log.view"),
  auditLogController.getById,
);

export default router;
