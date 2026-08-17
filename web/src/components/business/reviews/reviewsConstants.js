import api from "@/constants/api";

const REVIEW_API = "/business/reviews";

export const reviewApi = {
  list: (params) => api.get(REVIEW_API, { params }),
  getStats: () => api.get(`${REVIEW_API}/stats`),
  reply: (reviewId, content) => api.post(`${REVIEW_API}/${reviewId}/reply`, { content }),
  updateReply: (reviewId, replyId, content) => api.put(`${REVIEW_API}/${reviewId}/replies/${replyId}`, { content }),
  deleteReply: (reviewId, replyId) => api.delete(`${REVIEW_API}/${reviewId}/replies/${replyId}`),
  moderateReply: (reviewId, replyId, status) => api.patch(`${REVIEW_API}/${reviewId}/replies/${replyId}/moderation`, { status }),
};

export const QUICK_REPLY_TEMPLATES = [
  "Cảm ơn quý khách đã ghé thăm và ủng hộ cơ sở! Rất mong được phục vụ quý khách lần tới.",
  "Rất tiếc về trải nghiệm chưa trọn vẹn của bạn. Cơ sở đã ghi nhận và cải thiện dịch vụ ngay lập tức.",
  "Cảm ơn đánh giá tích cực của bạn! Chúc bạn luôn có những chuyến đi Cần Thơ tuyệt vời.",
];
