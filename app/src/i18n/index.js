import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./locales/en.json";
import vi from "./locales/vi.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

/**
 * Resolve the device language to a supported language code.
 * Returns "vi" if the device locale is Vietnamese, otherwise "en".
 */
export function getDeviceLanguage() {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const primary = locales[0];
      const langCode = primary.languageCode?.toLowerCase();
      if (langCode === "vi") return "vi";
    }
  } catch {
    // expo-localization not available (e.g. web)
  }
  return "en";
}

/**
 * Resolve a language preference to a concrete language code.
 * - "device" → detect from expo-localization
 * - "en" / "vi" → use directly
 * - anything else → fallback to "en"
 */
export function resolveLanguage(langPref) {
  if (langPref === "device") return getDeviceLanguage();
  if (langPref === "en" || langPref === "vi") return langPref;
  return "en";
}

i18n.use(initReactI18next).init({
  resources,
  lng: "vi", // will be overridden by uiStore on hydration
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React handles escaping
  },
  compatibilityJSON: "v4", // for react-native compatibility
});

export default i18n;
