import {
  chatWithGroq,
  resolveGroqProviderOptions,
} from "../../services/ai/groq.service.js";
import { executeAiRequest } from "../../services/ai/runtime/aiRuntimeExecution.js";
import { toAiServiceError } from "../../services/ai/aiProviderPolicy.js";
import prisma from "../../config/prismaClient.js";
import { 
  findPlacesNearby, 
  findNearestDistrict, 
  findNearestWard, 
  findRelatedPlacesByKeywords 
} from "../../utils/spatialQuery.js";

export function getValidatedCoordinates(context = {}) {
  const coords = context.currentCoords;
  if (!coords) return null;

  const { latitude, longitude } = coords;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

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

    // 1. Lấy thông tin travelPreferences từ Profile của user
    const userId = req.user?.userId || req.user?.id;
    let travelPreferences = null;
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { travelPreferences: true },
      });
      travelPreferences = profile?.travelPreferences;
    }

    // 2. Tìm địa điểm lân cận bằng Spatial Query nếu client gửi tọa độ
    let systemPlaces = [];
    let locationContext = null;
    const currentCoords = getValidatedCoordinates(context);

    if (currentCoords) {
      const { latitude: lat, longitude: lng } = currentCoords;
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Spatial query với Bounding Box pre-filter
        systemPlaces = await findPlacesNearby(lat, lng, 10, 10);
        
        // Reverse geocoding tại server
        const district = await findNearestDistrict(lat, lng);
        const ward = await findNearestWard(lat, lng);
        if (district) {
          locationContext = {
            district: district.name,
            ward: ward ? ward.name : null,
            coords: { latitude: lat, longitude: lng },
          };
        }
      }
    }

    // 3. Fallback tìm theo từ khóa tin nhắn cuối nếu không có tọa độ hoặc không tìm thấy điểm lân cận
    if (systemPlaces.length === 0) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
      systemPlaces = await findRelatedPlacesByKeywords(lastUserMessage);
    }

    const lastUserMessage =
      [...messages].reverse().find((message) => message.role === "user")
        ?.content || "";
    const execution = await executeAiRequest({
      feature: "chat",
      user: { userId },
      inputText: lastUserMessage,
      context: {
        currentCity:
          locationContext?.district || context.currentCity,
        timeOfDay: context.timeOfDay,
        travelPreferences,
        places: systemPlaces,
        messages,
      },
      operation: async ({ configData, context: allowedContext }) => {
        const providerOptions = await resolveGroqProviderOptions(
          configData,
          "chat",
        );
        const activePlaces =
          allowedContext.places && allowedContext.places.length > 0
            ? allowedContext.places
            : systemPlaces;
        return chatWithGroq(
          allowedContext.messages || [
            { role: "user", content: lastUserMessage },
          ],
          {
            ...allowedContext,
            systemPlaces: activePlaces,
          },
          providerOptions,
        );
      },
    });
    const { reply, suggestedPlaceIds } = execution.result;

    // 5. Khớp các địa điểm được AI gợi ý
    let responsePlaces = [];
    if (suggestedPlaceIds.length > 0) {
      responsePlaces = systemPlaces.filter((p) => suggestedPlaceIds.includes(p.id));
    } else {
      // Fallback: khớp theo tên địa điểm xuất hiện trong văn bản trả về
      responsePlaces = systemPlaces.filter((p) =>
        reply.toLowerCase().includes(p.name.toLowerCase()),
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        reply,
        relatedPlaces: responsePlaces,
        ...(execution.requestLogId
          ? { requestLogId: execution.requestLogId }
          : {}),
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
