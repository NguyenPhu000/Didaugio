const __DEV__ = process.env.NODE_ENV !== "production";

export const logger = {
  info: (...args) => {
    if (__DEV__) console.log("[DDG:Info]", ...args);
  },
  warn: (...args) => {
    if (__DEV__) console.warn("[DDG:Warn]", ...args);
  },
  error: (...args) => {
    console.error("[DDG:Error]", ...args);
  },
  debug: (...args) => {
    if (__DEV__) console.log("[DDG:Debug]", ...args);
  },
};
