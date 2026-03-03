import api from "@/constants/api";

const BASE_URL = "/business";

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

export const getDashboard = async () => {
  const response = await api.get(`${BASE_URL}/dashboard`);
  return response;
};

export const getRevenue = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/revenue`, { params });
  return response;
};

export const getTopServices = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/top-services`, { params });
  return response;
};

export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const approve = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/approve`);
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
  getRevenue,
  getTopServices,
  getAll,
  getById,
  approve,
  reject,
};
