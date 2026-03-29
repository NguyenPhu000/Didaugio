import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREFERENCES_DEFAULT } from "../constants/preferences";

export const useUIStore = create(
  persist(
    (set) => ({
      themePreference: "auto",
      preferences: PREFERENCES_DEFAULT,
      hasOnboarded: false,
      toastQueue: [],

      setTheme: (theme) => set({ themePreference: theme }),

      setPreferences: (prefs) => set({ preferences: prefs }),

      updatePreferences: (partial) =>
        set((s) => ({ preferences: { ...s.preferences, ...partial } })),

      completeOnboard: () => set({ hasOnboarded: true }),

      addToast: (toast) =>
        set((s) => ({ toastQueue: [...s.toastQueue, { id: Date.now(), ...toast }] })),

      dismissToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),

      clearToasts: () => set({ toastQueue: [] }),
    }),
    {
      name: "ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themePreference: s.themePreference,
        preferences: s.preferences,
        hasOnboarded: s.hasOnboarded,
      }),
    },
  ),
);
