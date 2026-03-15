/**
 * Business API - Profile, Admin, Dashboard
 * Base: /api/business
 * (Phân biệt với "Service layer" Backend — đây là file gọi HTTP API)
 */
import api from "@/constants/api";

const BASE_URL = "/business";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

// Profile
export const getProfile = async () => {
  const response = await api.get(`${BASE_URL}/profile`);
  return response;
};

export const register = async (data) => {
  const response = await api.post(`${BASE_URL}/register`, data);
  return response;
};

export const updateProfile = async (data) => {
  const response = await api.put(`${BASE_URL}/profile`, data);
  return response;
};

// Dashboard
export const getDashboard = async () => {
  const response = await api.get(`${BASE_URL}/dashboard`);
  return response;
};

// My Places (for service form dropdown)
export const getMyPlaces = async () => {
  const response = await api.get(`${BASE_URL}/places`);
  return response;
};

// Admin
export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params: sanitizeParams(params) });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const approve = async (id, data = {}) => {
  const response = await api.put(`${BASE_URL}/${id}/approve`, data);
  return response;
};

export const reject = async (id, reason) => {
  const response = await api.put(`${BASE_URL}/${id}/reject`, {
    rejectionReason: reason,
  });
  return response;
};

export default {
  getProfile,
  register,
  updateProfile,
  getDashboard,
  getMyPlaces,
  getAll,
  getById,
  approve,
  reject,
};
