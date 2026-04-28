import * as roleService from "../../services/rbac/role.service.js";

/**
 * [GET] /api/roles - Lấy danh sách vai trò
 * Query: page, limit, search, includePermissions, includeUserCount
 */
export const getRoles = async (req, res, next) => {
  try {
    const result = await roleService.getRoles(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách vai trò thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/roles/:id - Lấy chi tiết vai trò
 * Params: id
 */
export const getRoleById = async (req, res, next) => {
  try {
    const result = await roleService.getRoleById(req.params.id);
    res.status(200).json({
      success: true,
      data: result.data,
      message: "Lấy chi tiết vai trò thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/roles/:id/permissions - Lấy danh sách quyền của vai trò
 * Params: id
 */
export const getRolePermissions = async (req, res, next) => {
  try {
    const result = await roleService.getRolePermissions(req.params.id);
    res.status(200).json({
      success: true,
      data: result.data,
      message: "Lấy quyền của vai trò thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [PUT] /api/roles/:id/permissions - Cập nhật quyền cho vai trò
 * Params: id
 * Body: { permissionIds: [1, 2, 3] }
 */
export const updateRolePermissions = async (req, res, next) => {
  try {
    const result = await roleService.updateRolePermissions(
      req.params.id,
      req.body,
    );
    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message || "Cập nhật quyền vai trò thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * [GET] /api/roles/:id/users - Lấy danh sách người dùng theo vai trò
 * Params: id
 * Query: page, limit, status, search
 */
export const getRoleUsers = async (req, res, next) => {
  try {
    const result = await roleService.getRoleUsers(req.params.id, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách người dùng theo vai trò thành công",
    });
  } catch (error) {
    next(error);
  }
};
