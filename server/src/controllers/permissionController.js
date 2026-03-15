import * as permissionService from "../services/permissionService.js";

/**
 * [GET] /api/permissions - Lấy danh sách permissions
 * Query: page, limit, module, search, includeRoles
 */
export const getPermissions = async (req, res, next) => {
  try {
    const result = await permissionService.getPermissions(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      message: "Lấy danh sách quyền thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/permissions/by-module - Lấy permissions grouped by module
 * Query: includeRoles
 */
export const getPermissionsByModule = async (req, res, next) => {
  try {
    const result = await permissionService.getPermissionsByModule(req.query);
    res.status(200).json({
      success: true,
      data: {
        permissions: result.permissions,
        moduleStats: result.moduleStats,
        totalModules: result.totalModules,
        totalPermissions: result.totalPermissions,
      },
      message: "Lấy danh sách quyền theo module thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/permissions/modules - Lấy danh sách modules
 */
export const getModules = async (req, res, next) => {
  try {
    const result = await permissionService.getModules();
    res.status(200).json({
      success: true,
      data: result.data,
      message: "Lấy danh sách module thành công",
    });
  } catch (error) {
    next(error);
  }
};
