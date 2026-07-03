import Constants from "expo-constants";

const DEV_LOCAL_API_PORT =
  process.env.EXPO_PUBLIC_LOCAL_API_PORT?.trim() || "8081";
const DEV_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || "";
const PROD_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL_PROD?.trim() || "";
const DEV_FALLBACK_API_URL =
  process.env.EXPO_PUBLIC_API_FALLBACK_URL?.trim() || "";
const USE_RUNTIME_HOST = process.env.EXPO_PUBLIC_USE_RUNTIME_HOST === "true";

const getRuntimeHost = () => {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!debuggerHost) return null;
  const host = debuggerHost.split(":")[0];
  return host || null;
};

const getDevApiUrl = () => {
  if (DEV_ENV_API_URL) return DEV_ENV_API_URL;

  if (USE_RUNTIME_HOST) {
    const runtimeHost = getRuntimeHost();
    if (runtimeHost) return `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`;
  }

  if (DEV_FALLBACK_API_URL) {
    return DEV_FALLBACK_API_URL.replace(":8081/", `:${DEV_LOCAL_API_PORT}/`);
  }

  return "";
};

export const API_BASE_URL = __DEV__
  ? getDevApiUrl()
  : PROD_ENV_API_URL || DEV_ENV_API_URL;
export const REQUEST_TIMEOUT = 15000;

/** AI + routing có thể > 15s; override qua EXPO_PUBLIC_AI_REQUEST_TIMEOUT (ms) */
const parsedAiTimeout = Number(
  process.env.EXPO_PUBLIC_AI_REQUEST_TIMEOUT?.trim(),
);
export const AI_REQUEST_TIMEOUT =
  Number.isFinite(parsedAiTimeout) && parsedAiTimeout > REQUEST_TIMEOUT
    ? parsedAiTimeout
    : 120000;

const buildApiCandidates = () => {
  const runtimeHost = getRuntimeHost();
  const runtimeUrl =
    USE_RUNTIME_HOST && runtimeHost
      ? `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`
      : null;
  const fallbackUrl = DEV_FALLBACK_API_URL
    ? DEV_FALLBACK_API_URL.replace(":8081/", `:${DEV_LOCAL_API_PORT}/`)
    : null;

  return [DEV_ENV_API_URL, runtimeUrl, fallbackUrl, PROD_ENV_API_URL].filter(
    (value, index, array) => value && array.indexOf(value) === index,
  );
};

export const API_BASE_CANDIDATES = __DEV__
  ? buildApiCandidates()
  : [PROD_ENV_API_URL || DEV_ENV_API_URL].filter(Boolean);
