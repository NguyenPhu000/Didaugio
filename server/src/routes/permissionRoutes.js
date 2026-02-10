import express from "express";
import * as permissionController from "../controllers/permissionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST role from all permission routes
router.use(authenticate, blockGuestFromAdmin);

// =============================================================================
// PERMISSION ROUTES - API ENDPOINTS
// =============================================================================

/**
 * [GET] /api/permissions - Lấy danh sách permissions
 * Query: page, limit, module, search, includeRoles
 * Permission: roles.view_detail (hoặc roles.manage_permissions)
 */
router.get(
  "/",
  authenticate,
  requirePermission(["roles.view_detail", "roles.manage_permissions"]),
  permissionController.getPermissions,
);

/**
 * [GET] /api/permissions/by-module - Lấy permissions grouped by module
 * Query: includeRoles
 * Permission: roles.view_detail (hoặc roles.manage_permissions)
 */
router.get(
  "/by-module",
  authenticate,
  requirePermission(["roles.view_detail", "roles.manage_permissions"]),
  permissionController.getPermissionsByModule,
);

/**
 * [GET] /api/permissions/modules - Lấy danh sách modules
 * Permission: roles.view_detail
 */
router.get(
  "/modules",
  authenticate,
  requirePermission("roles.view_detail"),
  permissionController.getModules,
);

export default router;
