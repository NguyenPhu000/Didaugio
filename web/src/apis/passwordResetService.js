import api from "@/constants/api";

/**
 * Password Reset Service - ADMIN ONLY
 * Chỉ dùng để admin xem danh sách password resets
 *
 * Note: End-user sử dụng authService.forgotPassword() và authService.resetPassword()
 */
export const passwordResetService = {
  /**
   * Lấy danh sách password resets (Admin only)
   * @param {Object} params - Query params (page, limit, userId, status)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/password-resets", { params });
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
