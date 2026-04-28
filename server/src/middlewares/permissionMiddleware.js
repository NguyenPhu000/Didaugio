import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";
import { ERROR_MESSAGES, ERROR_CODES } from "../config/messages.js";

const SYSTEM_RESTRICTED_PERMISSIONS = {
  [ROLES.ADMIN]: new Set([
    "roles.manage_permissions",
    "roles.assign_to_users",
  ]),
  [ROLES.BUSINESS]: new Set([
    "places.approve",
    "places.reject",
    "places.feature",
  ]),
};

function getSystemRestrictedPermissions(requiredPermission, roleId) {
  const restrictedSet = SYSTEM_RESTRICTED_PERMISSIONS[roleId];

  if (!restrictedSet) {
    return [];
  }

  const permissionsToCheck = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  return permissionsToCheck.filter((permission) =>
    restrictedSet.has(permission),
  );
}

async function getUserPermissions(userId, roleId) {
  if (roleId === ROLES.SUPER_ADMIN) {
    return { isSuperAdmin: true, permissions: new Set(["*"]) };
  }

  const [rolePermissions, customPermissions] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: { select: { name: true } } },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      include: { permission: { select: { name: true } } },
    }),
  ]);

  const allPermissions = new Set([
    ...rolePermissions.map((rp) => rp.permission.name),
    ...customPermissions.map((up) => up.permission.name),
  ]);

  return { isSuperAdmin: false, permissions: allPermissions };
}

/**
 * OR logic: user cần ít nhất 1 trong các quyền
 */
export const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user || !user.userId) {
        return res.status(401).json({
          success: false,
          data: null,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          errorCode: ERROR_CODES.UNAUTHORIZED,
        });
      }

      if (user.roleId === ROLES.USER) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền truy cập trang quản trị",
          errorCode: "FORBIDDEN_USER",
        });
      }

      const blockedBySystemRole = getSystemRestrictedPermissions(
        requiredPermission,
        user.roleId,
      );

      if (blockedBySystemRole.length > 0) {
        return res.status(403).json({
          success: false,
          data: null,
          message: `Vai trò hiện tại không được phép thực hiện quyền hệ thống: ${blockedBySystemRole.join(", ")}`,
          errorCode: "FORBIDDEN_SYSTEM_ROLE",
          blockedPermissions: blockedBySystemRole,
        });
      }

      const { isSuperAdmin, permissions } = await getUserPermissions(
        user.userId,
        user.roleId,
      );

      if (isSuperAdmin) {
        req.userPermissions = permissions;
        return next();
      }

      const permissionsToCheck = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];

      const hasRequiredPermission = permissionsToCheck.some((permission) =>
        permissions.has(permission),
      );

      if (!hasRequiredPermission) {
        console.warn(
          `[Permission Denied] User ${user.userId} tried to access ${req.originalUrl} without ${permissionsToCheck.join(", ")}`,
        );
        return res.status(403).json({
          success: false,
          data: null,
          message: ERROR_MESSAGES.FORBIDDEN,
          errorCode: ERROR_CODES.FORBIDDEN,
        });
      }

      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: ERROR_MESSAGES.SERVER_ERROR,
        errorCode: ERROR_CODES.SERVER_ERROR,
      });
    }
  };
};

export const requirePermission = hasPermission;

/**
 * AND logic: user cần TẤT CẢ quyền
 */
export const requireAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          errorCode: ERROR_CODES.UNAUTHORIZED,
        });
      }

      if (user.roleId === ROLES.USER) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền truy cập trang quản trị",
          errorCode: "FORBIDDEN_USER",
        });
      }

      const blockedBySystemRole = getSystemRestrictedPermissions(
        requiredPermissions,
        user.roleId,
      );

      if (blockedBySystemRole.length > 0) {
        return res.status(403).json({
          success: false,
          data: null,
          message: `Vai trò hiện tại không được phép thực hiện quyền hệ thống: ${blockedBySystemRole.join(", ")}`,
          errorCode: "FORBIDDEN_SYSTEM_ROLE",
          blockedPermissions: blockedBySystemRole,
        });
      }

      if (user.roleId === ROLES.SUPER_ADMIN) {
        return next();
      }

      const { permissions } = await getUserPermissions(
        user.userId,
        user.roleId,
      );

      const hasAllPermissions = requiredPermissions.every((permission) =>
        permissions.has(permission),
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (permission) => !permissions.has(permission),
        );

        console.warn(
          `[Permission Denied] User ${user.userId} missing permissions: ${missingPermissions.join(", ")}`,
        );

        return res.status(403).json({
          success: false,
          data: null,
          message: ERROR_MESSAGES.FORBIDDEN,
          errorCode: ERROR_CODES.FORBIDDEN,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: ERROR_MESSAGES.SERVER_ERROR,
        errorCode: ERROR_CODES.SERVER_ERROR,
      });
    }
  };
};

export const loadUserPermissions = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      req.userPermissions = new Set();
      return next();
    }

    if (user.roleId >= ROLES.USER) {
      req.userPermissions = new Set();
      return next();
    }

    if (user.roleId === ROLES.SUPER_ADMIN) {
      const allPermissions = await prisma.permission.findMany({
        select: { name: true },
      });
      req.userPermissions = new Set(allPermissions.map((p) => p.name));
      return next();
    }

    const userPermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: { select: { name: true } } },
    });

    req.userPermissions = new Set(
      userPermissions.map((rp) => rp.permission.name),
    );

    next();
  } catch (error) {
    console.error("Load permissions error:", error);
    req.userPermissions = new Set();
    next();
  }
};
