import { create } from "zustand";
import safeAsyncStorage from "../utils/safeAsyncStorage";
import { createRandomId } from "../utils/createRandomId";
import {
  normalizeMessageCreatedAt,
  trimPersistedMessages,
} from "./aiPlannerRetention";
import { removeDraftPreviewMessages } from "./aiPlannerMessageHelpers";

export { trimPersistedMessages } from "./aiPlannerRetention";
export { removeDraftPreviewMessages } from "./aiPlannerMessageHelpers";

const { persist, createJSONStorage } = require("zustand/middleware");

function createInitialState() {
  return {
    messages: [],
    draftPlan: null,
    selectedPlaceIds: [],
    lastPreferences: null,
  };
}

function normalizePlaceIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => Number(id)).filter(Boolean))];
}

function normalizeMessage(message) {
  if (!message || typeof message !== "object") return null;

  const createdAt = normalizeMessageCreatedAt(message.createdAt);

  return {
    ...message,
    id: message.id || createRandomId("message"),
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
            messages: trimPersistedMessages([...s.messages, normalized]),
          };
        }),

      replaceDraftPreviewMessage: (message) =>
        set((s) => {
          const normalized = normalizeMessage({
            ...message,
            isDraftPreview: true,
          });
          if (!normalized) return { messages: s.messages };
          return {
            messages: trimPersistedMessages([
              ...removeDraftPreviewMessages(s.messages),
              normalized,
            ]),
          };
        }),

      setMessages: (messages) =>
        set({
          messages: trimPersistedMessages(
            (Array.isArray(messages) ? messages : [])
              .map(normalizeMessage)
              .filter(Boolean),
          ),
        }),

      clearMessages: () => set({ messages: [] }),

      clearChatMessages: () =>
        set((s) => ({
          messages: trimPersistedMessages(
            s.messages.filter((m) => m.source !== "chat"),
          ),
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
        messages: trimPersistedMessages(s.messages),
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
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        messages: trimPersistedMessages(persistedState?.messages),
      }),
      version: 2,
    },
  ),
);
