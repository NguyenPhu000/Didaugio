import express from "express";
import * as permissionController from "../controllers/permissionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";
import { validateQuery } from "../middlewares/validateSchema.js";
import {
  permissionByModuleQuerySchemaRoute,
  permissionListQuerySchemaRoute,
} from "../models/schemas/permissionRouteSchema.js";

const router = express.Router();

// 🔒 SECURITY: Block GUEST role from all permission routes
router.use(authenticate, blockGuestFromAdmin);

/**
 * [GET] /api/permissions - Lấy danh sách permissions
 * Query: page, limit, module, search, includeRoles
 * Permission: roles.view_detail (hoặc roles.manage_permissions)
 */
router.get(
  "/",
  validateQuery(permissionListQuerySchemaRoute),
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
  validateQuery(permissionByModuleQuerySchemaRoute),
  requirePermission(["roles.view_detail", "roles.manage_permissions"]),
  permissionController.getPermissionsByModule,
);

/**
 * [GET] /api/permissions/modules - Lấy danh sách modules
 * Permission: roles.view_detail
 */
router.get(
  "/modules",
  requirePermission("roles.view_detail"),
  permissionController.getModules,
);

export default router;
