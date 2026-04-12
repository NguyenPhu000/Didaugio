import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { persist, createJSONStorage } = require("zustand/middleware");

const MAX_CONVERSATION_MESSAGES = 20;

function trimMessages(messages) {
  return messages.slice(-MAX_CONVERSATION_MESSAGES);
}

function normalizeConversationMessage(message) {
  if (!message || typeof message !== "object") return null;

  return {
    ...message,
    id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: message.role === "user" ? "user" : "assistant",
    content:
      typeof message.content === "string"
        ? message.content
        : String(message.text ?? ""),
    createdAt: message.createdAt
      ? new Date(message.createdAt).toISOString()
      : new Date().toISOString(),
    suggestedPlaces: Array.isArray(message.suggestedPlaces)
      ? message.suggestedPlaces
      : [],
  };
}

export const useAIContextStore = create(
  persist(
    (set) => ({
      sessionContext: {
        currentLocation: null,
        visitedPlaceIds: [],
        currentPlaceId: null,
        preferences: null,
        timeOfDay: null,
      },

      conversationMemory: [],

      voiceState: {
        speaking: false,
        paused: false,
        rate: 0.85,
        placeId: null,
        subtitle: "",
      },

      intentHistory: [],

      updateLocation: (coords) =>
        set((s) => ({
          sessionContext: { ...s.sessionContext, currentLocation: coords },
        })),

      addVisitedPlace: (id) =>
        set((s) => ({
          sessionContext: {
            ...s.sessionContext,
            visitedPlaceIds: [
              ...new Set([...s.sessionContext.visitedPlaceIds, id]),
            ],
          },
        })),

      setPreferences: (prefs) =>
        set((s) => ({
          sessionContext: { ...s.sessionContext, preferences: prefs },
        })),

      setTimeOfDay: (timeOfDay) =>
        set((s) => ({
          sessionContext: { ...s.sessionContext, timeOfDay },
        })),

      updateSubtitle: (text) =>
        set((s) => ({ voiceState: { ...s.voiceState, subtitle: text } })),

      setVoiceSpeaking: (placeId) =>
        set((s) => ({
          voiceState: {
            ...s.voiceState,
            speaking: true,
            paused: false,
            placeId,
          },
        })),

      setVoicePaused: (paused) =>
        set((s) => ({ voiceState: { ...s.voiceState, paused } })),

      stopVoice: () =>
        set((s) => ({
          voiceState: {
            ...s.voiceState,
            speaking: false,
            paused: false,
            subtitle: "",
            placeId: null,
          },
        })),

      addMessage: (msg) =>
        set((s) => {
          const normalized = normalizeConversationMessage(msg);
          if (!normalized) {
            return { conversationMemory: s.conversationMemory };
          }

          return {
            conversationMemory: trimMessages([
              ...s.conversationMemory,
              normalized,
            ]),
          };
        }),

      clearConversation: () => set({ conversationMemory: [] }),

      addIntent: (intent) =>
        set((s) => ({
          intentHistory: [...s.intentHistory.slice(-10), intent],
        })),
    }),
    {
      name: "ai-context-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        sessionContext: {
          visitedPlaceIds: s.sessionContext.visitedPlaceIds,
          preferences: s.sessionContext.preferences,
          timeOfDay: s.sessionContext.timeOfDay,
          currentPlaceId: s.sessionContext.currentPlaceId,
          currentLocation: s.sessionContext.currentLocation,
        },
        conversationMemory: trimMessages(
          s.conversationMemory
            .map(normalizeConversationMessage)
            .filter(Boolean),
        ),
        intentHistory: s.intentHistory.slice(-10),
      }),
    },
  ),
);
