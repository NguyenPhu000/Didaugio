import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prismaClient.js";
import { USER_STATUS } from "../config/constants.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../models/schemas/authSchema.js";
import * as emailVerificationService from "./emailVerificationService.js";
import * as passwordResetService from "./passwordResetService.js";

// =============================================================================
// AUTH SERVICE
// Hệ thống xác thực JWT hoàn chỉnh với:
// - Access Token (ngắn hạn) + Refresh Token (dài hạn)
// - Session management trong database
// - Account lockout sau nhiều lần đăng nhập sai
// - Forgot password / Reset password
// - Email verification
// =============================================================================

class ServiceError extends Error {
  constructor(message, statusCode = 400, errorCode = "SERVICE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// =============================================================================
// CONFIG
// =============================================================================
const JWT_SECRET = process.env.JWT_SECRET || "didaugio-secret-key-2026";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "didaugio-refresh-secret-2026";
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m"; // 15 phút
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d"; // 7 ngày
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày in milliseconds

// Account lockout config
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate Access Token (ngắn hạn)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

/**
 * Generate Refresh Token (dài hạn)
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Generate random token for email verification / password reset
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash token for storage
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// =============================================================================
// ĐĂNG KÝ
// =============================================================================
export const register = async (data) => {
  const validated = registerSchema.parse(data);

  // Kiểm tra email đã tồn tại
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new ServiceError("Email da duoc su dung", 400, "EMAIL_EXISTS");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  // Tạo verification token
  const verificationToken = generateRandomToken();
  const hashedVerificationToken = hashToken(verificationToken);

  // Tạo user và profile
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      roleId: 5, // Default: user
      status: "active",
      emailVerified: false,
      profile: {
        create: {
          fullName: validated.fullName || null,
        },
      },
    },
    include: {
      role: true,
      profile: true,
    },
  });

  // Gửi email verification (sử dụng service mới)
  try {
    await emailVerificationService.create({
      userId: user.id,
      email: user.email,
      name: validated.fullName || user.email,
    });
  } catch (error) {
    console.error("Failed to create email verification:", error);
    // Không throw error để không block việc đăng ký
  }

  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    message: "Dang ky thanh cong. Vui long xac thuc email.",
  };
};

// =============================================================================
// ĐĂNG NHẬP
// =============================================================================
export const login = async (data, clientInfo = {}) => {
  const validated = loginSchema.parse(data);

  // Tìm user theo email
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
    include: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new ServiceError(
      "Email hoac mat khau khong dung",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Kiểm tra account lockout
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingTime = Math.ceil(
      (new Date(user.lockedUntil) - new Date()) / 60000
    );
    throw new ServiceError(
      `Tai khoan bi khoa. Vui long thu lai sau ${remainingTime} phut`,
      423,
      "ACCOUNT_LOCKED"
    );
  }

  // Check password
  const isValidPassword = await bcrypt.compare(
    validated.password,
    user.password
  );

  if (!isValidPassword) {
    // Tăng số lần đăng nhập sai
    const failedCount = user.failedLoginCount + 1;
    const updateData = { failedLoginCount: failedCount };

    // Khóa tài khoản nếu vượt quá giới hạn
    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const remainingAttempts = MAX_FAILED_ATTEMPTS - failedCount;
    if (remainingAttempts > 0) {
      throw new ServiceError(
        `Email hoac mat khau khong dung. Con ${remainingAttempts} lan thu`,
        401,
        "INVALID_CREDENTIALS"
      );
    } else {
      throw new ServiceError(
        "Tai khoan da bi khoa do dang nhap sai qua nhieu lan",
        423,
        "ACCOUNT_LOCKED"
      );
    }
  }

  // Kiểm tra trạng thái tài khoản
  if (user.status === USER_STATUS.INACTIVE) {
    throw new ServiceError(
      "Tai khoan chua duoc kich hoat",
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new ServiceError("Tai khoan da bi cam", 403, "ACCOUNT_BANNED");
  }

  // Reset failed login count và cập nhật last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Tạo tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  });

  const refreshToken = generateRefreshToken();

  // Lưu refresh token vào session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      deviceId: validated.deviceId || clientInfo.deviceId || null,
      deviceName: validated.deviceName || clientInfo.deviceName || null,
      ipAddress: clientInfo.ipAddress || null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  // Xóa các session cũ đã hết hạn
  await prisma.userSession.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: new Date() },
    },
  });

  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES,
  };
};

// =============================================================================
// REFRESH TOKEN
// =============================================================================
export const refreshAccessToken = async (data) => {
  const validated = refreshTokenSchema.parse(data);
  const hashedToken = hashToken(validated.refreshToken);

  // Tìm session với refresh token
  const session = await prisma.userSession.findUnique({
    where: { refreshToken: hashedToken },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session) {
    throw new ServiceError(
      "Refresh token khong hop le",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  // Kiểm tra token hết hạn
  if (new Date(session.expiresAt) < new Date()) {
    // Xóa session hết hạn
    await prisma.userSession.delete({ where: { id: session.id } });
    throw new ServiceError(
      "Refresh token da het han",
      401,
      "REFRESH_TOKEN_EXPIRED"
    );
  }

  // Kiểm tra session còn active
  if (!session.isActive) {
    throw new ServiceError(
      "Session da bi vo hieu hoa",
      401,
      "SESSION_INACTIVE"
    );
  }

  // Kiểm tra user status
  if (session.user.status !== USER_STATUS.ACTIVE) {
    throw new ServiceError(
      "Tai khoan khong hoat dong",
      403,
      "ACCOUNT_INACTIVE"
    );
  }

  // Tạo access token mới
  const accessToken = generateAccessToken({
    userId: session.user.id,
    email: session.user.email,
    roleId: session.user.roleId,
    roleName: session.user.role.name,
  });

  // Cập nhật last used
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES,
  };
};

// =============================================================================
// ĐĂNG XUẤT
// =============================================================================
export const logout = async (refreshToken) => {
  if (!refreshToken) {
    return { message: "Dang xuat thanh cong" };
  }

  const hashedToken = hashToken(refreshToken);

  // Xóa session
  await prisma.userSession.deleteMany({
    where: { refreshToken: hashedToken },
  });

  return { message: "Dang xuat thanh cong" };
};

/**
 * Đăng xuất tất cả thiết bị
 */
export const logoutAll = async (userId) => {
  await prisma.userSession.deleteMany({
    where: { userId },
  });

  return { message: "Da dang xuat tat ca thiet bi" };
};

// =============================================================================
// LẤY THÔNG TIN USER HIỆN TẠI
// =============================================================================
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// =============================================================================
// ĐỔI MẬT KHẨU
// =============================================================================
export const changePassword = async (userId, data) => {
  const validated = changePasswordSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ServiceError("User khong ton tai", 404, "USER_NOT_FOUND");
  }

  // Kiểm tra mật khẩu hiện tại
  const isValidPassword = await bcrypt.compare(
    validated.currentPassword,
    user.password
  );

  if (!isValidPassword) {
    throw new ServiceError(
      "Mat khau hien tai khong dung",
      400,
      "INVALID_CURRENT_PASSWORD"
    );
  }

  // Hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

  // Cập nhật mật khẩu
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Xóa tất cả session (bắt buộc đăng nhập lại)
  await prisma.userSession.deleteMany({
    where: { userId },
  });

  return { message: "Doi mat khau thanh cong. Vui long dang nhap lai." };
};

// =============================================================================
// QUÊN MẬT KHẨU
// =============================================================================
export const forgotPassword = async (data, ipAddress = null) => {
  const validated = forgotPasswordSchema.parse(data);

  // Sử dụng passwordResetService (lưu vào bảng PasswordReset + gửi email)
  const result = await passwordResetService.create(validated.email, ipAddress);

  return {
    message: "Neu email ton tai, ban se nhan duoc link dat lai mat khau",
    // Trong môi trường dev, trả về token để test (nếu service trả về)
    ...(process.env.NODE_ENV === "development" &&
      result?.rawToken && { resetToken: result.rawToken }),
  };
};

// =============================================================================
// ĐẶT LẠI MẬT KHẨU
// =============================================================================
export const resetPassword = async (data) => {
  const validated = resetPasswordSchema.parse(data);

  // Sử dụng passwordResetService để reset (tự động hash password và cleanup)
  const result = await passwordResetService.reset(
    validated.token,
    validated.newPassword
  );

  return {
    message:
      result.message || "Dat lai mat khau thanh cong. Vui long dang nhap lai.",
  };
};

// =============================================================================
// XÁC THỰC EMAIL
// =============================================================================
export const verifyEmail = async (data) => {
  const validated = verifyEmailSchema.parse(data);

  try {
    // Sử dụng emailVerificationService để verify
    await emailVerificationService.verify(validated.token);
    return { message: "Xac thuc email thanh cong" };
  } catch (error) {
    // Chuyển đổi error từ service sang ServiceError
    if (error.statusCode) {
      throw error; // Đã là ServiceError
    }
    throw new ServiceError(
      error.message || "Token khong hop le",
      400,
      "INVALID_VERIFICATION_TOKEN"
    );
  }
};

// =============================================================================
// GỬI LẠI EMAIL XÁC THỰC
// =============================================================================
export const resendVerificationEmail = async (userId) => {
  try {
    // Sử dụng emailVerificationService để resend
    await emailVerificationService.resend(userId);
    return { message: "Da gui lai email xac thuc" };
  } catch (error) {
    // Chuyển đổi error từ service sang ServiceError
    if (error.statusCode) {
      throw error; // Đã là ServiceError
    }
    throw new ServiceError(
      error.message || "Khong the gui email",
      error.statusCode || 400,
      "RESEND_FAILED"
    );
  }
};

// =============================================================================
// LẤY DANH SÁCH SESSION
// =============================================================================
export const getSessions = async (userId) => {
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });

  return sessions;
};

// =============================================================================
// XÓA SESSION CỤ THỂ
// =============================================================================
export const revokeSession = async (userId, sessionId) => {
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new ServiceError("Session khong ton tai", 404, "SESSION_NOT_FOUND");
  }

  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  return { message: "Da xoa session" };
};

// =============================================================================
// VERIFY ACCESS TOKEN (dùng cho middleware)
// =============================================================================
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getSessions,
  revokeSession,
  verifyAccessToken,
};
