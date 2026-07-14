import { create } from "zustand";
import safeAsyncStorage from "../utils/safeAsyncStorage";
import { createRandomId } from "../utils/createRandomId";

const { persist, createJSONStorage } = require("zustand/middleware");

const MAX_CONVERSATION_MESSAGES = 20;

function trimMessages(messages) {
  return messages.slice(-MAX_CONVERSATION_MESSAGES);
}

function normalizeConversationMessage(message) {
  if (!message || typeof message !== "object") return null;

  return {
    ...message,
    id: message.id || createRandomId("message"),
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
        currentCity: null,
        visitedPlaceIds: [],
        currentPlaceId: null,
        preferences: null,
        userProfile: null,
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

      setCurrentCity: (city) =>
        set((s) => ({
          sessionContext: { ...s.sessionContext, currentCity: city },
        })),

      setUserProfile: (profile) =>
        set((s) => ({
          sessionContext: { ...s.sessionContext, userProfile: profile },
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
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (s) => ({
        sessionContext: {
          visitedPlaceIds: s.sessionContext.visitedPlaceIds,
          preferences: s.sessionContext.preferences,
          userProfile: s.sessionContext.userProfile,
          currentCity: s.sessionContext.currentCity,
          timeOfDay: s.sessionContext.timeOfDay,
          currentPlaceId: s.sessionContext.currentPlaceId,
          currentLocation: s.sessionContext.currentLocation,
        },
        intentHistory: s.intentHistory.slice(-10),
      }),
      version: 2,
      migrate: (persistedState) => {
        if (persistedState) {
          delete persistedState.conversationMemory;
        }
        return persistedState;
      },
    },
  ),
);
