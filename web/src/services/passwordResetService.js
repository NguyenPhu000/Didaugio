import api from "@/config/api";

/**
 * Password Reset Service
 * Quản lý reset mật khẩu
 */
export const passwordResetService = {
  /**
   * Lấy danh sách password resets
   * @param {Object} params - Query params (page, limit, userId, status)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/password-resets", { params });
    return response;
  },

  /**
   * Tạo yêu cầu reset password
   * @param {string} email - User email
   * @returns {Promise}
   */
  create: async (email) => {
    const response = await api.post("/password-resets", { email });
    return response;
  },

  /**
   * Reset password với token
   * @param {Object} data - { token, newPassword }
   * @returns {Promise}
   */
  reset: async (data) => {
    const response = await api.post("/password-resets/reset", data);
    return response;
  },

  /**
   * Lấy thống kê password resets
   * @returns {Promise}
   */
  getStats: async () => {
    const response = await api.get("/password-resets", {
      params: { page: 1, limit: 100 },
    });

    const data = response.data || [];
    const total = response.pagination?.total || data.length;
    const pending = data.filter(
      (item) => !item.usedAt && new Date(item.expiresAt) > new Date()
    ).length;
    const used = data.filter((item) => item.usedAt).length;
    const expired = data.filter(
      (item) => !item.usedAt && new Date(item.expiresAt) <= new Date()
    ).length;

    return {
      total,
      pending,
      used,
      expired,
    };
  },
};
