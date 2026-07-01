import jwt from "jsonwebtoken";
import { ROLES } from "../config/constants.js";
import { setOnline } from "../utils/onlineManager.js";
import prisma from "../config/prismaClient.js";

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

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = (authHeader && authHeader.startsWith("Bearer "))
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token khong duoc cung cap",
        errorCode: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // Fetch the latest roleId directly from the DB to support dynamic role changes (e.g. business approved)
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, status: true, role: { select: { name: true } } },
    });

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Tai khoan nguoi dung khong ton tai",
        errorCode: "USER_NOT_FOUND",
      });
    }

    if (userRecord.status === "banned") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Tai khoan cua ban da bi khoa",
        errorCode: "ACCOUNT_BANNED",
      });
    }

    if (userRecord.status === "inactive") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Tai khoan chua duoc kich hoat",
        errorCode: "ACCOUNT_INACTIVE",
      });
    }

    req.user = {
      ...decoded,
      userId: userId,
      id: userId,
      roleId: userRecord.roleId,
      roleName: userRecord.role.name,
    };

    setOnline(req.user.userId);

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
export const authenticateOptional = async (req, res, next) => {
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
    const userId = decoded.userId || decoded.id;

    // Fetch the latest roleId directly from the DB to support dynamic role changes
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, status: true, role: { select: { name: true } } },
    });

    if (userRecord) {
      if (userRecord.status === "banned" || userRecord.status === "inactive") {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Tai khoan khong hop le",
          errorCode: "ACCOUNT_INVALID",
        });
      }
    }

    req.user = {
      ...decoded,
      userId: userId,
      id: userId,
      roleId: userRecord ? userRecord.roleId : resolveRoleId(decoded),
      roleName: userRecord ? userRecord.role.name : decoded.roleName,
    };

    setOnline(req.user.userId);

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
/**
 * @deprecated Use hasPermission() from permissionMiddleware.js instead.
 * This middleware only checks roleId directly, bypassing the permission system.
 * Kept for backward compatibility only.
 */
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

/** Admin CMS: SUPER_ADMIN, ADMIN, STAFF */
export const isAdminOrStaff = authorize([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
]);

/**
 * SSE-specific auth: accepts token from query param.
 * Only use this for Server-Sent Events endpoints where
 * the client cannot set Authorization headers.
 */
export const authenticateSSE = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query?.token;
    const token = (authHeader && authHeader.startsWith("Bearer "))
      ? authHeader.split(" ")[1]
      : queryToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token khong duoc cung cap",
        errorCode: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, status: true, role: { select: { name: true } } },
    });

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Tai khoan nguoi dung khong ton tai",
        errorCode: "USER_NOT_FOUND",
      });
    }

    if (userRecord.status === "banned" || userRecord.status === "inactive") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Tai khoan khong hop le",
        errorCode: "ACCOUNT_INVALID",
      });
    }

    req.user = {
      ...decoded,
      userId: userId,
      id: userId,
      roleId: userRecord.roleId,
      roleName: userRecord.role.name,
    };

    setOnline(req.user.userId);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Token khong hop le",
      errorCode: "INVALID_TOKEN",
    });
  }
};

export default { authenticate, authenticateOptional, authenticateSSE, authorize, isAdminOrStaff };
