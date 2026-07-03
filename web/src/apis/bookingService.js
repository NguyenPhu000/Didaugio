import api from "@/constants/api";

const BUSINESS_BOOKINGS_URL = "/business/bookings";
const PUBLIC_BOOKINGS_URL = "/booking/public";
const BOOKING_VERIFY_URL = "/bookings/verify";

// ─── Business Booking APIs ───────────────────────────────────────────────────────

export const getAll = async (params = {}) => {
  const response = await api.get(BUSINESS_BOOKINGS_URL, { params });
  return response;
};

export const getStats = async () => {
  const response = await api.get(`${BUSINESS_BOOKINGS_URL}/stats`);
  return response;
};

export const getSchedule = async (params = {}) => {
  const response = await api.get(`${BUSINESS_BOOKINGS_URL}/schedule`, { params });
  return response;
};

export const reschedule = async (id, bookingTime, data = {}) => {
  const response = await api.patch(`${BUSINESS_BOOKINGS_URL}/${id}/reschedule`, {
    bookingTime,
    ...data,
  });
  return response;
};

export const quickApprove = async (id) => {
  const response = await api.post(`${BUSINESS_BOOKINGS_URL}/${id}/quick-approve`);
  return response;
};

export const quickReject = async (id, cancelReason, data = {}) => {
  const response = await api.post(`${BUSINESS_BOOKINGS_URL}/${id}/quick-reject`, {
    cancelReason,
    ...data,
  });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BUSINESS_BOOKINGS_URL}/${id}`);
  return response;
};

export const confirm = async (id, data = {}) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/confirm`, data);
  return response;
};

export const cancel = async (id, cancelReason) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/cancel`, { cancelReason });
  return response;
};

export const complete = async (id) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/complete`);
  return response;
};

export const markNoShow = async (id) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/no-show`);
  return response;
};

export const getQR = async (id) => {
  const response = await api.get(`${BUSINESS_BOOKINGS_URL}/${id}/qr`);
  return response;
};

export const bulkConfirm = async (bookingIds) => {
  const response = await api.post(`${BUSINESS_BOOKINGS_URL}/bulk-confirm`, { bookingIds });
  return response;
};

export const bulkCancel = async (bookingIds, cancelReason) => {
  const response = await api.post(`${BUSINESS_BOOKINGS_URL}/bulk-cancel`, {
    bookingIds,
    cancelReason,
  });
  return response;
};

export const markPaid = async (id, data = {}) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/payment`, {
    status: "paid",
    ...data,
  });
  return response;
};

export const refund = async (id, data = {}) => {
  const response = await api.put(`${BUSINESS_BOOKINGS_URL}/${id}/refund`, data);
  return response;
};

// ─── Public Booking APIs ────────────────────────────────────────────────────────

/**
 * Get public booking details by booking code
 */
export const getPublicBookingByCode = async (bookingCode) => {
  const response = await api.get(`${PUBLIC_BOOKINGS_URL}/${bookingCode}`);
  return response;
};

export const verifyQR = async (payload) => {
  const response = await api.post(BOOKING_VERIFY_URL, payload);
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
  getPublicBookingByCode,
  verifyQR,
};
