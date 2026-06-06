import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { PREFERENCES_DEFAULT } from "../constants/preferences";
import i18n, { resolveLanguage } from "../i18n";

const storageProvider = typeof window !== "undefined" && window.localStorage
  ? window.localStorage
  : AsyncStorage;

export const useUIStore = create(
  persist(
    (set, get) => ({
      isHydrated: false,
      themePreference: "auto",
      language: "device",
      profileSettings: {
        pushEnabled: true,
        syncEnabled: true,
      },
      preferences: PREFERENCES_DEFAULT,
      hasOnboarded: false,
      toastQueue: [],

      setTheme: (theme) => set({ themePreference: theme }),

      setLanguage: (language) => {
        const validLang = language === "en" || language === "vi" || language === "device"
          ? language
          : "device";
        set({ language: validLang });
        i18n.changeLanguage(resolveLanguage(validLang));
      },

      toggleLanguage: () => {
        const current = get().language;
        const next = current === "en" ? "vi" : "en";
        set({ language: next });
        i18n.changeLanguage(next);
      },

      /** Get the resolved language code (always "en" or "vi") */
      getResolvedLanguage: () => {
        return resolveLanguage(get().language);
      },

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
      storage: createJSONStorage(() => storageProvider),
      onRehydrateStorage: (state) => {
        return (state, error) => {
          if (!error) {
            state.isHydrated = true;
          }
        };
      },
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
