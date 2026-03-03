import { ROLE_HIERARCHY, ROLES } from "../config/constants.js";
import prisma from "../config/prismaClient.js";

export const checkRoleHierarchy = async (req, res, next) => {
  try {
    const currentUserRoleId = req.user.roleId;

    if (currentUserRoleId === ROLES.SUPER_ADMIN) {
      return next();
    }

    const targetUserId = req.params.id || req.params.userId || req.body.userId;

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

    if (targetUser.id === req.user.id && req.body.roleId) {
      return res.status(403).json({
        success: false,
        message: "Không thể thay đổi vai trò của chính mình",
      });
    }

    const currentRole = ROLE_HIERARCHY[currentUserRoleId];
    const targetRoleId = targetUser.roleId;

    if (!currentRole.canManage.includes(targetRoleId)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền quản lý ${ROLE_HIERARCHY[targetRoleId].name}`,
      });
    }

    if (req.body.roleId) {
      const newRoleId = Number(req.body.roleId);

      if (!currentRole.canManage.includes(newRoleId)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền gán vai trò này",
        });
      }
    }

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
