import { getPlaceById } from "../../services/place/place.service.js";
import {
  streamPlaceSummary,
  streamChat,
} from "../../services/ai/aiStreaming.service.js";
import { chatWithGroq } from "../../services/ai/groq.service.js";
import {
  buildVoiceIntroPrompt,
  buildChatSystemPrompt,
} from "../../lib/promptBuilder.js";
import NodeCache from "node-cache";
import prisma from "../../config/prismaClient.js";

const appCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

function extractKeywords(text) {
  if (!text) return [];
  const stopWords = new Set([
    "cho", "mình", "tôi", "ở", "tại", "đi", "đâu", "giờ", "có", "nào", "gợi", "ý", "với",
    "nhé", "nha", "được", "không", "cần", "thơ", "là", "thì", "mà", "lên", "xuống", "cái", "chi",
    "gì", "này", "kia", "đó", "nọ", "chút", "ít", "nhiều", "cực", "quá", "lắm", "hộ", "giúp", "quán", "chỗ", "địa", "điểm"
  ]);
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));
}

export const handlePlaceSummaryStream = async (req, res) => {
  try {
    const { placeId, context } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "placeId là bắt buộc",
        errorCode: "MISSING_PLACE_ID",
      });
    }

    const place = await getPlaceById(Number(placeId));
    if (!place) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Địa điểm không tồn tại",
        errorCode: "PLACE_NOT_FOUND",
      });
    }

    const prompt = buildVoiceIntroPrompt(place, context ?? {});
    await streamPlaceSummary(prompt, res);
  } catch (err) {
    const status = err?.status || 500;
    console.error("[PlaceSummary]", err?.message || "");
    if (!res.headersSent) {
      res.status(status).json({
        success: false,
        data: null,
        message: "Lỗi khi tạo tóm tắt địa điểm",
        errorCode: "AI_ERROR",
      });
    }
  }
};

export const handleChat = async (req, res) => {
  try {
    const { messages, context, stream = false } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "messages là bắt buộc và phải là mảng không rỗng",
        errorCode: "MISSING_MESSAGES",
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    let relatedPlaces = [];

    if (lastUserMessage.trim().length > 1) {
      const keywords = extractKeywords(lastUserMessage);
      if (keywords.length > 0) {
        relatedPlaces = await prisma.place.findMany({
          where: {
            status: "approved",
            deletedAt: null,
            OR: keywords.flatMap((kw) => [
              { name: { contains: kw, mode: "insensitive" } },
              { description: { contains: kw, mode: "insensitive" } },
            ]),
          },
          take: 6,
          select: {
            id: true,
            name: true,
            address: true,
            description: true,
            priceFrom: true,
            priceTo: true,
            ratingAvg: true,
            category: { select: { name: true } },
          },
        });
      }
    }

    if (relatedPlaces.length === 0) {
      const cacheKey = "featured_places_rag";
      let cached = appCache.get(cacheKey);
      if (cached) {
        relatedPlaces = cached;
      } else {
        relatedPlaces = await prisma.place.findMany({
          where: {
            status: "approved",
            deletedAt: null,
          },
          orderBy: [
            { isFeatured: "desc" },
            { ratingAvg: "desc" },
            { viewCount: "desc" },
          ],
          take: 15,
          select: {
            id: true,
            name: true,
            address: true,
            description: true,
            priceFrom: true,
            priceTo: true,
            ratingAvg: true,
            category: { select: { name: true } },
          },
        });
        appCache.set(cacheKey, relatedPlaces);
      }
    }

    const enrichedContext = {
      ...context,
      systemPlaces: relatedPlaces,
    };

    if (stream) {
      const system = buildChatSystemPrompt(enrichedContext);
      await streamChat(messages, system, res);
      return;
    }

    const { reply, suggestedPlaceIds } = await chatWithGroq(messages, enrichedContext);

    let responsePlaces = [];
    if (suggestedPlaceIds.length > 0) {
      responsePlaces = relatedPlaces.filter((p) => suggestedPlaceIds.includes(p.id));
    } else {
      responsePlaces = relatedPlaces.filter((p) =>
        reply.toLowerCase().includes(p.name.toLowerCase()),
      );
    }

    res.json({
      success: true,
      data: {
        reply,
        relatedPlaces: responsePlaces,
      },
      message: "Thành công",
    });
  } catch (err) {
    const isQuotaError =
      err?.status === 429 || /quota|rate.?limit|too many requests/i.test(err?.message || "");
    const isUnavailable =
      err?.status === 503 || /service unavailable|overloaded/i.test(err?.message || "");

    console.error("[Chat]", err?.status || "", (err?.message || "").split("\n")[0]);

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
