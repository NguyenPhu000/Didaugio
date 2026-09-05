import { processGroqChat } from "../../services/ai/groq.service.js";
import { toAiServiceError } from "../../services/ai/aiProviderPolicy.js";

/**
 * POST /api/ai/groq-chat
 * Handles chat via Groq Cloud AI Gateway.
 */
export const handleGroqChat = async (req, res) => {
  try {
    const { messages, context = {} } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "messages là bắt buộc và phải là mảng không rỗng",
        errorCode: "MISSING_MESSAGES",
      });
    }

    const userId = req.user?.userId || req.user?.id;
    const { reply, relatedPlaces, requestLogId } = await Promise.resolve(processGroqChat({
      messages,
      context,
      userId,
    }));

    return res.status(200).json({
      success: true,
      data: {
        reply,
        relatedPlaces,
        ...(requestLogId ? { requestLogId } : {}),
      },
      message: "Thành công",
    });
  } catch (error) {
    const aiError = toAiServiceError(error);
    const errorCode = aiError.code;
    console.info("[AI]", { feature: "chat-controller", code: errorCode });

    if (errorCode === "QUOTA_EXCEEDED") {
      return res.status(429).json({
        success: false,
        data: null,
        message: "AI đã chạm giới hạn tần suất. Vui lòng thử lại sau.",
        errorCode: "QUOTA_EXCEEDED",
      });
    }

    if (errorCode === "AI_UNAVAILABLE") {
      return res.status(503).json({
        success: false,
        data: null,
        message: "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau.",
        errorCode: "AI_UNAVAILABLE",
      });
    }

    if (errorCode === "AI_TIMEOUT") {
      return res.status(504).json({
        success: false,
        data: null,
        message: "Trợ lý AI phản hồi quá lâu, vui lòng thử lại sau.",
        errorCode,
      });
    }

    return res.status(aiError.statusCode || 502).json({
      success: false,
      data: null,
      message: "Trợ lý AI đang gặp sự cố, vui lòng thử lại sau.",
      errorCode,
    });
  }
};
