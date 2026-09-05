import { Router } from "express";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requireActiveBusiness } from "../../middlewares/requireActiveBusiness.js";
import { requireBusinessOwner } from "../../middlewares/requireBusinessOwner.js";
import { auditLog } from "../../middlewares/auditLogMiddleware.js";
import * as staffController from "../../controllers/business/businessStaff.controller.js";

const router = Router();

// All staff routes require authentication and active business
router.use(authenticate);
router.use(requireBusinessOwner);
router.use(requireActiveBusiness());

// GET /api/business/staff - List staff
router.get("/", staffController.getAll);

// GET /api/business/staff/stats - Staff stats
router.get("/stats", staffController.getStats);

// GET /api/business/staff/:id - Staff detail
router.get("/:id", staffController.getById);

// POST /api/business/staff - Create staff
router.post(
  "/",
  auditLog({ action: "CREATE", tableName: "users", description: "Tạo tài khoản nhân viên" }),
  staffController.create,
);

// PUT /api/business/staff/:id - Update staff
router.put(
  "/:id",
  auditLog({ action: "UPDATE", tableName: "users", description: "Cập nhật nhân viên" }),
  staffController.update,
);

// POST /api/business/staff/:id/reset-password - Reset password
router.post(
  "/:id/reset-password",
  auditLog({ action: "UPDATE", tableName: "users", description: "Đặt lại mật khẩu nhân viên" }),
  staffController.resetPassword,
);

// POST /api/business/staff/:id/deactivate - Deactivate staff
router.post(
  "/:id/deactivate",
  auditLog({ action: "UPDATE", tableName: "users", description: "Khóa tài khoản nhân viên" }),
  staffController.deactivate,
);

// POST /api/business/staff/:id/activate - Activate staff
router.post(
  "/:id/activate",
  auditLog({ action: "UPDATE", tableName: "users", description: "Mở khóa tài khoản nhân viên" }),
  staffController.activate,
);

export default router;
