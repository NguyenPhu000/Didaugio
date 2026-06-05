import api from "@/constants/api";

export const authService = {
  // Đăng ký
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response;
  },

  // Đăng nhập
  login: async (identifier, password, deviceInfo = {}) => {
    const normalizedIdentifier = String(identifier || "").trim();
    const isEmailIdentifier = /\S+@\S+\.\S+/.test(normalizedIdentifier);

    const payload = {
      password,
      ...deviceInfo,
      ...(isEmailIdentifier
        ? { email: normalizedIdentifier.toLowerCase() }
        : { username: normalizedIdentifier }),
    };

    const response = await api.post("/auth/login", payload);
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

  // Đăng nhập Google (id_token flow, khớp với server POST /api/auth/google)
  googleLogin: async (idToken) => {
    const response = await api.post("/auth/google", {
      idToken,
    });
    return response;
  },
};
