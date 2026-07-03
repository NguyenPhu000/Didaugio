import api from "@/constants/api";

const BASE_URL = "/banners";

// Lấy danh sách banner (admin)
export const getBanners = async (params = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await api.get(BASE_URL, { params: cleanParams });
  return response;
};

// Tạo banner mới
export const createBanner = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response;
};

// Cập nhật banner
export const updateBanner = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response;
};

// Xóa banner
export const deleteBanner = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response;
};

export default {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
