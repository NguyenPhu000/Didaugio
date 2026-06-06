import api from "@/constants/api";

/**
 * DISTRICT SERVICE
 * API client cho quản lý quận/huyện
 */

const BASE_URL = "/districts";

// Get all districts
export const getAllDistricts = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response; // api interceptor đã unwrap response.data rồi
};

// Get district by ID
export const getDistrictById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

// Get district by slug
export const getDistrictBySlug = async (slug) => {
  const response = await api.get(`${BASE_URL}/slug/${slug}`);
  return response;
};

// Get district statistics
export const getDistrictStats = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/stats`);
  return response;
};

export default {
  getAll: getAllDistricts,
  getById: getDistrictById,
  getAllDistricts,
  getDistrictById,
  getDistrictBySlug,
  getDistrictStats,
};
