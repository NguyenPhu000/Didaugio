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
import { buildSafeChatContext } from "../lib/chatContext";

const MAX_SUGGESTED_PLACES = 20;

/** Regex phát hiện truy vấn liên quan địa điểm (gợi ý, ăn gì, chơi gì...) */
const PLACE_QUERY_PATTERN = /(suggest|gợi ý|đi đâu|ăn gì|chơi gì|check.?in|review|quán|nhà hàng|cafe|cà phê|khách sạn|chợ|bãi biển|du lịch|tham quan)/i;

function extractReply(response) {
  const nested = response?.data?.reply;
  if (typeof nested === "string" && nested.trim()) return nested.trim();

  const msg = response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();

  const direct = response?.message;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  return "";
}

/** Tối ưu xếp hạng địa điểm gợi ý theo Rating & khoảng cách GPS nếu có */
function normalizePlaces(places = []) {
  if (!Array.isArray(places)) return [];
  const seen = new Set();
  const candidates = [];
  for (const raw of places) {
    const id = Number(raw?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    candidates.push({
      id,
      name: raw.name || "Địa điểm",
      address: raw.address || "",
      latitude: raw.latitude,
      longitude: raw.longitude,
      description: raw.description || "",
      images: raw.images || [],
      thumbnailUrl: raw.thumbnailUrl || null,
      thumbnail: raw.thumbnail || null,
      imageUrl: raw.imageUrl || null,
      imageData: raw.imageData || null,
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
  }

  candidates.sort((a, b) => b.ratingAvg - a.ratingAvg);
  return candidates.slice(0, MAX_SUGGESTED_PLACES);
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

function snapshotValue(value) {
  if (Array.isArray(value)) return value.map(snapshotValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, snapshotValue(item)]),
    );
  }
  return value;
}

export function useGroqChat() {
  const { t } = useTranslation();
  const sessionContext = useAIContextStore((s) => s.sessionContext);
  const oldConversationMemory = useAIContextStore((s) => s.conversationMemory);
  const clearOldConversation = useAIContextStore((s) => s.clearConversation);

  const allMessages = useAIPlannerStore((s) => s.messages);
  const appendMessage = useAIPlannerStore((s) => s.appendMessage);
  const clearChatMessages = useAIPlannerStore((s) => s.clearChatMessages);

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
  const lastFailedRequestRef = useRef(null);

  const sendMessage = useCallback(
    async (text, options = {}) => {
      const appendUserMessage = options.appendUserMessage !== false;
      const retryRequest = options.retryRequest;
      const isPlaceQuery = PLACE_QUERY_PATTERN.test(text);
      let request = retryRequest;

      if (!request) {
        const freshMessages = useAIPlannerStore
          .getState()
          .messages.filter((message) => message.source === "chat");
        const payload = buildApiPayload(freshMessages, text);
        const messages = payload.messages.map(({ role, content }) => ({ role, content }));
        const id = `chat-${Date.now()}`;
        const body = snapshotValue({
          messages,
          context: buildSafeChatContext(sessionContext, isPlaceQuery),
        });

        request = { id, text, body };
        if (appendUserMessage) {
          appendMessage({ id, role: "user", content: text, source: "chat" });
        }
      }

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const response = await apiClient.post(
          ENDPOINTS.ai.groqChat,
          request.body,
          { signal: abortRef.current.signal, timeout: AI_REQUEST_TIMEOUT },
        );

        const normalized = normalizeGenieResponse(response);
        const reply = normalized.reply || extractReply(response) || t("aiChat.noReplyContent");
        const relatedPlaces = normalizePlaces(normalized.suggestedPlaces);
        const requestLogId = normalized.requestLogId ?? null;

        appendMessage({
          role: "assistant",
          content: reply,
          suggestedPlaces: relatedPlaces,
          quickReplies: normalized.quickReplies,
          requestLogId,
          source: "chat",
        });

        lastFailedRequestRef.current = null;
        return { reply, suggestedPlaces: relatedPlaces, requestLogId };
      } catch (err) {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
          return;
        }

        lastFailedRequestRef.current = request;
        const errorMessage = getFriendlyErrorMessage(err, t);

        appendMessage({
          role: "assistant",
          content: errorMessage,
          isError: true,
          source: "chat",
        });

        throw new Error("request failed");
      }
    },
    [appendMessage, sessionContext, t],
  );

  const retryLastMessage = useCallback(() => {
    if (!lastFailedRequestRef.current) return Promise.resolve();
    const req = lastFailedRequestRef.current;
    lastFailedRequestRef.current = null;

    const state = useAIPlannerStore.getState();
    const lastMsg = state.messages[state.messages.length - 1];
    if (lastMsg?.isError) {
      state.removeMessage(lastMsg.id);
    }

    return sendMessage(req.text, { retryRequest: req, appendUserMessage: false }).catch(() => {});
  }, [sendMessage]);

  return {
    messages: conversationMemory,
    sendMessage,
    retryLastMessage,
    clearHistory: clearChatMessages,
    hasFailedMessage: Boolean(lastFailedRequestRef.current),
  };
}
