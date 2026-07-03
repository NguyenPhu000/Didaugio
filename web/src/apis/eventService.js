import api from "@/constants/api";

const BASE_URL = "/events";

// Lấy danh sách sự kiện
export const getEvents = async (params = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await api.get(BASE_URL, { params: cleanParams });
  return response; // Trả về trực tiếp response { success, data, pagination }
};

// Lấy chi tiết sự kiện
export const getEventById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

// Tạo sự kiện mới
export const createEvent = async (data) => {
  const response = await api.post(BASE_URL, data);
  return response;
};

// Cập nhật sự kiện
export const updateEvent = async (id, data) => {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response;
};

// Xóa sự kiện
export const deleteEvent = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response;
};

// Gửi thông báo khẩn cấp từ BTC
export const updateBroadcast = async (id, broadcastNotice) => {
  const response = await api.put(`${BASE_URL}/${id}/broadcast`, { broadcastNotice });
  return response;
};

// Lấy các chuyến đi của admin để liên kết
export const getAdminTrips = async () => {
  const response = await api.get("/profile/trips");
  return response;
};

// ─── TRIP MANAGEMENT FOR ADMIN ──────────────────────────────────────────────

// Tạo chuyến đi mới
export const createTrip = async (data) => {
  const response = await api.post("/profile/trips", data);
  return response;
};

// Cập nhật thông tin chuyến đi
export const updateTrip = async (id, data) => {
  const response = await api.patch(`/profile/trips/${id}`, data);
  return response;
};

// Xóa chuyến đi
export const deleteTrip = async (id) => {
  const response = await api.delete(`/profile/trips/${id}`);
  return response;
};

// Lấy chi tiết chuyến đi (kèm danh sách destinations)
export const getTripDetail = async (id) => {
  const response = await api.get(`/profile/trips/${id}`);
  return response;
};

// Thêm địa điểm vào lịch trình chuyến đi
export const addDestination = async (tripId, data) => {
  const response = await api.post(`/profile/trips/${tripId}/destinations`, data);
  return response;
};

// Xóa địa điểm khỏi lịch trình chuyến đi
export const removeDestination = async (tripId, destId) => {
  const response = await api.delete(`/profile/trips/${tripId}/destinations/${destId}`);
  return response;
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateBroadcast,
  getAdminTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripDetail,
  addDestination,
  removeDestination,
};
