import api from "@/config/api";

export const roleService = {
  getRoles: async (params = {}) => {
    return await api.get("/roles", { params });
  },

  getRoleById: async (roleId) => {
    return await api.get(`/roles/${roleId}`);
  },

  getRolePermissions: async (roleId) => {
    return await api.get(`/roles/${roleId}/permissions`);
  },

  updateRolePermissions: async (roleId, permissionIds) => {
    return await api.put(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
  },

  getRoleUsers: async (roleId, params = {}) => {
    return await api.get(`/roles/${roleId}/users`, { params });
  },
};
