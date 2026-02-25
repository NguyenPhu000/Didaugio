import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Get place detail by id (auth optional) */
export const getPlaceDetailApi = (id) =>
  client.get(ENDPOINTS.app.placeDetail(id));

/** Get paginated reviews for a place */
export const getPlaceReviewsApi = (id, params) =>
  client.get(ENDPOINTS.app.placeReviews(id), { params });

/** Create or update review for a place */
export const createReviewApi = (id, payload) =>
  client.post(ENDPOINTS.app.placeReviews(id), payload);
