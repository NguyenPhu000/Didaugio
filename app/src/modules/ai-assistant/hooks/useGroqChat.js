import { useCallback, useRef } from "react";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { buildApiPayload } from "../lib/conversationMemory";
import { mapAIError } from "../lib/mapAIError";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";
import { AI_REQUEST_TIMEOUT } from "../../../constants/api";

const MAX_SUGGESTED_PLACES = 6;

function extractReply(response) {
  const nested = response?.data?.data?.reply;
  if (typeof nested === "string" && nested.trim()) return nested.trim();

  const msg = response?.data?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();

  const direct = response?.data?.message;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  return "";
}

function normalizePlaces(places = []) {
  if (!Array.isArray(places)) return [];
  const seen = new Set();
  const result = [];
  for (const p of places) {
    const id = Number(p?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(p);
    if (result.length >= MAX_SUGGESTED_PLACES) break;
  }
  return result;
}

/**
 * Hook for Groq-powered AI chat with AsyncStorage persistence.
 * Conversation history is stored via aiContextStore (zustand + AsyncStorage).
 */
export function useGroqChat() {
  const conversationMemory = useAIContextStore((s) => s.conversationMemory);
  const sessionContext = useAIContextStore((s) => s.sessionContext);
  const addMessage = useAIContextStore((s) => s.addMessage);
  const clearConversation = useAIContextStore((s) => s.clearConversation);

  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (text) => {
      const payload = buildApiPayload(conversationMemory, text);

      addMessage({ role: "user", content: text });

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const response = await apiClient.post(
          ENDPOINTS.ai.groqChat,
          {
            messages: payload.messages,
            context: {
              currentCoords: sessionContext.currentLocation,
              currentCity: sessionContext.currentCity,
              timeOfDay: sessionContext.timeOfDay,
              preferences: sessionContext.preferences,
              visitedPlaceIds: sessionContext.visitedPlaceIds,
            },
          },
          {
            signal: abortRef.current.signal,
            timeout: AI_REQUEST_TIMEOUT,
          },
        );

        const reply =
          extractReply(response) ||
          "Mình chưa nhận được nội dung phản hồi, bạn thử lại giúp mình nhé.";

        const relatedPlaces = normalizePlaces(
          response?.data?.data?.relatedPlaces,
        );

        addMessage({
          role: "assistant",
          content: reply,
          suggestedPlaces: relatedPlaces,
        });

        return { reply, relatedPlaces };
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return null;
        }
        throw new Error(mapAIError(err));
      }
    },
    [conversationMemory, sessionContext, addMessage],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, abort, clearConversation, conversationMemory };
}
