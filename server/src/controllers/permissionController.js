import * as permissionService from "../services/permissionService.js";

// =============================================================================
// PERMISSION CONTROLLER - HTTP HANDLERS
// =============================================================================

/**
 * [GET] /api/permissions - Lấy danh sách permissions
 * Query: page, limit, module, search, includeRoles
 */
export const getPermissions = async (req, res) => {
  try {
    const result = await permissionService.getPermissions(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy danh sách quyền",
      errorCode: "GET_PERMISSIONS_ERROR",
    });
  }
};

/**
 * [GET] /api/permissions/by-module - Lấy permissions grouped by module
 * Query: includeRoles
 */
export const getPermissionsByModule = async (req, res) => {
  try {
    const result = await permissionService.getPermissionsByModule(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy danh sách quyền",
      errorCode: "GET_PERMISSIONS_ERROR",
    });
  }
};

/**
 * [GET] /api/permissions/modules - Lấy danh sách modules
 */
export const getModules = async (req, res) => {
  try {
    const result = await permissionService.getModules();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy danh sách modules",
      errorCode: "GET_MODULES_ERROR",
    });
  }
};
