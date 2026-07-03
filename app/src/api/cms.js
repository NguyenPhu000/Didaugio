import apiClient from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Lấy toàn bộ CMS data cho Explore screen trong 1 request
 */
export const getCmsExploreLandingApi = () =>
  apiClient.get(ENDPOINTS.cms.exploreLanding);

/**
 * Lấy danh sách banner marketing đang active
 */
export const getCmsBannersApi = () =>
  apiClient.get(ENDPOINTS.cms.banners);

/**
 * Lấy địa điểm nổi bật
 * @param {{ limit?: number }} params
 */
export const getCmsFeaturedPlacesApi = (params = {}) =>
  apiClient.get(ENDPOINTS.cms.featuredPlaces, { params });

/**
 * Lấy lịch trình mẫu công khai
 * @param {{ limit?: number }} params
 */
export const getCmsSampleTripsApi = (params = {}) =>
  apiClient.get(ENDPOINTS.cms.sampleTrips, { params });

/**
 * Lấy thông báo hệ thống đã gửi
 * @param {{ limit?: number }} params
 */
export const getCmsAnnouncementsApi = (params = {}) =>
  apiClient.get(ENDPOINTS.cms.announcements, { params });
