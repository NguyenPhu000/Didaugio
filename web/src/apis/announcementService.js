import api from "@/constants/api";

const BASE_URL = "/notifications/announcements";

// Lấy danh sách thông báo hệ thống (admin)
export const getAnnouncements = async (params = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await api.get(BASE_URL, { params: cleanParams });
  return response;
};

// Tạo thông báo hệ thống — gửi ngay đến tất cả user
export const createAnnouncement = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response;
};

// Cập nhật thông báo
export const updateAnnouncement = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response;
};

// Xóa thông báo
export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response;
};

export default {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
