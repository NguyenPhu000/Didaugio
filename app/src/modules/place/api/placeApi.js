import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getPlaceDetailApi = (id) =>
  client.get(ENDPOINTS.places.detail(id));

export const getPlaceDetailBySlugApi = (slug) =>
  client.get(ENDPOINTS.places.detailBySlug(slug));

export const getPlaceReviewsApi = (id, params) =>
  client.get(ENDPOINTS.places.reviews(id), { params });

export const createReviewApi = (id, payload) =>
  client.post(ENDPOINTS.places.reviews(id), payload);
