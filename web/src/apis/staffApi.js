import api from "@/constants/api";

const BASE_URL = "/business/staff";

const sanitizeParams = (params) => {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
};

export const staffApi = {
  /**
   * Get all staff for the current business
   */
  getAll: (params) =>
    api.get(BASE_URL, { params: sanitizeParams(params) }),

  /**
   * Get staff detail by ID
   */
  getById: (id) => api.get(`${BASE_URL}/${id}`),

  /**
   * Create a new staff account
   */
  create: (data) => api.post(BASE_URL, data),

  /**
   * Update staff info (fullName, phone, status)
   */
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),

  /**
   * Remove staff from business
   */
  remove: (id) => api.delete(`${BASE_URL}/${id}`),

  /**
   * Reset staff password
   */
  resetPassword: (id, newPassword) =>
    api.post(`${BASE_URL}/${id}/reset-password`, { newPassword }),

  /**
   * Deactivate staff account
   */
  deactivate: (id) => api.post(`${BASE_URL}/${id}/deactivate`),

  /**
   * Activate staff account
   */
  activate: (id) => api.post(`${BASE_URL}/${id}/activate`),

  /**
   * Get aggregated staff stats for the current business
   */
  getStats: () => api.get(`${BASE_URL}/stats`),

  /**
   * Get paginated audit log for business staff actions
   */
  getAuditLog: (params) =>
    api.get(`${BASE_URL}/audit-log`, { params: sanitizeParams(params) }),

  /**
   * Bulk assign roles to multiple staff members
   */
  bulkAssignRole: (staffIds, roleIds) =>
    api.post(`${BASE_URL}/bulk-assign-role`, { staffIds, roleIds }),

  /**
   * Get individual staff activity log
   */
  getActivity: (id, params) =>
    api.get(`${BASE_URL}/${id}/activity`, { params: sanitizeParams(params) }),
};

export default staffApi;
