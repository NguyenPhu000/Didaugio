import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { checkRoleHierarchy } from "../middlewares/checkRoleHierarchy.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST role from all user management routes
router.use(authenticate, blockGuestFromAdmin);

// User routes
router.get(
  "/users",
  requirePermission("users.view"),
  userController.getAllUsers,
);

router.post(
  "/users",
  requirePermission("users.create"),
  auditLog({
    action: "CREATE",
    tableName: "users",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ email: req.body.email, roleId: req.body.roleId }),
  }),
  userController.createUser,
);

router.get(
  "/users/:id",
  requirePermission("users.view"),
  userController.getUserById,
);

router.put(
  "/users/:id",
  requirePermission("users.edit"),
  checkRoleHierarchy,
  auditLog({
    action: "UPDATE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  userController.updateUser,
);

router.delete(
  "/users/:id",
  requirePermission("users.delete"),
  checkRoleHierarchy,
  auditLog({
    action: "DELETE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  userController.deleteUser,
);

// Route đặc biệt: cập nhật role (chỉ Super Admin và Admin)
router.patch(
  "/users/:id/role",
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  auditLog({
    action: "UPDATE_ROLE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ roleId: req.body.roleId }),
  }),
  userController.updateUserRole,
);

export default router;
