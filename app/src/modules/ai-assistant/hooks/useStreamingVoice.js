import { useRef, useCallback } from "react";
import { Platform } from "react-native";
import { useAIContextStore } from "../../../stores/aiContextStore";
import { API_BASE_URL } from "../../../constants/api";

let EventSource = null;
let Speech = null;
try {
  EventSource = require("react-native-sse").default;
} catch {
  // react-native-sse chưa install
}
try {
  Speech = require("expo-speech");
} catch {
  // expo-speech chưa install
}

export function useStreamingVoice() {
  const speechQueue = useRef([]);
  const isSpeaking = useRef(false);
  const esRef = useRef(null);
  const updateSubtitle = useAIContextStore((s) => s.updateSubtitle);
  const stopVoice = useAIContextStore((s) => s.stopVoice);
  const setVoicePaused = useAIContextStore((s) => s.setVoicePaused);

  const processQueue = useCallback(() => {
    if (speechQueue.current.length === 0) {
      isSpeaking.current = false;
      stopVoice();
      return;
    }
    if (!Speech) {
      isSpeaking.current = false;
      stopVoice();
      return;
    }
    isSpeaking.current = true;
    const text = speechQueue.current.shift();
    updateSubtitle(text);
    Speech.speak(text, {
      language: "vi-VN",
      rate: 0.85,
      pitch: 1.05,
      onDone: processQueue,
      onError: () => {
        isSpeaking.current = false;
        processQueue();
      },
    });
  }, [stopVoice, updateSubtitle]);

  const enqueueSpeech = useCallback(
    (text) => {
      if (!text.trim()) return;
      speechQueue.current.push(text);
      if (!isSpeaking.current) processQueue();
    },
    [processQueue],
  );

  const streamAndSpeak = useCallback(
    (endpoint, body, authToken) => {
      if (!EventSource) {
        console.warn("[StreamingVoice] react-native-sse chưa install");
        return;
      }

      if (esRef.current) esRef.current.close();

      speechQueue.current = [];
      isSpeaking.current = false;
      let buffer = "";

      const fullUrl = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

      const es = new EventSource(fullUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      esRef.current = es;

      es.addEventListener("message", (e) => {
        if (e.data === "[DONE]") {
          es.close();
          if (buffer.trim()) enqueueSpeech(buffer.trim());
          return;
        }
        if (e.data?.startsWith("[ERROR]")) {
          es.close();
          stopVoice();
          return;
        }
        buffer += e.data;
        const sentences = buffer.match(/[^.!?]+[.!?]+/g) ?? [];
        sentences.forEach((s) => {
          enqueueSpeech(s.trim());
          buffer = buffer.replace(s, "");
        });
      });

      es.addEventListener("error", () => {
        es.close();
        stopVoice();
      });
    },
    [enqueueSpeech, stopVoice],
  );

  const pause = useCallback(() => {
    if (Platform.OS === "ios" && Speech) {
      Speech.pause();
      setVoicePaused(true);
    }
  }, [setVoicePaused]);

  const resume = useCallback(() => {
    if (Platform.OS === "ios" && Speech) {
      Speech.resume();
      setVoicePaused(false);
    }
  }, [setVoicePaused]);

  const stop = useCallback(() => {
    esRef.current?.close();
    if (Speech) Speech.stop();
    speechQueue.current = [];
    isSpeaking.current = false;
    stopVoice();
  }, [stopVoice]);

  return { streamAndSpeak, pause, resume, stop };
}
