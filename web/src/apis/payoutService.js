/**
 * Payout Service — API calls for business earnings & admin payout management.
 * Business endpoints: /api/business/earnings, /api/business/payouts
 * Admin endpoints: /api/admin/payouts
 */
import api from "@/constants/api";

const BUSINESS_BASE = "/business";
const ADMIN_BASE = "/admin/payouts";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

// ── Business Endpoints ──────────────────────────────────────────────────────

/** Current balance: available, pending, withdrawn */
export const getEarnings = async () => {
  const response = await api.get(`${BUSINESS_BASE}/earnings`);
  return response;
};

/** Paginated payout history for current business */
export const getPayoutHistory = async (params = {}) => {
  const response = await api.get(`${BUSINESS_BASE}/payouts`, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Create a new payout request */
export const createPayoutRequest = async (data) => {
  const response = await api.post(`${BUSINESS_BASE}/payouts`, data);
  return response;
};

/** Cancel a pending payout request */
export const cancelPayoutRequest = async (id) => {
  const response = await api.post(`${BUSINESS_BASE}/payouts/${id}/cancel`);
  return response;
};

// ── Admin Endpoints ─────────────────────────────────────────────────────────

/** All payouts with filters (status, date range, search) */
export const getAdminPayouts = async (params = {}) => {
  const response = await api.get(ADMIN_BASE, {
    params: sanitizeParams(params),
  });
  return response;
};

/** Approve or reject a payout request */
export const reviewPayout = async (id, action, reason) => {
  const response = await api.post(`${ADMIN_BASE}/${id}/${action}`, {
    reason,
  });
  return response;
};

/** Mark payout as processing */
export const processPayout = async (id) => {
  const response = await api.post(`${ADMIN_BASE}/${id}/process`);
  return response;
};

/** Confirm transfer completed */
export const confirmPayout = async (id, transferRef) => {
  const response = await api.post(`${ADMIN_BASE}/${id}/transfer`, {
    transferRef,
  });
  return response;
};

/** Dashboard stats for admin payout overview */
export const getPayoutStats = async () => {
  const response = await api.get(`${ADMIN_BASE}/stats`);
  return response;
};

export default {
  getEarnings,
  getPayoutHistory,
  createPayoutRequest,
  cancelPayoutRequest,
  getAdminPayouts,
  reviewPayout,
  processPayout,
  confirmPayout,
  getPayoutStats,
};
