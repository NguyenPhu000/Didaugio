import authService from "../services/authService.js";
import { ERROR_CODES } from "../config/messages.js";
import crypto from "crypto";

const OAUTH_RESULT_TTL_MS = 2 * 60 * 1000;
const oauthResultStore = new Map();

function cleanupExpiredOAuthResults() {
  const now = Date.now();
  for (const [code, entry] of oauthResultStore.entries()) {
    if (!entry?.expiresAt || entry.expiresAt <= now) {
      oauthResultStore.delete(code);
    }
  }
}

function createOAuthResultCode(payload) {
  cleanupExpiredOAuthResults();
  const code = crypto.randomBytes(24).toString("hex");
  oauthResultStore.set(code, {
    payload,
    expiresAt: Date.now() + OAUTH_RESULT_TTL_MS,
  });
  return code;
}

function consumeOAuthResultCode(code) {
  cleanupExpiredOAuthResults();
  const entry = oauthResultStore.get(code);
  if (!entry) return null;
  oauthResultStore.delete(code);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.payload;
}

// AUTH CONTROLLER

/**
 * POST /api/auth/google
 * Đăng nhập bằng Google OAuth id_token
 * Nhận id_token từ mobile app, xác thực với Google và trả về JWT session
 */
export const loginGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceId: req.headers["x-device-id"],
      deviceName: req.headers["x-device-name"] || req.headers["user-agent"],
    };
    const result = await authService.loginWithGoogle(idToken, clientInfo);
    res.json({
      success: true,
      data: result,
      message: "Dang nhap Google thanh cong",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/google/web
 * Bắt đầu Google OAuth 2.0 Authorization Code Flow (server-side)
 * Browser redirect → Google sign-in page
 */
export const initiateGoogleOAuth = (req, res) => {
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 8081}/api/auth/google/web/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

/**
 * GET /api/auth/google/web/callback
 * Google redirect về đây với authorization code
 * Đổi code → id_token → tạo JWT → redirect deep link về app
 */
export const googleOAuthCallback = async (req, res) => {
  const appScheme = process.env.APP_SCHEME || "didaugio";

  const redirectError = (message) => {
    const msg = encodeURIComponent(message || "Đăng nhập thất bại");
    return res.redirect(`${appScheme}://auth-error?message=${msg}`);
  };

  try {
    const { code, error } = req.query;

    if (error || !code) {
      return redirectError(error || "No authorization code received");
    }

    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      `http://localhost:${process.env.PORT || 8081}/api/auth/google/web/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      return redirectError(
        tokenData.error_description || "Failed to get token from Google",
      );
    }

    const clientInfo = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      deviceName: req.headers["user-agent"],
    };
    const result = await authService.loginWithGoogle(
      tokenData.id_token,
      clientInfo,
    );

    const legacyTokenRedirect =
      process.env.OAUTH_LEGACY_TOKEN_REDIRECT === "true";

    if (legacyTokenRedirect) {
      const userBase64 = Buffer.from(JSON.stringify(result.user)).toString(
        "base64",
      );

      const deepLink =
        `${appScheme}://auth-success` +
        `?accessToken=${encodeURIComponent(result.accessToken)}` +
        `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
        `&user=${encodeURIComponent(userBase64)}`;

      return res.redirect(deepLink);
    }

    const authCode = createOAuthResultCode(result);
    const deepLink = `${appScheme}://auth-success?authCode=${encodeURIComponent(authCode)}`;
    return res.redirect(deepLink);
  } catch (err) {
    console.error("[Google OAuth Callback]", err.message);
    return redirectError(err.message);
  }
};

/**
 * POST /api/auth/google/exchange-result
 * Đổi authCode một lần lấy kết quả đăng nhập Google (access/refresh token + user)
 */
export const exchangeOAuthResult = async (req, res, next) => {
  try {
    const { authCode } = req.body || {};
    if (!authCode || typeof authCode !== "string") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "authCode là bắt buộc",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const payload = consumeOAuthResultCode(authCode);
    if (!payload) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "authCode không hợp lệ hoặc đã hết hạn",
        errorCode: ERROR_CODES.INVALID_TOKEN,
      });
    }

    return res.json({
      success: true,
      data: payload,
      message: "Đổi authCode thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Đăng ký tài khoản
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: "Đăng ký thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập
 */
export const login = async (req, res, next) => {
  try {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceId: req.headers["x-device-id"],
      deviceName: req.headers["x-device-name"] || req.headers["user-agent"],
    };

    const result = await authService.login(req.body, clientInfo);
    res.json({
      success: true,
      data: result,
      message: "Đăng nhập thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshAccessToken(req.body);
    res.json({
      success: true,
      data: result,
      message: "Refresh token thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.json({
      success: true,
      data: user,
      message: "Lấy thông tin thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu - gửi email reset
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await authService.forgotPassword(req.body, ipAddress);
    res.json({
      success: true,
      data: result.resetToken ? { resetToken: result.resetToken } : null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu
 */
export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-email
 * Xác thực email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification
 * Gửi lại email xác thực
 */
export const resendVerification = async (req, res, next) => {
  try {
    const result = await authService.resendVerificationEmail(req.user.userId);
    res.json({
      success: true,
      data: result.verificationToken
        ? { verificationToken: result.verificationToken }
        : null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-verification-public
 * Gửi lại email xác thực (không yêu cầu đăng nhập)
 */
export const resendVerificationPublic = async (req, res, next) => {
  try {
    const result = await authService.resendVerificationEmailPublic(req.body);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Đăng xuất (xóa session hiện tại)
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout-all
 * Đăng xuất tất cả thiết bị
 */
export const logoutAll = async (req, res, next) => {
  try {
    const result = await authService.logoutAll(req.user.userId);
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/sessions
 * Lấy danh sách session đang hoạt động
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getSessions(req.user.userId);
    res.json({
      success: true,
      data: sessions,
      message: "Lấy danh sách session thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/auth/sessions/:sessionId
 * Xóa session cụ thể
 */
export const revokeSession = async (req, res, next) => {
  try {
    const result = await authService.revokeSession(
      req.user.userId,
      parseInt(req.params.sessionId),
    );
    res.json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const exchangeGoogleCode = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "code and redirectUri are required",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      return res.status(400).json({
        success: false,
        data: null,
        message:
          tokenData.error_description ||
          "Không thể đổi code lấy token từ Google",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const clientInfo = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      deviceId: req.headers["x-device-id"],
      deviceName: req.headers["x-device-name"] || req.headers["user-agent"],
    };

    const result = await authService.loginWithGoogle(
      tokenData.id_token,
      clientInfo,
    );
    res.json({
      success: true,
      data: result,
      message: "Đăng nhập Google thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  loginGoogle,
  exchangeGoogleCode,
  exchangeOAuthResult,
  initiateGoogleOAuth,
  googleOAuthCallback,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  resendVerificationPublic,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
};
