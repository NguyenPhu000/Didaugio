import { create } from "zustand";
import safeAsyncStorage from "../utils/safeAsyncStorage";

const { persist, createJSONStorage } = require("zustand/middleware");

const MAX_MESSAGES = 60;

function createInitialState() {
  return {
    messages: [],
    draftPlan: null,
    selectedPlaceIds: [],
    lastPreferences: null,
  };
}

function trimMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_MESSAGES);
}

function normalizePlaceIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => Number(id)).filter(Boolean))];
}

function normalizeMessage(message) {
  if (!message || typeof message !== "object") return null;

  const createdAt = message.createdAt
    ? new Date(message.createdAt).toISOString()
    : new Date().toISOString();

  return {
    ...message,
    id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: message.role || "assistant",
    text: message.text ?? message.content ?? "",
    createdAt,
    source: message.source || "planner",
    selectedPlaceIds: normalizePlaceIds(message.selectedPlaceIds),
    suggestedPlaces: Array.isArray(message.suggestedPlaces)
      ? message.suggestedPlaces
      : [],
  };
}

export const useAIPlannerStore = create(
  persist(
    (set) => ({
      ...createInitialState(),

      appendMessage: (message) =>
        set((s) => {
          const normalized = normalizeMessage(message);
          if (!normalized) return { messages: s.messages };
          return {
            messages: trimMessages([...s.messages, normalized]),
          };
        }),

      setMessages: (messages) =>
        set({
          messages: trimMessages(
            messages.map(normalizeMessage).filter(Boolean),
          ),
        }),

      clearMessages: () => set({ messages: [] }),

      clearChatMessages: () =>
        set((s) => ({
          messages: s.messages.filter((m) => m.source !== "chat"),
        })),

      setDraftPlan: (draftPlan) => set({ draftPlan: draftPlan || null }),

      setSelectedPlaceIds: (nextIds) =>
        set((s) => {
          const resolved =
            typeof nextIds === "function"
              ? nextIds(s.selectedPlaceIds)
              : nextIds;
          return {
            selectedPlaceIds: normalizePlaceIds(resolved),
          };
        }),

      setLastPreferences: (payload) =>
        set({ lastPreferences: payload || null }),

      resetPlannerState: () => set(createInitialState()),
    }),
    {
      name: "ai-planner-store",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (s) => ({
        messages: trimMessages(s.messages),
        draftPlan: s.draftPlan,
        selectedPlaceIds: normalizePlaceIds(s.selectedPlaceIds),
        lastPreferences: s.lastPreferences,
      }),
      migrate: (persistedState, version) => {
        if (persistedState?.messages) {
          persistedState.messages = persistedState.messages.map((m) => ({
            ...m,
            source: m.source || "planner",
            text: m.text ?? m.content ?? "",
          }));
        }
        return persistedState;
      },
      version: 2,
    },
  ),
);
