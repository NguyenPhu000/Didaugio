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
};

export default staffApi;
