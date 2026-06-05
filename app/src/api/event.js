import apiClient from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Lấy danh sách sự kiện (có hỗ trợ filter, pagination qua params)
 * @param {object} params 
 */
export const getEventsApi = async (params = {}) => {
  const response = await apiClient.get(ENDPOINTS.events.list, { params });
  return response;
};

/**
 * Lấy chi tiết sự kiện
 * @param {number|string} id 
 */
export const getEventDetailApi = async (id) => {
  const response = await apiClient.get(ENDPOINTS.events.detail(id));
  return response;
};

/**
 * Tham gia sự kiện (clone Trip & destinations)
 * @param {number|string} id 
 */
export const joinEventApi = async (id) => {
  const response = await apiClient.post(ENDPOINTS.events.join(id));
  return response;
};

/**
 * Ping vị trí neon ẩn danh
 * @param {number|string} id 
 * @param {{ latitude: number, longitude: number, destinationId?: number }} payload 
 */
export const pingEventApi = async (id, payload) => {
  const response = await apiClient.post(ENDPOINTS.events.ping(id), payload);
  return response;
};

/**
 * Đăng khoảnh khắc check-in ẩn danh (dạng base64)
 * @param {number|string} id 
 * @param {{ image: string, destinationId: number, comment?: string }} payload 
 */
export const createMomentApi = async (id, payload) => {
  const response = await apiClient.post(ENDPOINTS.events.moments(id), payload);
  return response;
};

/**
 * Lấy các khoảnh khắc check-in ẩn danh của sự kiện
 * @param {number|string} id 
 * @param {{ destinationId?: number }} params 
 */
export const getMomentsApi = async (id, params = {}) => {
  const response = await apiClient.get(ENDPOINTS.events.moments(id), { params });
  return response;
};

/**
 * Xóa khoảnh khắc
 * @param {number|string} momentId 
 */
export const deleteMomentApi = async (momentId) => {
  const response = await apiClient.delete(ENDPOINTS.events.deleteMoment(momentId));
  return response;
};
