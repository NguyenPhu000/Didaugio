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

export const getSchedule = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/schedule`, { params });
  return response;
};

export const reschedule = async (id, bookingTime) => {
  const response = await api.patch(`${BASE_URL}/${id}/reschedule`, {
    bookingTime,
  });
  return response;
};

export const quickApprove = async (id) => {
  const response = await api.post(`${BASE_URL}/${id}/quick-approve`);
  return response;
};

export const quickReject = async (id, cancelReason) => {
  const response = await api.post(`${BASE_URL}/${id}/quick-reject`, {
    cancelReason,
  });
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

export const markPaid = async (id, data = {}) => {
  const response = await api.put(`${BASE_URL}/${id}/payment`, {
    status: "paid",
    ...data,
  });
  return response;
};

export const refund = async (id, data = {}) => {
  const response = await api.put(`${BASE_URL}/${id}/refund`, data);
  return response;
};

export default {
  getAll,
  getStats,
  getSchedule,
  reschedule,
  quickApprove,
  quickReject,
  getById,
  confirm,
  cancel,
  complete,
  markNoShow,
  getQR,
  bulkConfirm,
  bulkCancel,
  markPaid,
  refund,
};
