import { useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { useAIPlannerStore } from "../../../stores/aiPlannerStore";
import { buildApiPayload } from "../lib/conversationMemory";
import { mapAIError } from "../lib/mapAIError";
import { normalizeNhiResponse } from "../lib/nhiAssistantExperience";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";
import { AI_REQUEST_TIMEOUT } from "../../../constants/api";

const MAX_SUGGESTED_PLACES = 6;

/** Regex phát hiện yêu cầu lịch trình → ưu tiên gọi hybrid-plan */
const ITINERARY_PATTERN = /(lịch trình|lên lịch|kế hoạch|itinerary|plan|lộ trình|chặng đi)/i;

/** Regex phát hiện truy vấn liên quan địa điểm (gợi ý, ăn gì, chơi gì...) */
const PLACE_QUERY_PATTERN = /(suggest|gợi ý|đi đâu|ăn gì|chơi gì|check.?in|review|quán|nhà hàng|cafe|cà phê|khách sạn|chợ|bãi biển|du lịch|tham quan)/i;

function extractReply(response) {
  // Axios interceptor in client.js returns response.data directly,
  // so `response` here is already the server's response body:
  // { success, data: { reply, relatedPlaces }, message }
  const nested = response?.data?.reply;
  if (typeof nested === "string" && nested.trim()) return nested.trim();

  const msg = response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();

  const direct = response?.message;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  return "";
}

function normalizePlaces(places = []) {
  if (!Array.isArray(places)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of places) {
    const id = Number(raw?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    result.push({
      id,
      name: raw.name || "Địa điểm",
      address: raw.address || "",
      latitude: raw.latitude,
      longitude: raw.longitude,
      description: raw.description || "",
      images: raw.images || [],
      priceFrom: Number(raw.priceFrom ?? raw.price_from ?? 0),
      priceTo: Number(raw.priceTo ?? raw.price_to ?? 0),
      priceRange: raw.priceRange || raw.price_range || null,
      ratingAvg: Number(raw.ratingAvg ?? raw.averageRating ?? 0),
      reviewCount: Number(raw.reviewCount ?? raw._count?.reviews ?? 0),
      categoryName: raw.categoryName || raw.category?.name || "",
      categorySlug: raw.category?.slug || "",
      ward: raw.ward || null,
      district: raw.district || null,
    });

    if (result.length >= MAX_SUGGESTED_PLACES) break;
  }
  return result;
}

function getFriendlyErrorMessage(err, t) {
  const status = err?.response?.status || err?.status;

  if (status === 429) {
    return t("aiChat.rateLimit");
  }
  if (status === 503) {
    return t("aiChat.serviceOverloaded");
  }

  return mapAIError(err);
}

export function useGroqChat() {
  const { t } = useTranslation();
  const sessionContext = useAIContextStore((s) => s.sessionContext);
  const oldConversationMemory = useAIContextStore((s) => s.conversationMemory);
  const clearOldConversation = useAIContextStore((s) => s.clearConversation);
  const allMessages = useAIPlannerStore((s) => s.messages);
  const appendMessage = useAIPlannerStore((s) => s.appendMessage);
  const clearChatMessages = useAIPlannerStore((s) => s.clearChatMessages);

  // Migrate old conversationMemory from aiContextStore → aiPlannerStore (one-time)
  useEffect(() => {
    if (oldConversationMemory.length > 0) {
      const hasChatMessages = allMessages.some((m) => m.source === "chat");
      if (!hasChatMessages) {
        oldConversationMemory.forEach((msg) => {
          appendMessage({
            role: msg.role,
            content: msg.content ?? msg.text ?? "",
            source: "chat",
            suggestedPlaces: msg.suggestedPlaces || [],
            createdAt: msg.createdAt,
            id: msg.id,
          });
        });
      }
      clearOldConversation();
    }
  }, [allMessages, appendMessage, clearOldConversation, oldConversationMemory]);

  const conversationMemory = allMessages.filter((m) => m.source === "chat");

  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (text) => {
      const chatMessages = conversationMemory;
      const payload = buildApiPayload(chatMessages, text);

      appendMessage({ role: "user", content: text, source: "chat" });

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const isItineraryRequest = ITINERARY_PATTERN.test(text);
      const isPlaceQuery = PLACE_QUERY_PATTERN.test(text);
      const hasCoords = sessionContext.currentLocation?.latitude && sessionContext.currentLocation?.longitude;

      try {
        let response;

        if (isItineraryRequest && hasCoords) {
          response = await apiClient.post(
            "/api/ai/hybrid-plan",
            {
              currentCoords: sessionContext.currentLocation,
            },
            {
              signal: abortRef.current.signal,
              timeout: AI_REQUEST_TIMEOUT,
            }
          );

          const planData = response?.data?.data;
          if (!planData || !planData.timeline) {
            throw new Error(t("aiChat.invalidItineraryData"));
          }

          const replyMessage = t("aiChat.itineraryReady");

          appendMessage({
            role: "assistant",
            content: replyMessage,
            hybridPlan: planData,
            source: "chat",
          });

          return { reply: replyMessage, hybridPlan: planData };
        } else {
          const cleanMessages = payload.messages.map(({ role, content }) => ({
            role,
            content,
          }));

          response = await apiClient.post(
            ENDPOINTS.ai.groqChat,
            {
              messages: cleanMessages,
              context: {
                currentCoords: sessionContext.currentLocation,
                currentCity: sessionContext.currentCity,
                timeOfDay: sessionContext.timeOfDay,
                preferences: sessionContext.preferences,
                travelPreferences: sessionContext.userProfile?.travelPreferences,
                visitedPlaceIds: sessionContext.visitedPlaceIds,
                isPlaceQuery,
              },
            },
            {
              signal: abortRef.current.signal,
              timeout: AI_REQUEST_TIMEOUT,
            },
          );

          const normalized = normalizeNhiResponse(response);
          const reply = normalized.reply || extractReply(response) || t("aiChat.noReplyContent");
          const relatedPlaces = normalizePlaces(normalized.suggestedPlaces);

          appendMessage({
            role: "assistant",
            content: reply,
            suggestedPlaces: relatedPlaces,
            quickReplies: normalized.quickReplies,
            actions: normalized.actions,
            source: "chat",
          });

          return { reply, relatedPlaces };
        }
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return null;
        }
        throw new Error(getFriendlyErrorMessage(err, t));
      }
    },
    [conversationMemory, sessionContext, appendMessage, t],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, abort, clearConversation: clearChatMessages, conversationMemory };
}
