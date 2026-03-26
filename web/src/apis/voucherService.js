import api from "@/constants/api";

const BASE_URL = "/business/vouchers";

export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const create = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response;
};

export const update = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response;
};

export const remove = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response;
};

export const getUsageStats = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/usage`);
  return response;
};

export const bulkDeactivate = async (voucherIds) => {
  const response = await api.post(`${BASE_URL}/bulk-deactivate`, { voucherIds });
  return response;
};

export default { getAll, getById, create, update, remove, getUsageStats, bulkDeactivate };
