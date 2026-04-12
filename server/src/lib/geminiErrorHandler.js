const DEFAULT_RETRY_AFTER_SECONDS = 30;

const GEMINI_ERROR_MAP = {
  429: {
    code: "QUOTA_EXCEEDED",
    message:
      "AI đã chạm giới hạn quota/tần suất. Vui lòng thử lại sau hoặc kiểm tra billing của Gemini API.",
    retryAfter: DEFAULT_RETRY_AFTER_SECONDS,
  },
  503: {
    code: "AI_UNAVAILABLE",
    message: "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau.",
  },
  400: { code: "AI_BAD_REQUEST", message: "Yêu cầu không hợp lệ." },
};

function parseStatusFromMessage(message) {
  if (!message) return null;

  const bracketStatus = message.match(/\[(\d{3})\s[^\]]+\]/);
  if (bracketStatus) {
    const parsed = Number(bracketStatus[1]);
    if (Number.isFinite(parsed)) return parsed;
  }

  if (/quota exceeded|too many requests|rate\s*limit/i.test(message)) {
    return 429;
  }

  if (/service unavailable|temporarily unavailable|overloaded/i.test(message)) {
    return 503;
  }

  return null;
}

function parseRetryAfterSeconds(err, message) {
  const directRetry = Number(err?.retryAfter);
  if (Number.isFinite(directRetry) && directRetry > 0) {
    return Math.ceil(directRetry);
  }

  const delayString = err?.retryDelay;
  if (typeof delayString === "string") {
    const parsedFromDelay = Number(delayString.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsedFromDelay) && parsedFromDelay > 0) {
      return Math.ceil(parsedFromDelay);
    }
  }

  if (message) {
    const retryInMatch = message.match(/retry\s+in\s+([\d.]+)\s*s/i);
    if (retryInMatch) {
      const parsedFromMessage = Number(retryInMatch[1]);
      if (Number.isFinite(parsedFromMessage) && parsedFromMessage > 0) {
        return Math.ceil(parsedFromMessage);
      }
    }

    const retryDelayMatch = message.match(/"retryDelay":"([\d.]+)s"/i);
    if (retryDelayMatch) {
      const parsedRetryDelay = Number(retryDelayMatch[1]);
      if (Number.isFinite(parsedRetryDelay) && parsedRetryDelay > 0) {
        return Math.ceil(parsedRetryDelay);
      }
    }
  }

  return null;
}

export function getGeminiErrorInfo(err) {
  const directStatus = Number(
    err?.status ?? err?.response?.status ?? err?.statusCode,
  );
  const message = String(err?.message || "");

  let status = Number.isFinite(directStatus) ? directStatus : null;
  if (!status) {
    status = parseStatusFromMessage(message);
  }

  const retryAfter = parseRetryAfterSeconds(err, message);

  return {
    status: status || 500,
    retryAfter,
    message,
  };
}

/**
 * Map a Gemini API error to a user-friendly response payload.
 * @param {Error} err
 * @returns {{ status: number, body: Object }}
 */
export function mapGeminiError(err) {
  const { status: httpStatus, retryAfter } = getGeminiErrorInfo(err);
  const mapped = GEMINI_ERROR_MAP[httpStatus];

  if (mapped) {
    const resolvedRetryAfter =
      retryAfter || (httpStatus === 429 ? mapped.retryAfter : null);
    return {
      status:
        httpStatus === 429
          ? 429
          : httpStatus === 400
            ? 400
            : httpStatus === 401
              ? 401
              : 503,
      body: {
        success: false,
        data: null,
        message: mapped.message,
        errorCode: mapped.code,
        ...(resolvedRetryAfter ? { retryAfter: resolvedRetryAfter } : {}),
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      data: null,
      message: "Lỗi AI không xác định, vui lòng thử lại.",
      errorCode: "AI_ERROR",
    },
  };
}

/**
 * Express error handler wrapper for Gemini controllers.
 */
export function geminiErrorHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      const info = getGeminiErrorInfo(err);
      const compactMessage = (info.message || "").split("\n")[0];
      console.error(
        `[GeminiError] status=${info.status} retryAfter=${info.retryAfter || "-"} message=${compactMessage}`,
      );
      const { status, body } = mapGeminiError(err);
      res.status(status).json(body);
    }
  };
}
