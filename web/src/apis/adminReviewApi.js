import api from "@/constants/api";

const BASE_URL = "/admin/reviews";

const cleanParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

export const getAdminReviews = async (params = {}) => {
  const response = await api.get(BASE_URL, { params: cleanParams(params) });
  return response;
};

export const getAdminReviewStats = async () => {
  const response = await api.get(`${BASE_URL}/stats`);
  return response.data;
};

export const moderateAdminReview = async (id, data) => {
  const response = await api.patch(`${BASE_URL}/${id}/moderation`, data);
  return response.data;
};

export const moderateAdminReviewReply = async (reviewId, replyId, data) => {
  const response = await api.patch(
    `${BASE_URL}/${reviewId}/replies/${replyId}/moderation`,
    data,
  );
  return response.data;
};

export default {
  getAdminReviews,
  getAdminReviewStats,
  moderateAdminReview,
  moderateAdminReviewReply,
};
