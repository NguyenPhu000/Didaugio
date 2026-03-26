import express from "express";
import * as roleController from "../controllers/roleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { auditLog } from "../middlewares/auditLogMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validateSchema.js";
import {
  roleIdParamSchema,
  roleListQuerySchema,
  roleUpdatePermissionsBodySchema,
  roleUsersQuerySchemaRoute,
} from "../models/index.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST role from all role management routes
router.use(authenticate, blockGuestFromAdmin);

/**
 * [GET] /api/roles - Lấy danh sách vai trò
 * Query: page, limit, search, includePermissions, includeUserCount
 * Permission: roles.view
 */
router.get(
  "/",
  validateQuery(roleListQuerySchema),
  requirePermission("roles.view"),
  roleController.getRoles,
);

/**
 * [GET] /api/roles/:id - Lấy chi tiết vai trò
 * Params: id
 * Permission: roles.view_detail
 */
router.get(
  "/:id",
  validateParams(roleIdParamSchema),
  requirePermission("roles.view_detail"),
  roleController.getRoleById,
);

/**
 * [GET] /api/roles/:id/permissions - Lấy danh sách quyền của vai trò
 * Params: id
 * Permission: roles.view_detail
 */
router.get(
  "/:id/permissions",
  validateParams(roleIdParamSchema),
  requirePermission("roles.view_detail"),
  roleController.getRolePermissions,
);

/**
 * [PUT] /api/roles/:id/permissions - Cập nhật quyền cho vai trò
 * Params: id
 * Body: { permissionIds: [1, 2, 3] }
 * Permission: roles.manage_permissions (chỉ SUPER_ADMIN)
 */
router.put(
  "/:id/permissions",
  validateParams(roleIdParamSchema),
  validateBody(roleUpdatePermissionsBodySchema),
  requirePermission("roles.manage_permissions"),
  auditLog({
    action: "UPDATE_PERMISSIONS",
    tableName: "role_permissions",
    getRecordId: (req) => parseInt(req.params.id),
    getNewData: (req) => ({ permissionIds: req.body.permissionIds }),
  }),
  roleController.updateRolePermissions,
);

/**
 * [GET] /api/roles/:id/users - Lấy danh sách người dùng theo vai trò
 * Params: id
 * Query: page, limit, status, search
 * Permission: roles.view_users
 */
router.get(
  "/:id/users",
  validateParams(roleIdParamSchema),
  validateQuery(roleUsersQuerySchemaRoute),
  requirePermission("roles.view_users"),
  roleController.getRoleUsers,
);

export default router;
