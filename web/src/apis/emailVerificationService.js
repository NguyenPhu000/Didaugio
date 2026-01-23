import api from "@/constants/api";

/**
 * Email Verification Service - ADMIN ONLY
 * Chỉ dùng để admin xem danh sách và quản lý email verifications
 *
 * Note: End-user sử dụng authService.verifyEmail() và authService.resendVerification()
 */
export const emailVerificationService = {
  /**
   * Lấy danh sách email verifications (Admin only)
   * @param {Object} params - Query params (page, limit, userId, status)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/email-verifications", { params });
    return response;
  },

  /**
   * Tạo email verification token mới (Admin manual trigger)
   * @param {Object} data - { userId, email }
   * @returns {Promise}
   */
  create: async (data) => {
    const response = await api.post("/email-verifications", data);
    return response;
  },

  /**
   * Gửi lại email xác thực (Admin trigger cho user cụ thể)
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  resend: async (userId) => {
    const response = await api.post(`/email-verifications/resend/${userId}`);
    return response;
  },

  /**
   * Xác thực email thủ công (Admin only - không cần token)
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  manualVerify: async (userId) => {
    const response = await api.post(
      `/email-verifications/manual-verify/${userId}`
    );
    return response;
  },

  /**
   * Lấy thống kê email verifications
   * @returns {Promise}
   */
  getStats: async () => {
    const response = await api.get("/email-verifications", {
      params: { page: 1, limit: 100 },
    });

    const data = response.data || [];
    const total = response.pagination?.total || data.length;
    const pending = data.filter(
      (item) => !item.verifiedAt && new Date(item.expiresAt) > new Date()
    ).length;
    const verified = data.filter((item) => item.verifiedAt).length;
    const expired = data.filter(
      (item) => !item.verifiedAt && new Date(item.expiresAt) <= new Date()
    ).length;

    return {
      total,
      pending,
      verified,
      expired,
    };
  },
};
