import api from "@/config/api";

export const permissionService = {
  getPermissions: async (params = {}) => {
    return await api.get("/permissions", { params });
  },

  getPermissionsByModule: async (includeRoles = false) => {
    return await api.get("/permissions/by-module", {
      params: { includeRoles },
    });
  },

  getModules: async () => {
    return await api.get("/permissions/modules");
  },
};
