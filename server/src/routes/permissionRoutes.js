import express from "express";
import * as permissionController from "../controllers/permissionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";

const router = express.Router();

// =============================================================================
// PERMISSION ROUTES - API ENDPOINTS
// =============================================================================

/**
 * [GET] /api/permissions - Lấy danh sách permissions
 * Query: page, limit, module, search, includeRoles
 * Permission: roles.view (vì xem permissions liên quan đến quản lý roles)
 */
router.get(
  "/",
  authMiddleware,
  requirePermission("roles.view"),
  permissionController.getPermissions
);

/**
 * [GET] /api/permissions/by-module - Lấy permissions grouped by module
 * Query: includeRoles
 * Permission: roles.view
 */
router.get(
  "/by-module",
  authMiddleware,
  requirePermission("roles.view"),
  permissionController.getPermissionsByModule
);

/**
 * [GET] /api/permissions/modules - Lấy danh sách modules
 * Permission: roles.view
 */
router.get(
  "/modules",
  authMiddleware,
  requirePermission("roles.view"),
  permissionController.getModules
);

export default router;
