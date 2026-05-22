import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { hasPermission } from "../../middlewares/permissionMiddleware.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import * as staffController from "../../controllers/business/businessStaff.controller.js";

const router = Router();

// All staff routes require authentication and active business
router.use(authenticate);
router.use(requireActiveBusiness());

// GET /api/business/staff - List staff
router.get(
  "/",
  hasPermission("staff.view"),
  staffController.getAll,
);

// GET /api/business/staff/:id - Staff detail
router.get(
  "/:id",
  hasPermission("staff.view"),
  staffController.getById,
);

// POST /api/business/staff - Create staff
router.post(
  "/",
  hasPermission("staff.create"),
  auditLog({ action: "CREATE", tableName: "users", description: "Tạo tài khoản nhân viên" }),
  staffController.create,
);

// PUT /api/business/staff/:id - Update staff
router.put(
  "/:id",
  hasPermission("staff.update"),
  auditLog({ action: "UPDATE", tableName: "users", description: "Cập nhật nhân viên" }),
  staffController.update,
);

// POST /api/business/staff/:id/reset-password - Reset password
router.post(
  "/:id/reset-password",
  hasPermission("staff.update"),
  auditLog({ action: "UPDATE", tableName: "users", description: "Đặt lại mật khẩu nhân viên" }),
  staffController.resetPassword,
);

// POST /api/business/staff/:id/deactivate - Deactivate staff
router.post(
  "/:id/deactivate",
  hasPermission("staff.update"),
  auditLog({ action: "UPDATE", tableName: "users", description: "Khóa tài khoản nhân viên" }),
  staffController.deactivate,
);

// POST /api/business/staff/:id/activate - Activate staff
router.post(
  "/:id/activate",
  hasPermission("staff.update"),
  auditLog({ action: "UPDATE", tableName: "users", description: "Mở khóa tài khoản nhân viên" }),
  staffController.activate,
);

export default router;
