import api from "@/constants/api";

const unwrapApiData = (response) => response?.data ?? response;

export const permissionService = {
  getPermissions: async (params = {}) => {
    const response = await api.get("/permissions", { params });
    return unwrapApiData(response);
  },

  getPermissionsByModule: async (includeRoles = false) => {
    const response = await api.get("/permissions/by-module", {
      params: { includeRoles },
    });
    return unwrapApiData(response);
  },

  getModules: async () => {
    const response = await api.get("/permissions/modules");
    return unwrapApiData(response);
  },
};
