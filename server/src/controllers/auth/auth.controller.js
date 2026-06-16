import authService from "../../services/auth/auth.service.js";
import { setOffline, setOnline } from "../../utils/onlineManager.js";

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
      data: null,
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
      data: null,
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
    if (req.user?.userId) {
      setOffline(req.user.userId);
    }
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
    if (req.user?.userId) {
      setOffline(req.user.userId);
    }
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

export const pingOnline = async (req, res, next) => {
  try {
    if (req.user?.userId) {
      setOnline(req.user.userId);
    }
    res.json({
      success: true,
      data: null,
      message: "Ping thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  loginGoogle,
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
  pingOnline,
};
