import { chatWithGroq } from "../../services/ai/groq.service.js";
import { buildChatSystemPrompt } from "../../lib/promptBuilder.js";
import prisma from "../../config/prismaClient.js";
import NodeCache from "node-cache";

const placeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const STOP_WORDS = new Set([
  "cho", "mình", "tôi", "ở", "tại", "đi", "đâu", "giờ", "có", "nào", "gợi", "ý", "với",
  "nhé", "nha", "được", "không", "cần", "thơ", "là", "thì", "mà", "lên", "xuống", "cái", "chi",
  "gì", "này", "kia", "đó", "nọ", "chút", "ít", "nhiều", "cực", "quá", "lắm", "hộ", "giúp",
  "quán", "chỗ", "địa", "điểm",
]);

function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

async function findRelatedPlaces(userMessage) {
  const keywords = extractKeywords(userMessage);
  if (keywords.length > 0) {
    const results = await prisma.place.findMany({
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
    if (results.length > 0) return results;
  }

  // Fallback: featured places
  const cacheKey = "groq_featured_places";
  let cached = placeCache.get(cacheKey);
  if (cached) return cached;

  const featured = await prisma.place.findMany({
    where: { status: "approved", deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { viewCount: "desc" }],
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
  placeCache.set(cacheKey, featured);
  return featured;
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

    // Find related places for RAG context
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const systemPlaces = await findRelatedPlaces(lastUserMessage);

    const enrichedContext = {
      ...context,
      systemPlaces,
    };

    const { reply, suggestedPlaceIds } = await chatWithGroq(messages, enrichedContext);

    // Resolve suggested places
    let responsePlaces = [];
    if (suggestedPlaceIds.length > 0) {
      responsePlaces = systemPlaces.filter((p) => suggestedPlaceIds.includes(p.id));
    } else {
      // Fallback: match by name in reply text
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
