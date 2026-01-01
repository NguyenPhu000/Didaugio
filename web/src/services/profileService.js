import api from "@/config/api";

export const profileService = {
  // Lấy thông tin profile
  getProfile: async () => {
    const response = await api.get("/profile");
    return response;
  },

  // Cập nhật profile
  updateProfile: async (data) => {
    const response = await api.put("/profile", data);
    return response;
  },

  // Cập nhật avatar
  updateAvatar: async (avatarUrl) => {
    const response = await api.put("/profile/avatar", { avatarUrl });
    return response;
  },

  // Cập nhật cài đặt thông báo
  updateNotificationSettings: async (settings) => {
    const response = await api.put("/profile/notifications", settings);
    return response;
  },

  // Cập nhật sở thích du lịch
  updateTravelPreferences: async (preferences) => {
    const response = await api.put("/profile/travel-preferences", preferences);
    return response;
  },
};
