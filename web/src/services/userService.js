import api from "@/config/api";

export const userService = {
  // Lay danh sach users
  getAll: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response;
  },

  // Lay user theo ID
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  // Tao user moi
  create: async (data) => {
    const response = await api.post("/users", data);
    return response;
  },

  // Cap nhat user
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response;
  },

  // Xoa user
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  // Cap nhat profile
  updateProfile: async (id, data) => {
    const response = await api.put(`/users/${id}/profile`, data);
    return response;
  },
};
