const GEMINI_ERROR_MAP = {
  429: { code: "QUOTA_EXCEEDED", message: "AI đang quá tải, vui lòng thử lại sau ít phút nhé.", retryAfter: 30 },
  503: { code: "AI_UNAVAILABLE", message: "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau." },
  400: { code: "AI_BAD_REQUEST", message: "Yêu cầu không hợp lệ." },
};

/**
 * Map a Gemini API error to a user-friendly response payload.
 * @param {Error} err
 * @returns {{ status: number, body: Object }}
 */
export function mapGeminiError(err) {
  const httpStatus = err?.status ?? err?.response?.status ?? 500;
  const mapped = GEMINI_ERROR_MAP[httpStatus];

  if (mapped) {
    return {
      status: httpStatus === 429 ? 429 : 503,
      body: {
        success: false,
        data: null,
        message: mapped.message,
        errorCode: mapped.code,
        ...(mapped.retryAfter ? { retryAfter: mapped.retryAfter } : {}),
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
      console.error("[GeminiError]", err?.message ?? err);
      const { status, body } = mapGeminiError(err);
      res.status(status).json(body);
    }
  };
}
