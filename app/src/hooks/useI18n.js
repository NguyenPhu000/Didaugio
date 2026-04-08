import { useCallback } from "react";
import { useUIStore } from "../stores/uiStore";

/**
 * Minimal i18n helper for VN/EN copy.
 * Usage: t("xin chao", "hello", { name: "Nhi" })
 */
export function useI18n() {
  const language = useUIStore((s) => s.language || "vi");
  const setLanguage = useUIStore((s) => s.setLanguage);
  const toggleLanguage = useUIStore((s) => s.toggleLanguage);

  const t = useCallback(
    (viText, enText, params) => {
      const base = language === "en" ? (enText ?? viText) : viText;
      if (!params || typeof base !== "string") return base;

      return base.replace(/\{(\w+)\}/g, (_, key) => {
        const value = params[key];
        return value == null ? `{${key}}` : String(value);
      });
    },
    [language],
  );

  return {
    language,
    isEnglish: language === "en",
    setLanguage,
    toggleLanguage,
    t,
  };
}
