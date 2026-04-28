import * as userPermissionService from "../../services/rbac/userPermission.service.js";
import { ERROR_CODES } from "../../config/messages.js";

const getUserId = (req) => req.user?.userId || req.user?.id || null;

/**
 * Lấy danh sách users trong role
 */
export async function getUsersByRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const { page, limit, search } = req.query;

    const result = await userPermissionService.getUsersByRole(
      parseInt(roleId),
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search,
      },
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Lấy danh sách users thành công",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy quyền của user
 */
export async function getUserPermissions(req, res, next) {
  try {
    const { userId } = req.params;

    const result = await userPermissionService.getUserPermissions(
      parseInt(userId),
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Lấy quyền user thành công",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật quyền custom cho user
 */
export async function updateUserCustomPermissions(req, res, next) {
  try {
    const { userId } = req.params;
    const { permissionIds } = req.body;
    const grantedById = getUserId(req);

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "permissionIds phải là mảng",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await userPermissionService.updateUserCustomPermissions(
      parseInt(userId),
      permissionIds,
      grantedById,
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Cập nhật quyền user thành công",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật quyền cho nhiều users
 */
export async function bulkUpdateUserPermissions(req, res, next) {
  try {
    const { userIds, permissionIds } = req.body;
    const grantedById = getUserId(req);

    if (!Array.isArray(userIds) || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "userIds và permissionIds phải là mảng",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await userPermissionService.bulkUpdateUserPermissions(
      userIds,
      permissionIds,
      grantedById,
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: `Cập nhật quyền cho ${result.updated} users thành công`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa quyền custom của user
 */
export async function removeUserCustomPermissions(req, res, next) {
  try {
    const { userId } = req.params;
    const grantedById = getUserId(req);

    const result = await userPermissionService.removeUserCustomPermissions(
      parseInt(userId),
      grantedById,
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Xóa quyền custom thành công",
    });
  } catch (error) {
    next(error);
  }
}
