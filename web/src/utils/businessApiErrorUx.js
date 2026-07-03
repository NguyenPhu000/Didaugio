import { toast } from "sonner";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { appNavigate } from "@/lib/appNavigation";
import i18n from "@/i18n";

/** Mã từ requireActiveBusiness (server) — chỉ xử lý UX thống nhất cho các mã này */
export const BUSINESS_GATE_ERROR_CODES = [
  "NO_BUSINESS_PROFILE",
  "BUSINESS_SUSPENDED",
  "BUSINESS_TERMINATED",
  "BUSINESS_SUSPICIOUS",
  "BUSINESS_NOT_APPROVED",
  "CONTRACT_REQUIRED",
  "CONTRACT_RENEWAL_REQUIRED",
];

const REDIRECT_BY_CODE = {
  NO_BUSINESS_PROFILE: BUSINESS_ROUTES.REGISTER,
  BUSINESS_SUSPENDED: BUSINESS_ROUTES.PROFILE,
  BUSINESS_TERMINATED: BUSINESS_ROUTES.PROFILE,
  BUSINESS_SUSPICIOUS: BUSINESS_ROUTES.PROFILE,
  BUSINESS_NOT_APPROVED: BUSINESS_ROUTES.PROFILE,
  CONTRACT_REQUIRED: BUSINESS_ROUTES.PROFILE_CONTRACT,
  CONTRACT_RENEWAL_REQUIRED: BUSINESS_ROUTES.PROFILE_CONTRACT,
};

const TOAST_ID = "business-api-gate-error";

/**
 * Tránh redirect vòng / giữ user đã đứng đúng màn hình xử lý.
 */
function shouldSkipRedirect(errorCode) {
  if (typeof window === "undefined") return true;

  const path = window.location.pathname;
  const section = new URLSearchParams(window.location.search).get("section");

  if (errorCode === "NO_BUSINESS_PROFILE") {
    return path === "/business/register";
  }
  if (errorCode === "CONTRACT_REQUIRED") {
    return path === "/business/profile" && section === "contract";
  }
  if (
    errorCode === "BUSINESS_NOT_APPROVED" ||
    errorCode === "BUSINESS_SUSPENDED" ||
    errorCode === "BUSINESS_TERMINATED" ||
    errorCode === "BUSINESS_SUSPICIOUS"
  ) {
    return path === "/business/profile";
  }
  return false;
}

/**
 * Toast + redirect (tuỳ mã) cho lỗi “cổng” doanh nghiệp.
 * @returns {boolean} true nếu đã xử lý UX (caller có thể bỏ qua toast trùng)
 */
export function applyBusinessApiErrorUx(error) {
  const code = error?.errorCode;
  if (!code || !BUSINESS_GATE_ERROR_CODES.includes(code)) {
    return false;
  }

  error.globalBusinessUxHandled = true;

  const message =
    error.message || i18n.t("apiError.generic");

  toast.error(message, {
    id: TOAST_ID,
    duration: 6000,
  });

  const dest = REDIRECT_BY_CODE[code];
  if (dest && !shouldSkipRedirect(code)) {
    appNavigate(dest);
  }

  return true;
}

/**
 * Dùng trong catch: bỏ qua toast nếu interceptor đã toast + redirect (mã cổng doanh nghiệp).
 */
export function toastApiErrorIfNeeded(error, fallbackMessage) {
  if (error?.globalBusinessUxHandled) return;
  toast.error(error?.message || fallbackMessage);
}
