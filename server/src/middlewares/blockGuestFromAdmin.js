import { ROLES } from "../config/constants.js";

/**
 * Middleware chặn GUEST role khỏi tất cả admin routes
 *
 * SECURITY REQUIREMENT:
 * - GUEST role KHÔNG được truy cập bất kỳ trang/API admin nào
 * - Áp dụng cho tất cả routes có prefix /admin
 * - Block ở cả frontend và backend
 *
 * Usage:
 *   app.use('/api/admin', authenticate, blockGuestFromAdmin);
 *   router.use(authenticate, blockGuestFromAdmin);
 */
export const blockGuestFromAdmin = (req, res, next) => {
  // Kiểm tra user đã được authenticate chưa
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa xác thực. Vui lòng đăng nhập.",
      errorCode: "NOT_AUTHENTICATED",
    });
  }

  // Kiểm tra roleId
  if (req.user.roleId === ROLES.GUEST) {
    return res.status(403).json({
      success: false,
      message: "Guest users are not allowed in admin area",
      errorCode: "GUEST_NOT_ALLOWED",
      details: "Tài khoản Guest không có quyền truy cập khu vực quản trị",
    });
  }

  // Cho phép STAFF, BUSINESS, ADMIN, SUPER_ADMIN đi tiếp
  next();
};

/**
 * Middleware check minimum role level
 * Usage: checkMinRole(['ADMIN', 'SUPER_ADMIN'])
 */
export const checkMinRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực",
        errorCode: "NOT_AUTHENTICATED",
      });
    }

    const userRoleId = req.user.roleId;
    const allowedRoleIds = allowedRoles.map((role) => ROLES[role]);

    if (!allowedRoleIds.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        message: `Yêu cầu quyền: ${allowedRoles.join(" hoặc ")}`,
        errorCode: "INSUFFICIENT_PERMISSION",
      });
    }

    next();
  };
};

export default {
  blockGuestFromAdmin,
  checkMinRole,
};
