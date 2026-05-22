import api from "@/constants/api";

const BASE_URL = "/business/staff";
const PUBLIC_BASE_URL = "/staff/invite";

const sanitizeParams = (params) => {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
};

export const staffInvitationApi = {
  /**
   * Lấy danh sách vai trò khả dụng
   */
  getRoles: () => api.get("/business/roles"),

  /**
   * Tạo invitation link (Owner)
   */
  create: (data) => api.post(`${BASE_URL}/invite`, data),

  /**
   * Kiểm tra token khi staff click link (Public)
   */
  validateToken: (token) => api.get(`${PUBLIC_BASE_URL}/${token}`),

  /**
   * Hoàn tất đăng ký staff (Public)
   */
  accept: (data) => api.post(`${PUBLIC_BASE_URL}/accept`, data),

  /**
   * Lấy danh sách invitations (Owner)
   */
  getAll: (params) =>
    api.get(`${BASE_URL}/invitations`, { params: sanitizeParams(params) }),

  /**
   * Thu hồi invitation (Owner)
   */
  revoke: (id) => api.post(`${BASE_URL}/invite/${id}/revoke`),
};

export default staffInvitationApi;
