import express from "express";
import * as userPermissionController from "../../controllers/rbac/userPermission.controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { requirePermission } from "../../middlewares/permissionMiddleware.js";
import { checkRoleHierarchy } from "../../middlewares/checkRoleHierarchy.js";
import { blockGuestFromAdmin } from "../../middlewares/blockGuestFromAdmin.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validateSchema.js";
import {
  bulkUpdateUserPermissionsSchema,
  updateUserCustomPermissionsSchema,
  userPermissionRoleIdParamSchema,
  userPermissionRoleUsersQuerySchema,
  userPermissionUserIdParamSchema,
} from "../../models/index.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST from user permission management
router.use(authenticate, blockGuestFromAdmin);

// Lấy danh sách users trong role
router.get(
  "/roles/:roleId/users",
  validateParams(userPermissionRoleIdParamSchema),
  validateQuery(userPermissionRoleUsersQuerySchema),
  requirePermission("users.view"),
  userPermissionController.getUsersByRole,
);

// Lấy quyền của user
router.get(
  "/users/:userId/permissions",
  validateParams(userPermissionUserIdParamSchema),
  requirePermission("users.view"),
  userPermissionController.getUserPermissions,
);

// Cập nhật quyền custom cho user
router.put(
  "/users/:userId/permissions",
  validateParams(userPermissionUserIdParamSchema),
  validateBody(updateUserCustomPermissionsSchema),
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  userPermissionController.updateUserCustomPermissions,
);

// Cập nhật quyền cho nhiều users
router.post(
  "/users/permissions/bulk",
  validateBody(bulkUpdateUserPermissionsSchema),
  requirePermission("roles.assign_to_users"),
  userPermissionController.bulkUpdateUserPermissions,
);

// Xóa quyền custom của user
router.delete(
  "/users/:userId/permissions",
  validateParams(userPermissionUserIdParamSchema),
  requirePermission("roles.assign_to_users"),
  checkRoleHierarchy,
  userPermissionController.removeUserCustomPermissions,
);

export default router;
