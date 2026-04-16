import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../config/prismaClient.js";
import { USER_STATUS, ROLES } from "../../config/constants.js";
import {
  ERROR_MESSAGES,
  ERROR_CODES,
  SUCCESS_MESSAGES,
} from "../../config/messages.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationPublicSchema,
} from "../../models/index.js";
import * as emailVerificationService from "../activity/emailVerification.service.js";
import * as passwordResetService from "../activity/passwordReset.service.js";
import ServiceError from "../../utils/serviceError.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new ServiceError(
    "Thiếu cấu hình JWT_SECRET",
    500,
    ERROR_CODES.INTERNAL_ERROR,
  );
}
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GOOGLE_ALLOWED_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

// Account lockout config
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RESEND_VERIFICATION_GENERIC_MESSAGE =
  "Nếu email tồn tại và chưa xác thực, hệ thống đã gửi lại email xác thực.";

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

const getUserPermissionNames = async (userId, roleId) => {
  if (!userId || !roleId) {
    return [];
  }

  if (roleId === ROLES.SUPER_ADMIN) {
    return ["*"];
  }

  const [rolePermissions, customPermissions] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { roleId },
      select: {
        permission: {
          select: { name: true },
        },
      },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      select: {
        permission: {
          select: { name: true },
        },
      },
    }),
  ]);

  return Array.from(
    new Set([
      ...rolePermissions.map((item) => item.permission.name),
      ...customPermissions.map((item) => item.permission.name),
    ]),
  );
};

export const register = async (data) => {
  const validated = registerSchema.parse(data);

  // 🚫 BLOCK: GUEST role (id=6) cannot register via web
  // GUEST is reserved for unauthenticated mobile sessions only
  if (validated.roleId && validated.roleId === ROLES.GUEST) {
    throw new ServiceError(
      "GUEST role registration is not allowed via web. Mobile app only.",
      400,
      "GUEST_REGISTRATION_NOT_ALLOWED",
    );
  }

  // Check existing email
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new ServiceError(ERROR_MESSAGES.EXISTED, 400, ERROR_CODES.EXISTED);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  // Create user - Default to BUSINESS role (3) for web registration
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      roleId: validated.roleId || 3, // Default: BUSINESS, not GUEST
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
  eventEmitter.emit(EVENTS.USER.REGISTERED, {
    userId: user.id,
    email: user.email,
  });

  const { password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    message: "Đăng ký thành công. Vui lòng xác thực email.",
  };
};

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
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  // Check lockout
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingTime = Math.ceil(
      (new Date(user.lockedUntil) - new Date()) / 60000,
    );
    throw new ServiceError(
      `Tài khoản bị khóa. Vui lòng thử lại sau ${remainingTime} phút`,
      423,
      "ACCOUNT_LOCKED",
    );
  }

  // Check password
  const isValidPassword = await bcrypt.compare(
    validated.password,
    user.password,
  );

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
        ERROR_CODES.UNAUTHORIZED,
      );
    } else {
      throw new ServiceError(
        "Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần",
        423,
        "ACCOUNT_LOCKED",
      );
    }
  }

  // 🚫 BLOCK: GUEST role (id=6) cannot login to web admin
  // GUEST is reserved for unauthenticated mobile sessions only.
  // USER (id=5) = regular tourist — can login to web if needed
  if (user.roleId === ROLES.GUEST) {
    throw new ServiceError(
      "GUEST users cannot login to web admin. Mobile app only.",
      403,
      "GUEST_LOGIN_NOT_ALLOWED",
    );
  }

  // Check status
  if (user.status === USER_STATUS.INACTIVE) {
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      403,
      "ACCOUNT_INACTIVE",
    );
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new ServiceError("Tài khoản đã bị cấm", 403, "ACCOUNT_BANNED");
  }

  if (!user.emailVerified) {
    throw new ServiceError(
      "Email chưa được xác thực. Vui lòng kiểm tra hộp thư và xác thực trước khi đăng nhập.",
      403,
      "EMAIL_NOT_VERIFIED",
    );
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

  const permissions = await getUserPermissionNames(user.id, user.roleId);
  const { password, ...userWithoutPassword } = user;

  return {
    user: {
      ...userWithoutPassword,
      permissions,
    },
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES,
  };
};

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
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      ERROR_CODES.INVALID_TOKEN,
    );
  }

  if (new Date(session.expiresAt) < new Date()) {
    await prisma.userSession.delete({ where: { id: session.id } });
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      "REFRESH_TOKEN_EXPIRED",
    );
  }

  if (!session.isActive) {
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
      "SESSION_INACTIVE",
    );
  }

  if (session.user.status !== USER_STATUS.ACTIVE) {
    throw new ServiceError(
      ERROR_MESSAGES.UNAUTHORIZED,
      403,
      "ACCOUNT_INACTIVE",
    );
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

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      profile: true,
    },
  });

  if (!user) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const permissions = await getUserPermissionNames(user.id, user.roleId);
  const { password, ...userWithoutPassword } = user;

  return {
    ...userWithoutPassword,
    permissions,
  };
};

