import { geminiModel } from "../../config/geminiClient.js";
import { getPlaceById } from "../../services/place/place.service.js";
import {
  streamPlaceSummary,
  streamChat,
} from "../../services/ai/aiStreaming.service.js";
import {
  buildVoiceIntroPrompt,
  buildChatSystemPrompt,
} from "../../lib/promptBuilder.js";
import { geminiErrorHandler } from "../../lib/geminiErrorHandler.js";
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

export const handlePlaceSummaryStream = geminiErrorHandler(async (req, res) => {
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
});

export const handleChat = geminiErrorHandler(async (req, res) => {
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

  const updatedContext = {
    ...context,
    systemPlaces: relatedPlaces,
  };

  const system = buildChatSystemPrompt(updatedContext);

  if (stream) {
    await streamChat(messages, system, res);
    return;
  }

  const result = await geminiModel.generateContent({
    systemInstruction: system,
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const replyText = result.response.text();
  let finalReply = replyText;
  let responsePlaces = [];

  const placesRegex = /\[PLACES:\s*([\d\s,]+)\]/i;
  const match = replyText.match(placesRegex);
  if (match) {
    const parsedPlaceIds = match[1]
      .split(",")
      .map((idStr) => parseInt(idStr.trim(), 10))
      .filter((id) => !isNaN(id));

    if (parsedPlaceIds.length > 0) {
      responsePlaces = relatedPlaces.filter((p) => parsedPlaceIds.includes(p.id));
    }
    finalReply = replyText.replace(placesRegex, "").trim();
  } else {
    // Fallback: nếu AI không format dạng PLACES tag, kiểm tra xem có chứa tên địa điểm nào không
    responsePlaces = relatedPlaces.filter((p) => replyText.toLowerCase().includes(p.name.toLowerCase()));
  }

  res.json({
    success: true,
    data: {
      reply: finalReply,
      relatedPlaces: responsePlaces,
    },
    message: "Thành công",
  });
});
