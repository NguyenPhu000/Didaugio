import api from "@/constants/api";

const SUBSCRIPTIONS_URL = "/subscriptions";
const ADMIN_SUBSCRIPTIONS_URL = "/admin/subscriptions";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

// ── Business endpoints ──────────────────────────────────────────────

const getCurrentSubscription = () => api.get(`${SUBSCRIPTIONS_URL}/current`);

const getPlans = () => api.get(`${SUBSCRIPTIONS_URL}/plans`);

const getProration = (targetPlanId, billingCycle = "monthly") =>
  api.get(`${SUBSCRIPTIONS_URL}/proration`, { params: { targetPlanId, billingCycle } });

const upgrade = (targetPlanId, billingCycle = "monthly") =>
  api.post(`${SUBSCRIPTIONS_URL}/upgrade`, { targetPlanId, billingCycle });

const downgrade = (targetPlanId) =>
  api.post(`${SUBSCRIPTIONS_URL}/downgrade`, { targetPlanId });

const cancelScheduledDowngrade = () =>
  api.post(`${SUBSCRIPTIONS_URL}/downgrade/cancel`);

const getInvoices = (params = {}) =>
  api.get(`${SUBSCRIPTIONS_URL}/invoices`, {
    params: sanitizeParams(params),
  });

const cancelSubscription = (reason) =>
  api.post(`${SUBSCRIPTIONS_URL}/cancel`, { reason });

const payInvoiceFromWallet = (invoiceId) =>
  api.post(`${SUBSCRIPTIONS_URL}/invoices/${invoiceId}/pay-from-wallet`);

// ── Admin endpoints ─────────────────────────────────────────────────

const getAdminSubscriptions = (params = {}) =>
  api.get(ADMIN_SUBSCRIPTIONS_URL, {
    params: sanitizeParams(params),
  });

const getAdminStats = () => api.get(`${ADMIN_SUBSCRIPTIONS_URL}/stats`);

const getAdminPlans = () => api.get(`${ADMIN_SUBSCRIPTIONS_URL}/plans`);

const createAdminPlan = (data) =>
  api.post(`${ADMIN_SUBSCRIPTIONS_URL}/plans`, data);

const updateAdminPlan = (id, data) =>
  api.put(`${ADMIN_SUBSCRIPTIONS_URL}/plans/${id}`, data);

const updateAdminSubStatus = (id, status, cancelReason) =>
  api.patch(`${ADMIN_SUBSCRIPTIONS_URL}/${id}/status`, { status, cancelReason });

const subscriptionService = {
  getCurrentSubscription,
  getPlans,
  getProration,
  upgrade,
  downgrade,
  cancelScheduledDowngrade,
  getInvoices,
  cancelSubscription,
  payInvoiceFromWallet,
  getAdminSubscriptions,
  getAdminStats,
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  updateAdminSubStatus,
};

export default subscriptionService;
