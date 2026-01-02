import * as roleService from "../services/roleService.js";

// =============================================================================
// ROLE CONTROLLER - HTTP HANDLERS
// =============================================================================

/**
 * [GET] /api/roles - Lấy danh sách vai trò
 * Query: page, limit, search, includePermissions, includeUserCount
 */
export const getRoles = async (req, res) => {
  try {
    const result = await roleService.getRoles(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy danh sách vai trò",
      errorCode: "GET_ROLES_ERROR",
    });
  }
};

/**
 * [GET] /api/roles/:id - Lấy chi tiết vai trò
 * Params: id
 */
export const getRoleById = async (req, res) => {
  try {
    const result = await roleService.getRoleById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || "Không tìm thấy vai trò",
      errorCode: "ROLE_NOT_FOUND",
    });
  }
};

/**
 * [GET] /api/roles/:id/permissions - Lấy danh sách quyền của vai trò
 * Params: id
 */
export const getRolePermissions = async (req, res) => {
  try {
    const result = await roleService.getRolePermissions(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || "Không tìm thấy vai trò",
      errorCode: "ROLE_NOT_FOUND",
    });
  }
};

/**
 * [PUT] /api/roles/:id/permissions - Cập nhật quyền cho vai trò
 * Params: id
 * Body: { permissionIds: [1, 2, 3] }
 */
export const updateRolePermissions = async (req, res) => {
  try {
    const result = await roleService.updateRolePermissions(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi cập nhật quyền",
      errorCode: "UPDATE_PERMISSIONS_ERROR",
    });
  }
};

/**
 * [GET] /api/roles/:id/users - Lấy danh sách người dùng theo vai trò
 * Params: id
 * Query: page, limit, status, search
 */
export const getRoleUsers = async (req, res) => {
  try {
    const result = await roleService.getRoleUsers(req.params.id, req.query);
    // Service already returns {success, data, ...}, spread to flatten
    res.status(200).json({ ...result });
  } catch (error) {
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || "Không tìm thấy vai trò",
      errorCode: "ROLE_NOT_FOUND",
    });
  }
};
