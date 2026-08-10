import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getPlaceDetailApi = (id, config = {}) =>
  client.get(ENDPOINTS.places.detail(id), {
    ...config,
    params: { ...config.params, client: "mobile" },
  });

export const getPlaceDetailBySlugApi = (slug, config = {}) =>
  client.get(ENDPOINTS.places.detailBySlug(slug), {
    ...config,
    params: { ...config.params, client: "mobile" },
  });

export const getPlaceReviewsApi = (id, params, config = {}) =>
  client.get(ENDPOINTS.places.reviews(id), { ...config, params });

export const getMyPlaceReviewApi = (id, config = {}) =>
  client.get(ENDPOINTS.places.myReview(id), config);

export const createReviewApi = (id, payload) =>
  client.post(ENDPOINTS.places.reviews(id), payload);

export const trackPlaceTelemetryApi = (id, action, deviceType) =>
  client.post(ENDPOINTS.telemetry.place(id), { action, deviceType });
