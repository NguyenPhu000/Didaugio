import express from "express";
import * as userPermissionController from "../controllers/userPermissionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { checkRoleHierarchy } from "../middlewares/checkRoleHierarchy.js";

const router = express.Router();

// Lấy danh sách users trong role
router.get(
  "/roles/:roleId/users",
  authenticate,
  requirePermission("users.view"),
  userPermissionController.getUsersByRole
);

// Lấy quyền của user
router.get(
  "/users/:userId/permissions",
  authenticate,
  requirePermission("users.view"),
  userPermissionController.getUserPermissions
);

// Cập nhật quyền custom cho user
router.put(
  "/users/:userId/permissions",
  authenticate,
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  userPermissionController.updateUserCustomPermissions
);

// Cập nhật quyền cho nhiều users
router.post(
  "/users/permissions/bulk",
  authenticate,
  requirePermission("roles.assign_to_users"),
  userPermissionController.bulkUpdateUserPermissions
);

// Xóa quyền custom của user
router.delete(
  "/users/:userId/permissions",
  authenticate,
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  userPermissionController.removeUserCustomPermissions
);

export default router;
