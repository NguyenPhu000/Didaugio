import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { persist, createJSONStorage } = require("zustand/middleware");

const MAX_PLANNER_MESSAGES = 40;

function createInitialState() {
  return {
    messages: [],
    draftPlan: null,
    selectedPlaceIds: [],
    lastPreferences: null,
  };
}

function trimPlannerMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_PLANNER_MESSAGES);
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
    id: message.id || `${Date.now()}`,
    role: message.role || "assistant",
    text: message.text ?? message.content ?? "",
    createdAt,
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
            messages: trimPlannerMessages([...s.messages, normalized]),
          };
        }),

      setMessages: (messages) =>
        set({
          messages: trimPlannerMessages(
            messages.map(normalizeMessage).filter(Boolean),
          ),
        }),

      clearMessages: () => set({ messages: [] }),

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        messages: trimPlannerMessages(s.messages),
        draftPlan: s.draftPlan,
        selectedPlaceIds: normalizePlaceIds(s.selectedPlaceIds),
        lastPreferences: s.lastPreferences,
      }),
    },
  ),
);
