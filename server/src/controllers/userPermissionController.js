import * as userPermissionService from "../services/userPermissionService.js";

/**
 * Lấy danh sách users trong role
 */
export async function getUsersByRole(req, res) {
  try {
    const { roleId } = req.params;
    const { page, limit, search } = req.query;

    const result = await userPermissionService.getUsersByRole(parseInt(roleId), {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
    });

    return res.status(200).json({
      success: true,
      ...result,
      message: "Lấy danh sách users thành công",
    });
  } catch (error) {
    console.error("Error in getUsersByRole:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy danh sách users",
    });
  }
}

/**
 * Lấy quyền của user
 */
export async function getUserPermissions(req, res) {
  try {
    const { userId } = req.params;

    const result = await userPermissionService.getUserPermissions(parseInt(userId));

    return res.status(200).json({
      success: true,
      ...result,
      message: "Lấy quyền user thành công",
    });
  } catch (error) {
    console.error("Error in getUserPermissions:", error);
    return res.status(404).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi lấy quyền user",
    });
  }
}

/**
 * Cập nhật quyền custom cho user
 */
export async function updateUserCustomPermissions(req, res) {
  try {
    const { userId } = req.params;
    const { permissionIds } = req.body;
    const grantedById = req.user.id;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "permissionIds phải là mảng",
      });
    }

    const result = await userPermissionService.updateUserCustomPermissions(
      parseInt(userId),
      permissionIds,
      grantedById
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Cập nhật quyền user thành công",
    });
  } catch (error) {
    console.error("Error in updateUserCustomPermissions:", error);
    return res.status(403).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi cập nhật quyền user",
    });
  }
}

/**
 * Cập nhật quyền cho nhiều users
 */
export async function bulkUpdateUserPermissions(req, res) {
  try {
    const { userIds, permissionIds } = req.body;
    const grantedById = req.user.id;

    if (!Array.isArray(userIds) || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "userIds và permissionIds phải là mảng",
      });
    }

    const result = await userPermissionService.bulkUpdateUserPermissions(
      userIds,
      permissionIds,
      grantedById
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: `Cập nhật quyền cho ${result.updated} users thành công`,
    });
  } catch (error) {
    console.error("Error in bulkUpdateUserPermissions:", error);
    return res.status(403).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi cập nhật quyền users",
    });
  }
}

/**
 * Xóa quyền custom của user
 */
export async function removeUserCustomPermissions(req, res) {
  try {
    const { userId } = req.params;
    const grantedById = req.user.id;

    const result = await userPermissionService.removeUserCustomPermissions(
      parseInt(userId),
      grantedById
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: "Xóa quyền custom thành công",
    });
  } catch (error) {
    console.error("Error in removeUserCustomPermissions:", error);
    return res.status(403).json({
      success: false,
      data: null,
      message: error.message || "Lỗi khi xóa quyền user",
    });
  }
}
