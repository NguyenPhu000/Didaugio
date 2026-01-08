import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { checkRoleHierarchy } from "../middlewares/checkRoleHierarchy.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";

const router = express.Router();

// User routes
router.get(
  "/users",
  authenticate,
  requirePermission("users.view"),
  userController.getAllUsers
);

router.post(
  "/users",
  authenticate,
  requirePermission("users.create"),
  auditLog({
    action: "CREATE",
    tableName: "users",
    getRecordId: (req, body) => body?.data?.id,
    getNewData: (req) => ({ email: req.body.email, roleId: req.body.roleId }),
  }),
  userController.createUser
);

router.get(
  "/users/:id",
  authenticate,
  requirePermission("users.view"),
  userController.getUserById
);

router.put(
  "/users/:id",
  authenticate,
  requirePermission("users.update"),
  checkRoleHierarchy,
  auditLog({
    action: "UPDATE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => req.body,
  }),
  userController.updateUser
);

router.delete(
  "/users/:id",
  authenticate,
  requirePermission("users.delete"),
  checkRoleHierarchy,
  auditLog({
    action: "DELETE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
  }),
  userController.deleteUser
);

// Route đặc biệt: cập nhật role (chỉ Super Admin và Admin)
router.patch(
  "/users/:id/role",
  authenticate,
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  auditLog({
    action: "UPDATE_ROLE",
    tableName: "users",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ roleId: req.body.roleId }),
  }),
  userController.updateUserRole
);

export default router;
