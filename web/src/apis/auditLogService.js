import api from "@/constants/api";
import i18n from "@/i18n";

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
      // CRUD cơ bản
      "CREATE",
      "UPDATE",
      "DELETE",
      // Người dùng & phân quyền
      "UPDATE_ROLE",
      "UPDATE_PERMISSIONS",
      "ASSIGN_TAGS",
      // Địa điểm
      "SUBMIT_REVIEW",
      "APPROVE",
      "REJECT",
      "UPDATE_STATUS",
      "TOGGLE_FEATURED",
      // Doanh nghiệp
      "SUSPEND",
      "REACTIVATE",
      "TERMINATE",
      "SIGN_CONTRACT",
      // Dịch vụ
      "UPDATE_DEPOSIT_CONFIG",
      // Đặt chỗ
      "CONFIRM",
      "CANCEL",
      "COMPLETE",
      "NO_SHOW",
      "MARK_PAID",
      "REFUND",
      "BULK_CONFIRM",
      "BULK_CANCEL",
      // Voucher
      "BULK_DEACTIVATE",
      // Đánh giá
      "REPLY",
      "UPDATE_REPLY",
      "MODERATE_REPLY",
      "DELETE_REPLY",
      "MODERATE_REVIEW",
      "ADMIN_MODERATE_REVIEW_REPLY",
    ];
  },

  /**
   * Lấy danh sách tables có trong hệ thống
   * @returns {Array}
   */
  getTableNames: () => {
    return [
      "users",
      "places",
      "businesses",
      "business_services",
      "categories",
      "tags",
      "bookings",
      "vouchers",
      "reviews",
      "review_replies",
      "roles",
      "permissions",
      "role_permissions",
      "user_permissions",
    ];
  },

  /**
   * Lấy label tiếng Việt cho action
   * @param {string} action
   * @returns {string}
   */
  getActionLabel: (action) => {
    const t = i18n.t;
    const keyMap = {
      CREATE: "create",
      UPDATE: "update",
      DELETE: "delete",
      LOGIN: "login",
      LOGOUT: "logout",
      APPROVE: "approve",
      REJECT: "reject",
      SUSPEND: "suspend",
      ACTIVATE: "activate",
      EXPORT: "export",
      IMPORT: "import",
      ASSIGN: "assign",
      UNASSIGN: "unassign",
      BOOKMARK: "bookmark",
      UNBOOKMARK: "unbookmark",
      FEATURE: "feature",
      UNFEATURE: "unfeature",
      LOCK: "lock",
      UNLOCK: "unlock",
      VERIFY: "verify",
      SIGN: "sign",
      CANCEL: "cancel",
      REFUND: "refund",
      PAYOUT: "payout",
      MODERATE: "moderate",
      BROADCAST: "broadcast",
    };
    const key = keyMap[action];
    return key ? t(`admin.auditLabels.actions.${key}`) : action;
  },

  /**
   * Lấy label tiếng Việt cho bảng
   * @param {string} tableName
   * @returns {string}
   */
  getTableLabel: (tableName) => {
    const t = i18n.t;
    const keyMap = {
      user: "user",
      place: "place",
      business: "business",
      booking: "booking",
      review: "review",
      category: "category",
      tag: "tag",
      service: "service",
      voucher: "voucher",
      notification: "notification",
      setting: "setting",
      role: "role",
      payout: "payout",
      trip: "trip",
      event: "event",
    };
    const key = keyMap[tableName];
    return key ? t(`admin.auditLabels.tables.${key}`) : tableName;
  },

  /**
   * Lấy màu cho action badge
   * @param {string} action
   * @returns {string}
   */
  getActionColor: (action) => {
    const colors = {
      CREATE: "bg-emerald-100 text-emerald-800 border-emerald-300",
      UPDATE: "bg-blue-100 text-blue-800 border-blue-300",
      DELETE: "bg-red-100 text-red-800 border-red-300",
      UPDATE_ROLE: "bg-orange-100 text-orange-800 border-orange-300",
      UPDATE_PERMISSIONS: "bg-purple-100 text-purple-800 border-purple-300",
      ASSIGN_TAGS: "bg-cyan-100 text-cyan-800 border-cyan-300",
      APPROVE: "bg-green-100 text-green-800 border-green-300",
      REJECT: "bg-red-100 text-red-800 border-red-300",
      SUBMIT_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
      SUSPEND: "bg-amber-100 text-amber-800 border-amber-300",
      REACTIVATE: "bg-teal-100 text-teal-800 border-teal-300",
      TERMINATE: "bg-gray-200 text-gray-800 border-gray-400",
      CONFIRM: "bg-green-100 text-green-800 border-green-300",
      CANCEL: "bg-red-100 text-red-800 border-red-300",
      COMPLETE: "bg-blue-100 text-blue-800 border-blue-300",
      NO_SHOW: "bg-orange-100 text-orange-800 border-orange-300",
      MARK_PAID: "bg-emerald-100 text-emerald-800 border-emerald-300",
      REFUND: "bg-amber-100 text-amber-800 border-amber-300",
      MODERATE_REVIEW: "bg-indigo-100 text-indigo-800 border-indigo-300",
      MODERATE_REPLY: "bg-indigo-100 text-indigo-800 border-indigo-300",
    };
    return colors[action] || "bg-gray-100 text-gray-700 border-gray-300";
  },

  /**
   * Lấy màu cho role badge
   * @param {string} roleName
   * @returns {string}
   */
  getRoleColor: (roleName) => {
    const colors = {
      super_admin: "bg-red-100 text-red-800 border-red-300",
      admin: "bg-purple-100 text-purple-800 border-purple-300",
      business: "bg-blue-100 text-blue-800 border-blue-300",
      staff: "bg-cyan-100 text-cyan-800 border-cyan-300",
      user: "bg-gray-100 text-gray-800 border-gray-300",
      guest: "bg-gray-50 text-gray-500 border-gray-200",
    };
    return colors[roleName] || "bg-gray-100 text-gray-700 border-gray-300";
  },
};

export default auditLogService;
