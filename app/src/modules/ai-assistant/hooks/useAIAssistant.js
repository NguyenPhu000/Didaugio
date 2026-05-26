import { useCallback, useRef } from "react";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { useAuthStore } from "../../../stores/authStore";
import { useStreamingVoice } from "./useStreamingVoice";
import { useIntentRouter } from "./useIntentRouter";
import { buildApiPayload } from "../lib/conversationMemory";
import { INTENT_TYPES } from "../lib/intentDetector";
import { mapAIError } from "../lib/mapAIError";
import { generateTripPreviewApi } from "../../ai/api/aiApi";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";

const MAX_CHAT_SUGGESTED_PLACES = 6;

const PLACE_SUGGESTION_INTENTS = new Set([
  INTENT_TYPES.SCHEDULE,
  INTENT_TYPES.NEARBY,
  INTENT_TYPES.EAT,
  INTENT_TYPES.VOICE,
  INTENT_TYPES.REVIEW,
  INTENT_TYPES.OPEN_HOURS,
  INTENT_TYPES.NAVIGATE,
  INTENT_TYPES.SAVE,
  INTENT_TYPES.GENERAL,
]);

function extractAssistantReply(response) {
  // Prefer deeply nested payload first so raw axios responses don't return
  // top-level metadata messages like "Thành công".
  const nestedReply = response?.data?.data?.reply;
  if (typeof nestedReply === "string" && nestedReply.trim()) {
    return nestedReply.trim();
  }

  const nestedMessage = response?.data?.data?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) {
    return nestedMessage.trim();
  }

  const directMessage = response?.data?.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage.trim();
  }

  return "";
}

function inferPlannerPreferences(text = "") {
  const dayMatch = text.match(/(\d{1,2})\s*(ngày|day)/i);
  const groupMatch = text.match(/(\d{1,2})\s*(người|person|people)/i);

  const totalDays = Number(dayMatch?.[1]);
  const groupSize = Number(groupMatch?.[1]);

  return {
    totalDays:
      Number.isFinite(totalDays) && totalDays > 0 ? Math.min(totalDays, 14) : 1,
    groupSize:
      Number.isFinite(groupSize) && groupSize > 0 ? Math.min(groupSize, 12) : 1,
  };
}

function shouldFetchSuggestedPlaces(intent) {
  return PLACE_SUGGESTION_INTENTS.has(intent);
}

function normalizeSuggestedPlaces(places = []) {
  if (!Array.isArray(places) || places.length === 0) return [];

  const deduped = [];
  const seen = new Set();

  for (const place of places) {
    const placeId = Number(place?.id);
    if (!placeId || seen.has(placeId)) continue;
    seen.add(placeId);
    deduped.push(place);
    if (deduped.length >= MAX_CHAT_SUGGESTED_PLACES) break;
  }

  return deduped;
}

export function useAIAssistant() {
  const sessionContext = useAIContextStore((s) => s.sessionContext);
  const conversationMemory = useAIContextStore((s) => s.conversationMemory);
  const addMessage = useAIContextStore((s) => s.addMessage);
  const setVoiceSpeaking = useAIContextStore((s) => s.setVoiceSpeaking);
  const addVisitedPlace = useAIContextStore((s) => s.addVisitedPlace);

  const accessToken = useAuthStore((s) => s.accessToken);
  const { streamAndSpeak, stop, pause, resume } = useStreamingVoice();
  const { route } = useIntentRouter();

  const abortControllerRef = useRef(null);

  const speakPlace = useCallback(
    (placeId, placeData) => {
      addVisitedPlace(placeId);
      setVoiceSpeaking(placeId);
      streamAndSpeak(
        ENDPOINTS.ai.placeSummary,
        { placeId, context: sessionContext },
        accessToken,
      );
    },
    [
      sessionContext,
      accessToken,
      addVisitedPlace,
      setVoiceSpeaking,
      streamAndSpeak,
    ],
  );

  const sendChatMessage = useCallback(
    async (text) => {
      const { intent } = route(text);
      const payload = buildApiPayload(conversationMemory, text);

      addMessage({ role: "user", content: text });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await apiClient.post(
          ENDPOINTS.ai.chat,
          {
            ...payload,
            context: sessionContext,
            intent,
            stream: false,
          },
          { signal: abortControllerRef.current.signal },
        );

        const aiReply =
          extractAssistantReply(response) ||
          "Mình chưa nhận được nội dung phản hồi, bạn thử lại giúp mình nhé.";

        const suggestedPlaces = normalizeSuggestedPlaces(
          response?.data?.data?.relatedPlaces,
        );

        addMessage({
          role: "assistant",
          content: aiReply,
          suggestedPlaces,
        });
        return { reply: aiReply, intent };
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          return null;
        }
        throw new Error(mapAIError(err));
      }
    },
    [conversationMemory, sessionContext, addMessage, route],
  );

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort();
    stop();
  }, [stop]);

  return { speakPlace, sendChatMessage, stop, pause, resume, cleanup };
}
