import api from "@/constants/api";

export const authService = {
  // Đăng ký
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response;
  },

  // Đăng nhập
  login: async (email, password, deviceInfo = {}) => {
    const response = await api.post("/auth/login", {
      email,
      password,
      ...deviceInfo,
    });
    return response;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response;
  },

  // Lấy thông tin user hiện tại
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response;
  },

  // Đổi mật khẩu
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response;
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response;
  },

  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post("/auth/reset-password", {
      token,
      newPassword,
      confirmPassword,
    });
    return response;
  },

  // Xác thực email
  verifyEmail: async ({ token }) => {
    const response = await api.post("/auth/verify-email", { token });
    return response;
  },

  // Gửi lại email xác thực
  resendVerification: async () => {
    const response = await api.post("/auth/resend-verification");
    return response;
  },

  // Gửi lại email xác thực (public - chưa đăng nhập)
  resendVerificationPublic: async (email) => {
    const response = await api.post("/auth/resend-verification-public", {
      email,
    });
    return response;
  },

  // Đăng xuất
  logout: async (refreshToken, config = {}) => {
    const response = await api.post("/auth/logout", { refreshToken }, config);
    return response;
  },

  // Đăng xuất tất cả thiết bị
  logoutAll: async () => {
    const response = await api.post("/auth/logout-all");
    return response;
  },

  // Lấy danh sách session
  getSessions: async () => {
    const response = await api.get("/auth/sessions");
    return response;
  },

  // Xóa session cụ thể
  revokeSession: async (sessionId) => {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response;
  },

  // Đăng nhập Google (exchange code)
  googleLogin: async (code, redirectUri) => {
    const response = await api.post("/auth/google/exchange", {
      code,
      redirectUri,
    });
    return response;
  },
};
