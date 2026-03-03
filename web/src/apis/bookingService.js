import api from "@/constants/api";

const BASE_URL = "/business/bookings";

export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params });
  return response;
};

export const getStats = async () => {
  const response = await api.get(`${BASE_URL}/stats`);
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const confirm = async (id, data = {}) => {
  const response = await api.put(`${BASE_URL}/${id}/confirm`, data);
  return response;
};

export const cancel = async (id, cancelReason) => {
  const response = await api.put(`${BASE_URL}/${id}/cancel`, { cancelReason });
  return response;
};

export const complete = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/complete`);
  return response;
};

export const markNoShow = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/no-show`);
  return response;
};

export const getQR = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}/qr`);
  return response;
};

export const bulkConfirm = async (bookingIds) => {
  const response = await api.post(`${BASE_URL}/bulk-confirm`, { bookingIds });
  return response;
};

export const bulkCancel = async (bookingIds, cancelReason) => {
  const response = await api.post(`${BASE_URL}/bulk-cancel`, {
    bookingIds,
    cancelReason,
  });
  return response;
};

export default {
  getAll,
  getStats,
  getById,
  confirm,
  cancel,
  complete,
  markNoShow,
  getQR,
  bulkConfirm,
  bulkCancel,
};
