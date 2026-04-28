import api from "@/constants/api";

/**
 * Audit Log Service
 * Quản lý lịch sử hoạt động
 */
export const auditLogService = {
  /**
   * Lấy danh sách audit logs
   * @param {Object} params - Query params (page, limit, userId, action, tableName, startDate, endDate)
   * @returns {Promise}
   */
  getAll: async (params = {}) => {
    const response = await api.get("/audit-logs", { params });
    return response;
  },

  /**
   * Lấy chi tiết audit log
   * @param {number} id - Audit log ID
   * @returns {Promise}
   */
  getById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response;
  },

  /**
   * Lấy thống kê audit logs
   * @param {Object} params - Filter params
   * @returns {Promise}
   */
  getStats: async (params = {}) => {
    const response = await api.get("/audit-logs", {
      params: { ...params, page: 1, limit: 100 },
    });

    const data = response.data || [];
    const total = response.pagination?.total || data.length;

    // Count by action
    const actions = data.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {});

    // Count by table
    const tables = data.reduce((acc, item) => {
      acc[item.tableName] = (acc[item.tableName] || 0) + 1;
      return acc;
    }, {});

    // Count by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const dailyCount = last7Days.reduce((acc, date) => {
      acc[date] = data.filter((item) => item.createdAt.startsWith(date)).length;
      return acc;
    }, {});

    return {
      total,
      actions,
      tables,
      dailyCount,
    };
  },

  /**
   * Lấy danh sách actions có trong hệ thống
   * @returns {Array}
   */
  getActionTypes: () => {
    return [
      "CREATE",
      "UPDATE",
      "DELETE",
      "UPDATE_ROLE",
      "UPDATE_PERMISSIONS",
      "ASSIGN_TAGS",
    ];
  },

  /**
   * Lấy danh sách tables có trong hệ thống (theo schema.prisma)
   * @returns {Array}
   */
  getTableNames: () => {
    return [
      "users",
      "user_profiles",
      "user_sessions",
      "roles",
      "permissions",
      "role_permissions",
      "user_permissions",
      "categories",
      "tags",
      "category_tags",
      "email_verifications",
      "password_resets",
      "audit_logs",
      "businesses",
      "places",
    ];
  },
};

export default auditLogService;
