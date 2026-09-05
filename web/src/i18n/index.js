import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const localeLoaders = import.meta.glob("./locales/*.json");

const lazyLocaleBackend = {
  type: "backend",
  read(language, _namespace, callback) {
    const locale = String(language || "en").toLowerCase().split("-")[0];
    const loader =
      localeLoaders[`./locales/${locale}.json`] ||
      localeLoaders["./locales/en.json"];

    if (!loader) {
      callback(new Error(`Missing locale: ${locale}`), false);
      return;
    }

    loader()
      .then((module) => callback(null, module.default ?? module))
      .catch((error) => callback(error, false));
  },
};

i18n
  .use(LanguageDetector)
  .use(lazyLocaleBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "vi"],
    ns: ["translation"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;
