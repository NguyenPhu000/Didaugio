import authService from "../services/authService.js";

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

  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );
};

/**
 * GET /api/auth/google/web/callback
 * Google redirect về đây với authorization code
 * Đổi code → id_token → tạo JWT → redirect deep link về app
 */
export const googleOAuthCallback = async (req, res, next) => {
  const appScheme = process.env.APP_SCHEME || "didaugio";
  try {
    const { code, error } = req.query;

    if (error || !code) {
      const msg = encodeURIComponent(error || "No authorization code received");
      return res.redirect(`${appScheme}://auth-error?message=${msg}`);
    }

    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      `http://localhost:${process.env.PORT || 8081}/api/auth/google/web/callback`;

    // Exchange authorization code for tokens
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
      const msg = encodeURIComponent(
        tokenData.error_description || "Failed to get token from Google",
      );
      return res.redirect(`${appScheme}://auth-error?message=${msg}`);
    }

    // Reuse existing loginWithGoogle service (verifies id_token, creates session)
    const clientInfo = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      deviceName: req.headers["user-agent"],
    };
    const result = await authService.loginWithGoogle(
      tokenData.id_token,
      clientInfo,
    );

    // Encode user object as base64 JSON for deep link
    // ⚠️ Must encodeURIComponent(base64) — base64 contains +, /, = which break URL parsing
    const userBase64 = Buffer.from(JSON.stringify(result.user)).toString(
      "base64",
    );

    // Redirect to app via custom scheme deep link
    const deepLink =
      `${appScheme}://auth-success` +
      `?accessToken=${encodeURIComponent(result.accessToken)}` +
      `&refreshToken=${encodeURIComponent(result.refreshToken)}` +
      `&user=${encodeURIComponent(userBase64)}`;

    return res.redirect(deepLink);
  } catch (err) {
    next(err);
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
      message: "Dang ky thanh cong",
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
      message: "Dang nhap thanh cong",
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
      message: "Refresh token thanh cong",
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
      message: "Lay thong tin thanh cong",
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
      message: "Lay danh sach session thanh cong",
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

export default {
  register,
  login,
  loginGoogle,
  initiateGoogleOAuth,
  googleOAuthCallback,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  logout,
  logoutAll,
  getSessions,
  revokeSession,
};
