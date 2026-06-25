/**
 * Revenue Service — API calls for revenue analytics & transactions.
 * Base: /api/business/revenue
 */
import api from "@/constants/api";

const BASE_URL = "/business/revenue";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

/** Overview stats: GMV, net revenue, platform fees, refunds + change % */
export const getRevenueOverview = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/overview`, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Timeline data for charts (daily/weekly/monthly) */
export const getRevenueTimeline = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/timeline`, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Revenue breakdown by place */
export const getRevenueByPlace = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/by-place`, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Paginated transaction list */
export const getTransactions = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/transactions`, {
    params: sanitizeParams(params),
  });
  return response;
};

export const getCashflow = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/cashflow`, {
    params: sanitizeParams(params),
  });
  return response;
};

export const getCashflowSummary = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/cashflow/summary`, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Export revenue report as CSV blob */
export const exportRevenue = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/export`, {
    params: sanitizeParams(params),
    responseType: "blob",
  });
  return response;
};

export default {
  getRevenueOverview,
  getRevenueTimeline,
  getRevenueByPlace,
  getTransactions,
  getCashflow,
  getCashflowSummary,
  exportRevenue,
};
