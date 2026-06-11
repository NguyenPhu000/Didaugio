import api from "@/constants/api";

const PAYMENTS_URL = "/payments";

const paymentService = {
  getById: (id) => api.get(`${PAYMENTS_URL}/${id}`),

  refund: (id, data = {}) => api.post(`${PAYMENTS_URL}/${id}/refund`, data),

  rejectRefund: (id, data = {}) =>
    api.post(`${PAYMENTS_URL}/${id}/reject-refund`, data),

  getAdminPayments: (params = {}) =>
    api.get(`${PAYMENTS_URL}/admin`, { params }),
};

export default paymentService;
