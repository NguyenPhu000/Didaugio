import { ROLE_HIERARCHY, ROLES } from "../config/constants.js";
import prisma from "../config/prismaClient.js";
import { ERROR_CODES } from "../config/messages.js";

export const checkRoleHierarchy = async (req, res, next) => {
  try {
    const currentUserRoleId = req.user.roleId;

    const targetUserId = req.params.id || req.params.userId || req.body.userId;

    if (currentUserRoleId === ROLES.SUPER_ADMIN) {
      if (targetUserId) {
        const targetUser = await prisma.user.findUnique({
          where: { id: Number(targetUserId) },
          select: { id: true, roleId: true },
        });
        if (targetUser && targetUser.roleId === ROLES.SUPER_ADMIN && targetUser.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            data: null,
            message: "Không thể chỉnh sửa thông tin của Super Admin khác",
            errorCode: ERROR_CODES.FORBIDDEN,
          });
        }
      }
      return next();
    }



    if (!targetUserId && req.body.roleId) {
      const targetRoleId = Number(req.body.roleId);
      const currentRole = ROLE_HIERARCHY[currentUserRoleId];

      if (!currentRole.canManage.includes(targetRoleId)) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền gán vai trò này",
          errorCode: ERROR_CODES.FORBIDDEN,
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
        data: null,
        message: "Không tìm thấy người dùng",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (targetUser.id === req.user.id && req.body.roleId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không thể thay đổi vai trò của chính mình",
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    const currentRole = ROLE_HIERARCHY[currentUserRoleId];
    const targetRoleId = targetUser.roleId;

    if (!currentRole.canManage.includes(targetRoleId)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: `Bạn không có quyền quản lý ${ROLE_HIERARCHY[targetRoleId].name}`,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    if (req.body.roleId) {
      const newRoleId = Number(req.body.roleId);

      if (!currentRole.canManage.includes(newRoleId)) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền gán vai trò này",
          errorCode: ERROR_CODES.FORBIDDEN,
        });
      }
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error("Error in checkRoleHierarchy:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Lỗi khi kiểm tra phân quyền",
      errorCode: ERROR_CODES.SERVER_ERROR,
    });
  }
};
