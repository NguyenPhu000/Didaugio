import api from "@/constants/api";

const BASE_URL = "/notifications";

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response;
  },

  getUnreadCount: async () => {
    const response = await api.get(`${BASE_URL}/unread-count`);
    return response;
  },

  markAsRead: async (id) => {
    const response = await api.put(`${BASE_URL}/${id}/read`);
    return response;
  },

  markAllAsRead: async () => {
    const response = await api.put(`${BASE_URL}/mark-all-read`);
    return response;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response;
  },
};
