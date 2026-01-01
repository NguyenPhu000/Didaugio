import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "didaugio-secret-key-2026";

// =============================================================================
// AUTH MIDDLEWARE
// Verify JWT token va attach user info vao request
// =============================================================================

/**
 * Middleware xac thuc token
 * Su dung cho cac route can dang nhap
 */
export const authenticate = (req, res, next) => {
  try {
    // Lay token tu header
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

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info vao request
    req.user = decoded;

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
 * Middleware kiem tra quyen (role)
 * Su dung sau authenticate middleware
 * @param {number[]} allowedRoles - Danh sach roleId duoc phep
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

export default {
  authenticate,
  authorize,
};
