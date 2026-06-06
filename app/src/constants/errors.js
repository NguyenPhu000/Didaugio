import i18n from "@/i18n";

/**
 * Returns translated error messages.
 * Call getErrorMessages() inside components or event handlers,
 * NOT at module top-level (i18n may not be initialized yet).
 */
export function getErrorMessages() {
  return {
    NETWORK: i18n.t("errors.network"),
    SERVER: i18n.t("errors.server"),
    UNAUTHORIZED: i18n.t("errors.unauthorized"),
    NOT_FOUND: i18n.t("errors.notFound"),
    VALIDATION: i18n.t("errors.validation"),
    UNKNOWN: i18n.t("errors.unknown"),
    AI_QUOTA: i18n.t("errors.aiQuota"),
    AI_UNAVAILABLE: i18n.t("errors.aiUnavailable"),
    LOCATION_DENIED: i18n.t("errors.locationDenied"),
  };
}

/** @deprecated Use getErrorMessages() for i18n support */
export const ERROR_MESSAGES = {
  NETWORK: "No network connection. Please check your connection.",
  SERVER: "Server is experiencing issues. Please try again later.",
  UNAUTHORIZED: "Session expired. Please log in again.",
  NOT_FOUND: "Requested information not found.",
  VALIDATION: "Invalid information. Please check and try again.",
  UNKNOWN: "An error occurred. Please try again.",
  AI_QUOTA:
    "AI has reached its quota limit. Please try again later or check Gemini API billing.",
  AI_UNAVAILABLE: "AI service is temporarily unavailable.",
  LOCATION_DENIED: "Location permission is required to use this feature.",
};
