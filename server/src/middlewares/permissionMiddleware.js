import prisma from "../config/prismaClient.js";

// =============================================================================
// PERMISSION MIDDLEWARE - KIỂM TRA QUYỀN HẠN
// =============================================================================

/**
 * Middleware kiểm tra quyền hạn của user
 * @param {string|string[]} requiredPermission - Tên quyền hoặc mảng quyền cần kiểm tra
 * @returns {Function} Express middleware
 *
 * @example
 * // Require 1 quyền
 * router.get('/users', requirePermission('users.view'), userController.getAll);
 *
 * // Require 1 trong nhiều quyền (OR logic)
 * router.get('/users', requirePermission(['users.view', 'users.view_detail']), userController.getAll);
 */
export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Từ authMiddleware

      if (!user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "Vui lòng đăng nhập để tiếp tục",
          errorCode: "UNAUTHORIZED",
        });
      }

      // RULE 1: GUEST (roleId = 5) tuyệt đối KHÔNG được vào admin panel
      if (user.roleId === 5) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn không có quyền truy cập trang quản trị",
          errorCode: "FORBIDDEN_GUEST",
        });
      }

      // RULE 2: SUPER_ADMIN (roleId = 1) có tất cả quyền
      if (user.roleId === 1) {
        return next();
      }

      // RULE 3: Kiểm tra quyền cụ thể
      const permissionsToCheck = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];

      // Lấy tất cả quyền của user từ database
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

      // Tạo Set các permission names của user
      const userPermissionNames = new Set(
        userPermissions.map((rp) => rp.permission.name)
      );

      // Kiểm tra xem user có ít nhất 1 trong các quyền cần thiết không (OR logic)
      const hasPermission = permissionsToCheck.some((permission) =>
        userPermissionNames.has(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          data: null,
          message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${permissionsToCheck.join(
            " hoặc "
          )}`,
          errorCode: "FORBIDDEN_NO_PERMISSION",
        });
      }

      // User có quyền, cho phép tiếp tục
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

      const userPermissionNames = new Set(
        userPermissions.map((rp) => rp.permission.name)
      );

      // Kiểm tra có đầy đủ TẤT CẢ quyền không (AND logic)
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissionNames.has(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (permission) => !userPermissionNames.has(permission)
        );

        return res.status(403).json({
          success: false,
          data: null,
          message: `Bạn thiếu các quyền sau: ${missingPermissions.join(", ")}`,
          errorCode: "FORBIDDEN_MISSING_PERMISSIONS",
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
