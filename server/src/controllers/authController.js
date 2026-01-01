import authService from "../services/authService.js";

// AUTH CONTROLLER


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
    const result = await authService.forgotPassword(req.body);
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
      parseInt(req.params.sessionId)
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
