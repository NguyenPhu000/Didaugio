import express from "express";
import * as roleController from "../controllers/roleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

// =============================================================================
// ROLE ROUTES - API ENDPOINTS
// =============================================================================

/**
 * [GET] /api/roles - Lấy danh sách vai trò
 * Query: page, limit, search, includePermissions, includeUserCount
 * Permission: roles.view
 */
router.get(
  "/",
  authMiddleware,
  requirePermission("roles.view"),
  roleController.getRoles
);

/**
 * [GET] /api/roles/:id - Lấy chi tiết vai trò
 * Params: id
 * Permission: roles.view_detail
 */
router.get(
  "/:id",
  authMiddleware,
  requirePermission("roles.view_detail"),
  roleController.getRoleById
);

/**
 * [GET] /api/roles/:id/permissions - Lấy danh sách quyền của vai trò
 * Params: id
 * Permission: roles.view_detail
 */
router.get(
  "/:id/permissions",
  authMiddleware,
  requirePermission("roles.view_detail"),
  roleController.getRolePermissions
);

/**
 * [PUT] /api/roles/:id/permissions - Cập nhật quyền cho vai trò
 * Params: id
 * Body: { permissionIds: [1, 2, 3] }
 * Permission: roles.manage_permissions (chỉ SUPER_ADMIN)
 */
router.put(
  "/:id/permissions",
  authMiddleware,
  requirePermission("roles.manage_permissions"),
  roleController.updateRolePermissions
);

/**
 * [GET] /api/roles/:id/users - Lấy danh sách người dùng theo vai trò
 * Params: id
 * Query: page, limit, status, search
 * Permission: roles.view_users
 */
router.get(
  "/:id/users",
  authMiddleware,
  requirePermission("roles.view_users"),
  roleController.getRoleUsers
);

export default router;
