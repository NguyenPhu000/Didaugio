import { ROLE_HIERARCHY } from "../config/constants.js";
import prisma from "../config/prismaClient.js";

/**
 * Middleware kiểm tra quyền quản lý user theo hierarchy
 * Super Admin: quản lý tất cả trừ Super Admin khác
 * Admin: quản lý Business, Staff, Guest
 * Business/Staff: không được quản lý ai
 */
export const checkRoleHierarchy = async (req, res, next) => {
  try {
    const currentUserRoleId = req.user.roleId;
    const targetUserId = req.params.id || req.params.userId || req.body.userId;

    // Nếu không có target user (vd: create user mới)
    if (!targetUserId && req.body.roleId) {
      const targetRoleId = Number(req.body.roleId);
      const currentRole = ROLE_HIERARCHY[currentUserRoleId];

      if (!currentRole.canManage.includes(targetRoleId)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền gán vai trò này",
        });
      }

      return next();
    }

    // Lấy thông tin target user
    const targetUser = await prisma.user.findUnique({
      where: { id: Number(targetUserId) },
      select: { id: true, roleId: true, email: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Không được sửa chính mình (trừ profile)
    if (targetUser.id === req.user.id && req.body.roleId) {
      return res.status(403).json({
        success: false,
        message: "Không thể thay đổi vai trò của chính mình",
      });
    }

    const currentRole = ROLE_HIERARCHY[currentUserRoleId];
    const targetRoleId = targetUser.roleId;

    // Kiểm tra có quyền quản lý target user không
    if (!currentRole.canManage.includes(targetRoleId)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền quản lý ${ROLE_HIERARCHY[targetRoleId].name}`,
      });
    }

    // Nếu đang update roleId, kiểm tra roleId mới
    if (req.body.roleId) {
      const newRoleId = Number(req.body.roleId);

      if (!currentRole.canManage.includes(newRoleId)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền gán vai trò này",
        });
      }
    }

    // Lưu target user vào req để dùng sau
    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error("Error in checkRoleHierarchy:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra phân quyền",
    });
  }
};
