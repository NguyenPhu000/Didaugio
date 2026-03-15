import { ROLES } from "../config/constants.js";

export const blockGuestFromAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Chưa xác thực. Vui lòng đăng nhập.",
      errorCode: "NOT_AUTHENTICATED",
    });
  }

  if (req.user.roleId === ROLES.GUEST) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Tài khoản Guest không có quyền truy cập khu vực quản trị",
      errorCode: "GUEST_NOT_ALLOWED",
    });
  }

  next();
};

export const checkMinRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Chưa xác thực",
        errorCode: "NOT_AUTHENTICATED",
      });
    }

    const allowedRoleIds = allowedRoles.map((role) => ROLES[role]);

    if (!allowedRoleIds.includes(req.user.roleId)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: `Yêu cầu quyền: ${allowedRoles.join(" hoặc ")}`,
        errorCode: "INSUFFICIENT_PERMISSION",
      });
    }

    next();
  };
};

export default { blockGuestFromAdmin, checkMinRole };
