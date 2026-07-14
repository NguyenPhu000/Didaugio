import {
  ROLE_HIERARCHY,
  canAssignRoleId,
  canManageRoleId,
  isSuperAdminRole,
} from "../config/constants.js";
import prisma from "../config/prismaClient.js";
import { ERROR_CODES } from "../config/messages.js";

const sendError = (res, status, message, errorCode) =>
  res.status(status).json({ success: false, data: null, message, errorCode });

const getTargetUserId = (req) =>
  req.params.id || req.params.userId || req.body?.userId;

const getTargetUser = (targetUserId, select) =>
  prisma.user.findUnique({
    where: { id: Number(targetUserId) },
    select,
  });

const denyRoleAssignment = (res) =>
  sendError(
    res,
    403,
    "Bạn không có quyền gán vai trò này",
    ERROR_CODES.FORBIDDEN,
  );

const validateNewRole = (currentUserRoleId, roleId, res) => {
  if (!canAssignRoleId(currentUserRoleId, Number(roleId))) {
    denyRoleAssignment(res);
    return false;
  }
  return true;
};

const handleSuperAdmin = async (req, res, next, targetUserId) => {
  if (!targetUserId) return next();

  const targetUser = await getTargetUser(targetUserId, {
    id: true,
    roleId: true,
  });

  if (targetUser && isSuperAdminRole(targetUser.roleId) && targetUser.id !== req.user.id) {
    return sendError(
      res,
      403,
      "Không thể chỉnh sửa thông tin của Super Admin khác",
      ERROR_CODES.FORBIDDEN,
    );
  }

  return next();
};

export const checkRoleHierarchy = async (req, res, next) => {
  try {
    const currentUserRoleId = req.user.roleId;
    const targetUserId = getTargetUserId(req);
    const requestedRoleId = req.body?.roleId;

    if (isSuperAdminRole(currentUserRoleId)) {
      return handleSuperAdmin(req, res, next, targetUserId);
    }

    if (!targetUserId && requestedRoleId) {
      if (!validateNewRole(currentUserRoleId, requestedRoleId, res)) return;
      return next();
    }

    const targetUser = await getTargetUser(targetUserId, {
      id: true,
      roleId: true,
      email: true,
    });

    if (!targetUser) {
      return sendError(
        res,
        404,
        "Không tìm thấy người dùng",
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (targetUser.id === req.user.id && requestedRoleId) {
      return sendError(
        res,
        403,
        "Không thể thay đổi vai trò của chính mình",
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (!canManageRoleId(currentUserRoleId, targetUser.roleId)) {
      return sendError(
        res,
        403,
        `Bạn không có quyền quản lý ${ROLE_HIERARCHY[targetUser.roleId].name}`,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (
      requestedRoleId &&
      !validateNewRole(currentUserRoleId, requestedRoleId, res)
    ) {
      return;
    }

    req.targetUser = targetUser;
    return next();
  } catch (error) {
    console.error("Error in checkRoleHierarchy:", error);
    return sendError(
      res,
      500,
      "Lỗi khi kiểm tra phân quyền",
      ERROR_CODES.SERVER_ERROR,
    );
  }
};
