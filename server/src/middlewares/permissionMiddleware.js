import prisma from "../config/prismaClient.js";

// =============================================================================
// PERMISSION MIDDLEWARE - KIỂM TRA QUYỀN HẠN (RBAC Enhanced)
// =============================================================================

/**
 * Lấy tất cả quyền của user (Role + Custom)
 * Logic: Quyền thực tế = Role Permissions + User Custom Permissions (Additive)
 */
async function getUserPermissions(userId, roleId) {
  // RULE: SUPER_ADMIN (roleId = 1) có tất cả quyền
  if (roleId === 1) {
    return { isSuperAdmin: true, permissions: new Set(["*"]) };
  }

  // Lấy quyền từ Role
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      permission: { select: { name: true } },
    },
  });

  // Lấy quyền Custom của User cá nhân
  const customPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: {
      permission: { select: { name: true } },
    },
  });

  // Gộp 2 nguồn quyền (Additive logic)
  const allPermissions = new Set([
    ...rolePermissions.map((rp) => rp.permission.name),
    ...customPermissions.map((up) => up.permission.name),
  ]);

  return { isSuperAdmin: false, permissions: allPermissions };
}

/**
 * Middleware kiểm tra quyền hạn của user (Check permission-based, not role-based)
 * @param {string|string[]} requiredPermission - Tên quyền hoặc mảng quyền cần kiểm tra
 * @returns {Function} Express middleware
 *
 * @example
 * // Require 1 quyền
 * router.put('/places/:id/verify', hasPermission('places:verify'), placeController.verify);
 *
 * // Require 1 trong nhiều quyền (OR logic)
 * router.get('/users', hasPermission(['users:view', 'users:view_detail']), userController.getAll);
 */
export const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Từ authMiddleware

      if (!user || !user.userId) {
        console.log('[Permission Middleware] No user in request');
        return res.status(401).json({
          success: false,
          data: null,
          message: "Vui lòng đăng nhập để tiếp tục",
          errorCode: "UNAUTHORIZED",
        });
      }

      console.log('[Permission Middleware] User:', user.userId, 'Role:', user.roleId, 'Required:', requiredPermission);

      // RULE 1: GUEST (roleId = 5) tuyệt đối KHÔNG được vào admin panel
      if (user.roleId === 5) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền truy cập trang quản trị",
          errorCode: "FORBIDDEN_GUEST",
        });
      }

      // Lấy tất cả quyền của user (Role + Custom)
      const { isSuperAdmin, permissions } = await getUserPermissions(
        user.userId,
        user.roleId
      );

      // RULE 2: SUPER_ADMIN có tất cả quyền
      if (isSuperAdmin) {
        req.userPermissions = permissions; // Gắn vào req để dùng sau
        return next();
      }

      // RULE 3: Kiểm tra quyền cụ thể
      const permissionsToCheck = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];

      // Kiểm tra xem user có ít nhất 1 trong các quyền cần thiết không (OR logic)
      const hasRequiredPermission = permissionsToCheck.some((permission) =>
        permissions.has(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          success: false,
          data: null,
          message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${permissionsToCheck.join(
            " hoặc "
          )}`,
          errorCode: "FORBIDDEN_NO_PERMISSION",
          requiredPermissions: permissionsToCheck,
        });
      }

      // User có quyền, gắn vào req để dùng sau
      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: "Lỗi khi kiểm tra quyền hạn",
        errorCode: "PERMISSION_CHECK_ERROR",
      });
    }
  };
};

/**
 * Legacy middleware - Giữ lại để tương thích ngược
 * @deprecated Sử dụng hasPermission() thay thế
 */
export const requirePermission = hasPermission;

/**
 * Middleware kiểm tra user có TẤT CẢ các quyền (AND logic)
 * @param {string[]} requiredPermissions - Mảng các quyền cần có đầy đủ
 * @returns {Function} Express middleware
 *
 * @example
 * // Require tất cả quyền
 * router.post('/users', requireAllPermissions(['users.create', 'users.edit']), userController.create);
 */
export const requireAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "Vui lòng đăng nhập để tiếp tục",
          errorCode: "UNAUTHORIZED",
        });
      }

      // GUEST không được vào
      if (user.roleId === 5) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền truy cập trang quản trị",
          errorCode: "FORBIDDEN_GUEST",
        });
      }

      // SUPER_ADMIN có tất cả quyền
      if (user.roleId === 1) {
        return next();
      }

      // Lấy quyền của user (Role + Custom)
      const { permissions } = await getUserPermissions(user.userId, user.roleId);

      // Kiểm tra có đầy đủ TẤT CẢ quyền không (AND logic)
      const hasAllPermissions = requiredPermissions.every((permission) =>
        permissions.has(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (permission) => !permissions.has(permission)
        );

        return res.status(403).json({
          success: false,
          data: null,
          message: `Bạn thiếu các quyền sau: ${missingPermissions.join(", ")}`,
          errorCode: "FORBIDDEN_MISSING_PERMISSIONS",
          requiredPermissions: requiredPermissions,
          missingPermissions: missingPermissions,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        message: "Lỗi khi kiểm tra quyền hạn",
        errorCode: "PERMISSION_CHECK_ERROR",
      });
    }
  };
};

/**
 * Middleware để lấy tất cả permissions của user hiện tại (không chặn request)
 * Gắn vào req.userPermissions để sử dụng trong controller/service
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/dashboard', authMiddleware, loadUserPermissions, dashboardController.get);
 * // Trong controller: req.userPermissions sẽ là Set(['users.view', 'places.view', ...])
 */
export const loadUserPermissions = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      req.userPermissions = new Set();
      return next();
    }

    // GUEST không có quyền
    if (user.roleId === 5) {
      req.userPermissions = new Set();
      return next();
    }

    // SUPER_ADMIN có tất cả quyền (lấy từ DB)
    if (user.roleId === 1) {
      const allPermissions = await prisma.permission.findMany({
        select: { name: true },
      });
      req.userPermissions = new Set(allPermissions.map((p) => p.name));
      return next();
    }

    // Lấy quyền của user
    const userPermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: user.roleId,
      },
      include: {
        permission: {
          select: {
            name: true,
          },
        },
      },
    });

    req.userPermissions = new Set(
      userPermissions.map((rp) => rp.permission.name)
    );

    next();
  } catch (error) {
    console.error("Load permissions error:", error);
    req.userPermissions = new Set();
    next();
  }
};
