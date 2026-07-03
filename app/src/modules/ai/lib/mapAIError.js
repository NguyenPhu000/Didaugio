import { ERROR_MESSAGES } from "../../../constants/errors";

/**
 * Map an API error (from apiClient format) to a user-friendly message.
 * apiClient format: { message, status, code, raw }
 * @param {Error|Object} err
 * @returns {string}
 */
export function mapAIError(err) {
  const status = err?.status;

  if (!status || status === 0 || err?.message === "Network Error") {
    return ERROR_MESSAGES.NETWORK;
  }

  if (status === 429) return ERROR_MESSAGES.AI_QUOTA;
  if (status === 503) return ERROR_MESSAGES.AI_UNAVAILABLE;
  if (status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
  if (status >= 500) return ERROR_MESSAGES.SERVER;

  return err?.message ?? ERROR_MESSAGES.UNKNOWN;
}
