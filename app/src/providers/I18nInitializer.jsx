import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";
import { resolveLanguage } from "../i18n";
import i18n from "../i18n";

/**
 * Syncs the persisted language preference from uiStore with i18next.
 * Must be rendered inside the component tree so Zustand is hydrated.
 */
export function I18nInitializer({ children }) {
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    const resolved = resolveLanguage(language || "device");
    if (i18n.language !== resolved) {
      i18n.changeLanguage(resolved);
    }
  }, [language]);

  return children;
}
