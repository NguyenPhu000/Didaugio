import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREFERENCES_DEFAULT } from "../constants/preferences";

const { persist, createJSONStorage } = require("zustand/middleware");

export const useUIStore = create(
  persist(
    (set) => ({
      themePreference: "auto",
      language: "vi",
      profileSettings: {
        pushEnabled: true,
        syncEnabled: true,
      },
      preferences: PREFERENCES_DEFAULT,
      hasOnboarded: false,
      toastQueue: [],

      setTheme: (theme) => set({ themePreference: theme }),

      setLanguage: (language) =>
        set({ language: language === "en" ? "en" : "vi" }),

      toggleLanguage: () =>
        set((s) => ({ language: s.language === "en" ? "vi" : "en" })),

      updateProfileSettings: (partial) =>
        set((s) => ({
          profileSettings: { ...s.profileSettings, ...partial },
        })),

      setPreferences: (prefs) => set({ preferences: prefs }),

      updatePreferences: (partial) =>
        set((s) => ({ preferences: { ...s.preferences, ...partial } })),

      completeOnboard: () => set({ hasOnboarded: true }),

      addToast: (toast) =>
        set((s) => ({
          toastQueue: [...s.toastQueue, { id: Date.now(), ...toast }],
        })),

      dismissToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),

      clearToasts: () => set({ toastQueue: [] }),
    }),
    {
      name: "ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themePreference: s.themePreference,
        language: s.language,
        profileSettings: s.profileSettings,
        preferences: s.preferences,
        hasOnboarded: s.hasOnboarded,
      }),
    },
  ),
);
