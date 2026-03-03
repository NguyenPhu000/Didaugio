import jwt from "jsonwebtoken";
import { ROLES } from "../config/constants.js";

const JWT_SECRET = process.env.JWT_SECRET;

const ROLE_NAME_TO_ID = {
  super_admin: ROLES.SUPER_ADMIN,
  admin: ROLES.ADMIN,
  business: ROLES.BUSINESS,
  staff: ROLES.STAFF,
  user: ROLES.USER,
  guest: ROLES.GUEST,
};

const resolveRoleId = (decoded = {}) => {
  if (decoded.roleId) return decoded.roleId;
  const roleKey = String(decoded.roleName || decoded.role || "").toLowerCase();
  return ROLE_NAME_TO_ID[roleKey] || null;
};

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token khong duoc cung cap",
        errorCode: "NO_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id,
      id: decoded.id || decoded.userId,
      roleId: resolveRoleId(decoded),
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token da het han",
        errorCode: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token khong hop le",
        errorCode: "INVALID_TOKEN",
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
      message: "Loi xac thuc",
      errorCode: "AUTH_ERROR",
    });
  }
};

/**
 * Không có token → cho qua (guest). Token lỗi → 401.
 */
export const authenticateOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Authorization header khong hop le",
        errorCode: "INVALID_AUTH_HEADER",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id,
      id: decoded.id || decoded.userId,
      roleId: resolveRoleId(decoded),
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token da het han",
        errorCode: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      data: null,
      message: "Token khong hop le",
      errorCode: "INVALID_TOKEN",
    });
  }
};

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Chua xac thuc",
        errorCode: "NOT_AUTHENTICATED",
      });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Khong co quyen truy cap",
        errorCode: "FORBIDDEN",
      });
    }

    next();
  };
};

export default { authenticate, authenticateOptional, authorize };
