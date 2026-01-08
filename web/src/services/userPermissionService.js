import api from "../config/api";

export const userPermissionService = {
  // Lấy danh sách users trong role
  getUsersByRole: async (roleId, params) => {
    const response = await api.get(`/roles/${roleId}/users`, { params });
    return response;
  },

  // Lấy quyền của user
  getUserPermissions: async (userId) => {
    const response = await api.get(`/users/${userId}/permissions`);
    return response;
  },

  // Cập nhật quyền cho user
  updateUserPermissions: async (userId, permissionIds) => {
    const response = await api.put(`/users/${userId}/permissions`, {
      permissionIds,
    });
    return response;
  },

  // Cập nhật quyền cho nhiều users
  bulkUpdateUserPermissions: async (userIds, permissionIds) => {
    const response = await api.post(`/users/permissions/bulk`, {
      userIds,
      permissionIds,
    });
    return response;
  },

  // Xóa quyền custom của user
  removeUserCustomPermissions: async (userId) => {
    const response = await api.delete(`/users/${userId}/permissions`);
    return response;
  },
};
