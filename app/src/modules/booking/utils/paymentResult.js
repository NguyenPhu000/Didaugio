export const normalizePaymentBookingId = (value) => {
  if (Array.isArray(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const resolvePaymentResultStatus = (paymentStatus) => {
  if (paymentStatus === "paid") return "success";
  if (paymentStatus === "failed" || paymentStatus === "fully_refunded") {
    return "failed";
  }
  return "pending_verify";
};