export const changePassword = async (userId, data) => {
  const validated = changePasswordSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const isValidPassword = await bcrypt.compare(
    validated.currentPassword,
    user.password,
  );

  if (!isValidPassword) {
    throw new ServiceError(
      "Mật khẩu hiện tại không đúng",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
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
    ...(process.env.NODE_ENV === "development" &&
      result?.rawToken && { resetToken: result.rawToken }),
  };
};

export const resetPassword = async (data) => {
  const validated = resetPasswordSchema.parse(data);

  const result = await passwordResetService.reset(
    validated.token,
    validated.newPassword,
  );

  return {
    message:
      result.message || "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
  };
};

export const verifyEmail = async (data) => {
  const validated = verifyEmailSchema.parse(data);

  try {
    await emailVerificationService.verify(validated.token);
    return { message: "Xác thực email thành công" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw new ServiceError(
      error.message || ERROR_MESSAGES.VALIDATION_ERROR,
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }
};

export const resendVerificationEmail = async (userId) => {
  try {
    await emailVerificationService.resend(userId);
    return { message: "Đã gửi lại email xác thực" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw new ServiceError(
      error.message || "Không thể gửi email",
      error.statusCode || 400,
      "RESEND_FAILED",
    );
  }
};

export const resendVerificationEmailPublic = async (data) => {
  const validated = resendVerificationPublicSchema.parse(data);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
    include: {
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!user || user.emailVerified) {
    return { message: RESEND_VERIFICATION_GENERIC_MESSAGE };
  }

  try {
    await emailVerificationService.create({
      userId: user.id,
      email: user.email,
      name: user.profile?.fullName || user.email,
    });
  } catch (error) {
    console.error("Failed to resend verification email (public):", error);
    throw new ServiceError(
      "Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.",
      500,
      "RESEND_FAILED",
    );
  }

  return { message: RESEND_VERIFICATION_GENERIC_MESSAGE };
};

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
    throw new ServiceError(
      ERROR_MESSAGES.NOT_FOUND,
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  await prisma.userSession.delete({
    where: { id: sessionId },
  });

  return { message: SUCCESS_MESSAGES.ACTION_SUCCESS };
};

/**
 * Xác thực Google id_token và tạo phiên đăng nhập
 * Tự động tạo tài khoản nếu email chưa tồn tại
 */
export const loginWithGoogle = async (
  idToken,
  clientInfo = {},
  options = {},
) => {
  if (!idToken) {
    throw new ServiceError("id_token is required", 400, "MISSING_ID_TOKEN");
  }

  const expectedAudience =
    options.expectedAudience || process.env.GOOGLE_CLIENT_ID || null;
  const expectedNonce = options.expectedNonce || null;

  // Xác thực id_token với Google (không cần thêm package)
  const tokenInfoRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`,
  );

  if (!tokenInfoRes.ok) {
    throw new ServiceError(
      "id_token Google không hợp lệ hoặc đã hết hạn",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const tokenInfo = await tokenInfoRes.json();

  if (tokenInfo.error) {
    throw new ServiceError(
      `Google token error: ${tokenInfo.error_description || tokenInfo.error}`,
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const issuer = String(tokenInfo.iss || "");
  if (!GOOGLE_ALLOWED_ISSUERS.has(issuer)) {
    throw new ServiceError(
      "Google token issuer không hợp lệ",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const audience = String(tokenInfo.aud || "");
  const authorizedParty = String(tokenInfo.azp || "");
  if (
    expectedAudience &&
    audience !== expectedAudience &&
    authorizedParty !== expectedAudience
  ) {
    throw new ServiceError(
      "Google token audience không hợp lệ",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  if (expectedNonce && String(tokenInfo.nonce || "") !== expectedNonce) {
    throw new ServiceError(
      "Google token nonce không hợp lệ",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const expMillis = Number(tokenInfo.exp || 0) * 1000;
  if (!Number.isFinite(expMillis) || expMillis <= Date.now()) {
    throw new ServiceError(
      "Google token đã hết hạn",
      401,
      "INVALID_GOOGLE_TOKEN",
    );
  }

  const { email, email_verified, name, picture } = tokenInfo;

  if (!email) {
    throw new ServiceError("Không lấy được email từ Google", 401, "NO_EMAIL");
  }

  if (email_verified !== "true" && email_verified !== true) {
    throw new ServiceError(
      "Email Google chưa được xác thực",
      401,
      "EMAIL_NOT_VERIFIED",
    );
  }

  // Tìm hoặc tạo user
  let user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, profile: true },
  });

  if (!user) {
    // Tạo tài khoản mới với role USER (5) — khách du lịch dùng mobile app
    // ROLES.USER = 5: regular tourist, không phải STAFF nội bộ hay GUEST ẩn danh
    user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
        roleId: ROLES.USER, // 5 — USER role: khách du lịch đã xác thực qua Google
        status: USER_STATUS.ACTIVE,
        emailVerified: true, // Google đã xác thực rồi
        profile: {
          create: {
            fullName: name || email.split("@")[0],
            avatar: picture || null,
          },
        },
      },
      include: { role: true, profile: true },
    });
  } else {
    const shouldUpdateAvatar = picture && !user.profile?.avatar;
    const shouldVerifyEmail = !user.emailVerified;

    if (shouldUpdateAvatar || shouldVerifyEmail) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(shouldVerifyEmail ? { emailVerified: true } : {}),
          ...(shouldUpdateAvatar
            ? {
                profile: {
                  update: {
                    avatar: picture,
                  },
                },
              }
            : {}),
        },
        include: { role: true, profile: true },
      });
    }
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new ServiceError("Tài khoản đã bị cấm", 403, "ACCOUNT_BANNED");
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw new ServiceError(
      "Tài khoản chưa được kích hoạt",
      403,
      "ACCOUNT_INACTIVE",
    );
  }

  // Update lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  });

  const refreshToken = generateRefreshToken();

  // Tạo session
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      deviceId: clientInfo.deviceId || null,
      deviceName: clientInfo.deviceName || "Mobile App (Google)",
      ipAddress: clientInfo.ipAddress || null,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  // Cleanup expired sessions
  await prisma.userSession.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  eventEmitter.emit(EVENTS.USER.LOGGED_IN, { userId: user.id });

  const permissions = await getUserPermissionNames(user.id, user.roleId);
  const { password, ...userWithoutPassword } = user;

  // Refresh user profile (may have been updated)
  const freshProfile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  return {
    user: {
      ...userWithoutPassword,
      profile: freshProfile || user.profile,
      permissions,
    },
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES,
  };
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
  resendVerificationEmailPublic,
  getSessions,
  revokeSession,
  loginWithGoogle,
  verifyAccessToken,
};
