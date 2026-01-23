import api from "@/constants/api";

/**
 * WARD SERVICE
 * API client cho quản lý phường/xã
 */

const BASE_URL = "/wards";

// Get all wards
export const getAllWards = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response; // api interceptor đã unwrap response.data rồi
};

// Get wards by district
export const getWardsByDistrict = async (districtId) => {
  // Backend route is /api/districts/:id/wards
  const response = await api.get(`/districts/${districtId}/wards`);
  return response;
};

// Get ward by ID
export const getWardById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

// Get ward by slug
export const getWardBySlug = async (slug) => {
  const response = await api.get(`${BASE_URL}/slug/${slug}`);
  return response;
};

export default {
  getAllWards,
  getWardsByDistrict,
  getWardById,
  getWardBySlug,
};
