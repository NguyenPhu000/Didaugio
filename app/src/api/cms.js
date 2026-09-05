import apiClient from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Lấy toàn bộ CMS data cho Explore screen trong 1 request
 */
export const getCmsExploreLandingApi = (config = {}) =>
  apiClient.get(ENDPOINTS.cms.exploreLanding, config);

/**
 * Lấy danh sách banner marketing đang active
 */
export const getCmsBannersApi = (config = {}) =>
  apiClient.get(ENDPOINTS.cms.banners, config);

/**
 * Lấy địa điểm nổi bật
 * @param {{ limit?: number }} params
 */
export const getCmsFeaturedPlacesApi = (params = {}, config = {}) =>
  apiClient.get(ENDPOINTS.cms.featuredPlaces, { ...config, params });

/**
 * Lấy lịch trình mẫu công khai
 * @param {{ limit?: number }} params
 */
export const getCmsSampleTripsApi = (params = {}, config = {}) =>
  apiClient.get(ENDPOINTS.cms.sampleTrips, { ...config, params });

/**
 * Lấy thông báo hệ thống đã gửi
 * @param {{ limit?: number }} params
 */
export const getCmsAnnouncementsApi = (params = {}, config = {}) =>
  apiClient.get(ENDPOINTS.cms.announcements, { ...config, params });
