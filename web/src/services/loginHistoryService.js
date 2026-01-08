import api from "@/config/api";

/**
 * Login History Service
 * Quản lý lịch sử đăng nhập / sessions
 */
export const loginHistoryService = {
  /**
   * Lấy danh sách login history
   * @param {Object} params - Query params (page, limit, userId, deviceName, isActive)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/login-history", { params });
    return response;
  },

  /**
   * Lấy chi tiết session
   * @param {number} id - Session ID
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/login-history/${id}`);
    return response;
  },

  /**
   * Vô hiệu hóa một session
   * @param {number} sessionId - Session ID
   * @returns {Promise}
   */
  revoke: async (sessionId) => {
    const response = await api.post("/login-history/revoke", { sessionId });
    return response;
  },

  /**
   * Vô hiệu hóa tất cả sessions của user (trừ session hiện tại)
   * @param {number} userId - User ID
   * @param {number|null} currentSessionId - Current session ID to keep (optional)
   * @returns {Promise}
   */
  revokeAll: async (userId, currentSessionId = null) => {
    const body = {};
    if (currentSessionId) {
      body.currentSessionId = currentSessionId;
    }
    const response = await api.post(
      `/login-history/revoke-all/${userId}`,
      body
    );
    return response;
  },

  /**
   * Lấy thống kê login history
   * @param {Object} params - Filter params
   * @returns {Promise}
   */
  getStats: async (params = {}) => {
    const response = await api.get("/login-history", {
      params: { ...params, page: 1, limit: 100 },
    });

    const data = response.data || [];
    const total = response.pagination?.total || data.length;

    // Count by status using backend computed status field
    const active = data.filter((item) => item.status === "active").length;
    const revoked = data.filter((item) => item.status === "revoked").length;
    const expired = data.filter((item) => item.status === "expired").length;

    // Count by device
    const devices = data.reduce((acc, item) => {
      const deviceName = item.deviceName || "Unknown";
      acc[deviceName] = (acc[deviceName] || 0) + 1;
      return acc;
    }, {});

    // Count by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const dailyLogins = last7Days.reduce((acc, date) => {
      acc[date] = data.filter((item) => item.createdAt.startsWith(date)).length;
      return acc;
    }, {});

    return {
      total,
      active,
      revoked,
      expired,
      devices,
      dailyLogins,
    };
  },

  /**
   * Lấy current session ID từ refresh token
   * @returns {number|null}
   */
  getCurrentSessionId: () => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        return state?.currentSessionId || null;
      }
    } catch (error) {
      console.error("Failed to get current session ID:", error);
    }
    return null;
  },
};
