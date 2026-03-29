import { useCallback, useRef } from "react";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { useAuthStore } from "../../../stores/authStore";
import { useStreamingVoice } from "./useStreamingVoice";
import { useIntentRouter } from "./useIntentRouter";
import { buildApiPayload } from "../lib/conversationMemory";
import { mapAIError } from "../lib/mapAIError";
import { ENDPOINTS } from "../../../api/endpoints";
import apiClient from "../../../api/client";

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
    [sessionContext, accessToken, addVisitedPlace, setVoiceSpeaking, streamAndSpeak],
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

        const aiReply = response.data?.data?.message ?? "";
        addMessage({ role: "assistant", content: aiReply });
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
