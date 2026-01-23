import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prismaClient.js";
import { USER_STATUS } from "../config/constants.js";
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from "../config/messages.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";
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
// Hệ thống xác thực JWT hoàn chỉnh
// =============================================================================

class ServiceError extends Error {
  constructor(message, statusCode = 400, errorCode = ERROR_CODES.VALIDATION_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// =============================================================================
// CONFIG
// =============================================================================
const JWT_SECRET = process.env.JWT_SECRET || "didaugio-secret-key-2026";
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Account lockout config
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// =============================================================================
// ĐĂNG KÝ
// =============================================================================
export const register = async (data) => {
  const validated = registerSchema.parse(data);

  // Check existing email
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new ServiceError(ERROR_MESSAGES.EXISTED, 400, ERROR_CODES.EXISTED);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      roleId: 5, // User
      status: USER_STATUS.ACTIVE, // Assuming active by default for now
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

  // Send verification email
  try {
    await emailVerificationService.create({
      userId: user.id,
      email: user.email,
      name: validated.fullName || user.email,
    });
  } catch (error) {
    console.error("Failed to create email verification:", error);
  }

  // Emit event
  eventEmitter.emit(EVENTS.USER.REGISTERED, { userId: user.id, email: user.email });

  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    message: "Đăng ký thành công. Vui lòng xác thực email.",
  };
};

// =============================================================================
// ĐĂNG NHẬP
// =============================================================================
export const login = async (data, clientInfo = {}) => {
  const validated = loginSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
    include: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 401, ERROR_CODES.UNAUTHORIZED);
  }

  // Check lockout
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
    throw new ServiceError(
      `Tài khoản bị khóa. Vui lòng thử lại sau ${remainingTime} phút`,
      423,
      "ACCOUNT_LOCKED"
    );
  }

  // Check password
  const isValidPassword = await bcrypt.compare(validated.password, user.password);

  if (!isValidPassword) {
    const failedCount = user.failedLoginCount + 1;
    const updateData = { failedLoginCount: failedCount };

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
        `Email hoặc mật khẩu không đúng. Còn ${remainingAttempts} lần thử`,
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    } else {
      throw new ServiceError(
        "Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần",
        423,
        "ACCOUNT_LOCKED"
      );
    }
  }

  // Check status
  if (user.status === USER_STATUS.INACTIVE) {
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 403, "ACCOUNT_INACTIVE");
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new ServiceError("Tài khoản đã bị cấm", 403, "ACCOUNT_BANNED");
  }

  // Reset lockout
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  });

  const refreshToken = generateRefreshToken();

  // Create session
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

  // Cleanup old sessions
  await prisma.userSession.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: new Date() },
    },
  });

  // Emit event
  eventEmitter.emit(EVENTS.USER.LOGGED_IN, { userId: user.id });

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

  const session = await prisma.userSession.findUnique({
    where: { refreshToken: hashedToken },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  if (!session) {
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 401, ERROR_CODES.INVALID_TOKEN);
  }

  if (new Date(session.expiresAt) < new Date()) {
    await prisma.userSession.delete({ where: { id: session.id } });
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 401, "REFRESH_TOKEN_EXPIRED");
  }

  if (!session.isActive) {
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 401, "SESSION_INACTIVE");
  }

  if (session.user.status !== USER_STATUS.ACTIVE) {
    throw new ServiceError(ERROR_MESSAGES.UNAUTHORIZED, 403, "ACCOUNT_INACTIVE");
  }

  const accessToken = generateAccessToken({
    userId: session.user.id,
    email: session.user.email,
    roleId: session.user.roleId,
    roleName: session.user.role.name,
  });

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
// LOGOUT
// =============================================================================
export const logout = async (refreshToken) => {
  if (!refreshToken) {
    return { message: SUCCESS_MESSAGES.ACTION_SUCCESS };
  }

  const hashedToken = hashToken(refreshToken);

  await prisma.userSession.deleteMany({
    where: { refreshToken: hashedToken },
  });

  return { message: SUCCESS_MESSAGES.ACTION_SUCCESS };
};

export const logoutAll = async (userId) => {
  await prisma.userSession.deleteMany({
    where: { userId },
  });

  return { message: SUCCESS_MESSAGES.ACTION_SUCCESS };
};

// =============================================================================
// GET ME
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
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// =============================================================================
// PASSWORD OPERATIONS
// =============================================================================
export const changePassword = async (userId, data) => {
  const validated = changePasswordSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  const isValidPassword = await bcrypt.compare(validated.currentPassword, user.password);

  if (!isValidPassword) {
    throw new ServiceError("Mật khẩu hiện tại không đúng", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.userSession.deleteMany({
    where: { userId },
  });

  return { message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." };
};

export const forgotPassword = async (data, ipAddress = null) => {
  const validated = forgotPasswordSchema.parse(data);

  const result = await passwordResetService.create(validated.email, ipAddress);

  return {
    message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu",
    ...(process.env.NODE_ENV === "development" && result?.rawToken && { resetToken: result.rawToken }),
  };
};

export const resetPassword = async (data) => {
  const validated = resetPasswordSchema.parse(data);

  const result = await passwordResetService.reset(validated.token, validated.newPassword);

  return {
    message: result.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
  };
};

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================
export const verifyEmail = async (data) => {
  const validated = verifyEmailSchema.parse(data);

  try {
    await emailVerificationService.verify(validated.token);
    return { message: "Xác thực email thành công" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw new ServiceError(error.message || ERROR_MESSAGES.VALIDATION_ERROR, 400, ERROR_CODES.VALIDATION_ERROR);
  }
};

export const resendVerificationEmail = async (userId) => {
  try {
    await emailVerificationService.resend(userId);
    return { message: "Đã gửi lại email xác thực" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw new ServiceError(error.message || "Không thể gửi email", error.statusCode || 400, "RESEND_FAILED");
  }
};

// =============================================================================
// SESSIONS
// =============================================================================
export const getSessions = async (userId) => {
  return await prisma.userSession.findMany({
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
};

export const revokeSession = async (userId, sessionId) => {
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new ServiceError(ERROR_MESSAGES.NOT_FOUND, 404, ERROR_CODES.NOT_FOUND);
  }

  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  return { message: SUCCESS_MESSAGES.ACTION_SUCCESS };
};

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
