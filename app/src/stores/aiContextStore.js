import { create } from "zustand";

const MAX_CONVERSATION_MESSAGES = 20;

function trimMessages(messages) {
  return messages.slice(-MAX_CONVERSATION_MESSAGES);
}

export const useAIContextStore = create((set, get) => ({
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
        visitedPlaceIds: [...new Set([...s.sessionContext.visitedPlaceIds, id])],
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
      voiceState: { ...s.voiceState, speaking: true, paused: false, placeId },
    })),

  setVoicePaused: (paused) =>
    set((s) => ({ voiceState: { ...s.voiceState, paused } })),

  stopVoice: () =>
    set((s) => ({
      voiceState: { ...s.voiceState, speaking: false, paused: false, subtitle: "", placeId: null },
    })),

  addMessage: (msg) =>
    set((s) => ({
      conversationMemory: trimMessages([...s.conversationMemory, msg]),
    })),

  clearConversation: () => set({ conversationMemory: [] }),

  addIntent: (intent) =>
    set((s) => ({
      intentHistory: [...s.intentHistory.slice(-10), intent],
    })),
}));
