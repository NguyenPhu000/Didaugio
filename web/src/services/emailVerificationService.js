import api from "@/config/api";

/**
 * Email Verification Service
 * Quản lý xác thực email
 */
export const emailVerificationService = {
  /**
   * Lấy danh sách email verifications
   * @param {Object} params - Query params (page, limit, userId, status)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/email-verifications", { params });
    return response;
  },

  /**
   * Tạo email verification token mới
   * @param {Object} data - { userId, email }
   * @returns {Promise}
   */
  create: async (data) => {
    const response = await api.post("/email-verifications", data);
    return response;
  },

  /**
   * Xác thực email với token
   * @param {string} token - Verification token
   * @returns {Promise}
   */
  verify: async (token) => {
    const response = await api.post("/email-verifications/verify", { token });
    return response;
  },

  /**
   * Gửi lại email verification
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  resend: async (userId) => {
    const response = await api.post(`/email-verifications/resend/${userId}`);
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
