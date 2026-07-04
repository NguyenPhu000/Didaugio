const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

export const appConfig = {
  osrmUrl: trimTrailingSlash(process.env.OSRM_URL || "http://localhost:5000"),
  apiBaseUrl: trimTrailingSlash(
    process.env.API_BASE_URL || "http://localhost:8081",
  ),
  vnpayReturnUrl:
    process.env.VNPAY_RETURN_URL ||
    "http://localhost:8081/api/payments/vnpay-return",
};

export default appConfig;
