import { chatWithGroq } from "../../services/ai/groq.service.js";
import prisma from "../../config/prismaClient.js";
import { 
  findPlacesNearby, 
  findNearestDistrict, 
  findNearestWard, 
  findRelatedPlacesByKeywords 
} from "../../utils/spatialQuery.js";

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
    const userId = req.user?.id;
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
    const currentCoords = context.currentCoords || context.coords;

    if (currentCoords && currentCoords.latitude && currentCoords.longitude) {
      const lat = parseFloat(currentCoords.latitude);
      const lng = parseFloat(currentCoords.longitude);
      
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

    // 4. Đóng gói Enriched Context gửi cho Groq Service
    const enrichedContext = {
      ...context,
      systemPlaces,
      travelPreferences,
      locationContext,
    };

    const { reply, suggestedPlaceIds } = await chatWithGroq(messages, enrichedContext);

    console.log("[GroqChat] Reply length:", reply?.length, "Reply preview:", reply?.substring(0, 100));
    console.log("[GroqChat] suggestedPlaceIds:", suggestedPlaceIds);
    console.log("[GroqChat] Messages sent:", messages.length, "System places:", systemPlaces.length);

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
      },
      message: "Thành công",
    });
  } catch (error) {
    const isQuotaError =
      error?.status === 429 || /quota|rate.?limit|too many requests/i.test(error?.message || "");
    const isUnavailable =
      error?.status === 503 || /service unavailable|overloaded/i.test(error?.message || "");

    console.error("[GroqChat]", error?.status || "", (error?.message || "").split("\n")[0]);

    if (isQuotaError) {
      return res.status(429).json({
        success: false,
        data: null,
        message: "AI đã chạm giới hạn tần suất. Vui lòng thử lại sau.",
        errorCode: "QUOTA_EXCEEDED",
      });
    }

    if (isUnavailable) {
      return res.status(503).json({
        success: false,
        data: null,
        message: "Dịch vụ AI tạm thời không khả dụng, vui lòng thử lại sau.",
        errorCode: "AI_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
      message: "Trợ lý AI đang gặp sự cố, vui lòng thử lại sau.",
      errorCode: "AI_ERROR",
    });
  }
};
