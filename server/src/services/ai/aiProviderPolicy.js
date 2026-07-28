import ServiceError from "../../utils/serviceError.js";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_PROVIDER_MESSAGES = 20;
const MAX_PROVIDER_MESSAGE_CHARS = 4_000;
const MAX_PROVIDER_TOTAL_CHARS = 16_000;
const STABLE_AI_CODES = new Set([
  "AI_TIMEOUT",
  "QUOTA_EXCEEDED",
  "AI_UNAVAILABLE",
  "AI_ERROR",
  "AI_INVALID_OUTPUT",
  "AI_INVALID_REQUEST",
  "AI_DISABLED",
  "AI_MAINTENANCE",
  "AI_SAFETY_BLOCKED",
  "AI_DAILY_QUOTA_EXCEEDED",
  "AI_LOG_KEY_UNAVAILABLE",
  "AI_REQUEST_LOG_UNAVAILABLE",
  "AI_SECRET_UNAVAILABLE",
]);

function parseTimeout(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export const AI_PROVIDER_TIMEOUT_MS = parseTimeout(process.env.AI_PROVIDER_TIMEOUT_MS);

function getErrorValues(error) {
  const values = [];
  let current = error;

  for (let depth = 0; current && depth < 3; depth += 1) {
    values.push({
      status: Number(current.statusCode ?? current.status),
      code: String(current.code ?? ""),
      name: String(current.name ?? ""),
      message: String(current.message ?? ""),
    });
    current = current.cause;
  }

  return values;
}

function createStableAiError(message, statusCode, code) {
  const error = new ServiceError(message, statusCode, code);
  error.code = code;
  return error;
}

/**
 * Re-apply the server chat contract immediately before a provider call.
 * Trusted system prompts are deliberately added by callers after this function.
 */
export function normalizeProviderMessages(messages) {
  if (!Array.isArray(messages)) return [];

  const validMessages = messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").trim().slice(0, MAX_PROVIDER_MESSAGE_CHARS),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_PROVIDER_MESSAGES);

  let total = 0;
  const retained = [];
  for (let index = validMessages.length - 1; index >= 0; index -= 1) {
    const message = validMessages[index];
    if (total + message.content.length > MAX_PROVIDER_TOTAL_CHARS) continue;
    retained.unshift(message);
    total += message.content.length;
  }
  return retained;
}

/** Convert provider failures to application-stable errors without provider text. */
export function toAiServiceError(error) {
  if (error && STABLE_AI_CODES.has(error.code || error.errorCode)) {
    if (!error.code) error.code = error.errorCode;
    return error;
  }

  const values = getErrorValues(error);
  const hasStatus = (status) => values.some((value) => value.status === status);
  const matches = (pattern) => values.some((value) =>
    pattern.test(`${value.code} ${value.name} ${value.message}`),
  );

  if (
    matches(/timeout|timed\s*out|econnaborted|etimedout|abort_err/i)
  ) {
    return createStableAiError("AI provider request timed out.", 504, "AI_TIMEOUT");
  }
  if (hasStatus(429) || matches(/quota|rate.?limit|too many requests/i)) {
    return createStableAiError("Hệ thống Genie AI đang trong quá trình tính toán và tối ưu dữ liệu. Vui lòng đợi trong giây lát rồi thử lại nghen!", 429, "QUOTA_EXCEEDED");
  }
  if (hasStatus(503) || matches(/service unavailable|overloaded|temporarily unavailable/i)) {
    return createStableAiError("AI provider is unavailable.", 503, "AI_UNAVAILABLE");
  }
  return createStableAiError("AI provider request failed.", 502, "AI_ERROR");
}

export function canUseHybridFallback(error) {
  const code = toAiServiceError(error).code;
  return [
    "AI_TIMEOUT",
    "QUOTA_EXCEEDED",
    "AI_UNAVAILABLE",
    "AI_DISABLED",
    "AI_MAINTENANCE",
    "AI_SECRET_UNAVAILABLE",
    "AI_REQUEST_LOG_UNAVAILABLE",
    "AI_ERROR",
    "AI_INVALID_OUTPUT",
  ].includes(code);
}

export function logAiProviderEvent({ feature, model, startedAt, completion, code }) {
  console.info("[AI]", {
    feature,
    model,
    latencyMs: Date.now() - startedAt,
    totalTokens: completion?.usage?.total_tokens ?? null,
    finishReason: completion?.choices?.[0]?.finish_reason ?? null,
    ...(code ? { code } : {}),
  });
}
