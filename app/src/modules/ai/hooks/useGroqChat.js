import { useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { useAIPlannerStore } from "../../../stores/aiPlannerStore";
import { buildApiPayload } from "../lib/conversationMemory";
import { mapAIError } from "../lib/mapAIError";
import { normalizeGenieResponse } from "../lib/genieAssistantExperience";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";
import { AI_REQUEST_TIMEOUT } from "../../../constants/api";

const MAX_SUGGESTED_PLACES = 6;

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
      // Giữ nguyên toàn bộ image fields để resolvePlaceImageUri hoạt động đúng
      images: raw.images || [],
      thumbnailUrl: raw.thumbnailUrl || null,
      thumbnail: raw.thumbnail || null,
      imageUrl: raw.imageUrl || null,
      image: raw.image || null,
      priceFrom: Number(raw.priceFrom ?? raw.price_from ?? 0),
      priceTo: Number(raw.priceTo ?? raw.price_to ?? 0),
      priceRange: raw.priceRange || raw.price_range || null,
      ratingAvg: Number(raw.ratingAvg ?? raw.averageRating ?? 0),
      reviewCount: Number(raw.reviewCount ?? raw._count?.reviews ?? 0),
      categoryName: raw.categoryName || raw.category?.name || "",
      categorySlug: raw.category?.slug || "",
      category: raw.category || null,
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

  // Migrate old conversationMemory from aiContextStore → aiPlannerStore (one-time only)
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (migrationDoneRef.current) return;
    if (oldConversationMemory.length > 0) {
      migrationDoneRef.current = true;
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
  }, [oldConversationMemory, allMessages, appendMessage, clearOldConversation]);

  const conversationMemory = useMemo(
    () => allMessages.filter((m) => m.source === "chat"),
    [allMessages],
  );

  const abortRef = useRef(null);
  const lastFailedMessageRef = useRef(null);

  const sendMessage = useCallback(
    async (text, options = {}) => {
      // Lấy fresh state từ store để tránh race condition khi gửi tin nhắn liên tục
      const freshMessages = useAIPlannerStore.getState().messages.filter((m) => m.source === "chat");
      const appendUserMessage = options.appendUserMessage !== false;
      const payload = buildApiPayload(
        appendUserMessage ? freshMessages : freshMessages.slice(0, -1),
        text,
      );

      if (appendUserMessage) {
        appendMessage({ role: "user", content: text, source: "chat" });
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const isPlaceQuery = PLACE_QUERY_PATTERN.test(text);

      try {
        const cleanMessages = payload.messages.map(({ role, content }) => ({
          role,
          content,
        }));
        const safeContext = {
          currentCoords: sessionContext.currentLocation,
          currentCity: sessionContext.currentCity,
          timeOfDay: sessionContext.timeOfDay,
          preferences: sessionContext.preferences,
          visitedPlaceIds: sessionContext.visitedPlaceIds,
          isPlaceQuery,
        };

        const response = await apiClient.post(
          ENDPOINTS.ai.groqChat,
          { messages: cleanMessages, context: safeContext },
          { signal: abortRef.current.signal, timeout: AI_REQUEST_TIMEOUT },
        );

        const normalized = normalizeGenieResponse(response);
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
        lastFailedMessageRef.current = null;

        return { reply, relatedPlaces };
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return null;
        }
        lastFailedMessageRef.current = text;
        throw new Error(getFriendlyErrorMessage(err, t));
      }
    },
    [sessionContext, appendMessage, t],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retryLastMessage = useCallback(() => {
    const text = lastFailedMessageRef.current;
    if (!text) return Promise.resolve(null);
    return sendMessage(text, { appendUserMessage: false });
  }, [sendMessage]);

  return {
    sendMessage,
    retryLastMessage,
    abort,
    clearConversation: clearChatMessages,
    conversationMemory,
  };
}
