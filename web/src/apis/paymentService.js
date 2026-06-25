import api from "@/constants/api";

const PAYMENTS_URL = "/payments";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

const paymentService = {
  getById: (id) => api.get(`${PAYMENTS_URL}/${id}`),

  refund: (id, data = {}) => api.post(`${PAYMENTS_URL}/${id}/refund`, data),

  rejectRefund: (id, data = {}) =>
    api.post(`${PAYMENTS_URL}/${id}/reject-refund`, data),

  getAdminPayments: (params = {}) =>
    api.get(`${PAYMENTS_URL}/admin`, { params }),

  getAdminCashflow: (params = {}) =>
    api.get(`${PAYMENTS_URL}/admin/cashflow`, {
      params: sanitizeParams(params),
    }),

  getAdminCashflowSummary: (params = {}) =>
    api.get(`${PAYMENTS_URL}/admin/cashflow/summary`, {
      params: sanitizeParams(params),
    }),
};

export default paymentService;
