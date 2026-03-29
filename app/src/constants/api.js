import Constants from "expo-constants";

const PROD_DEFAULT_API_URL = "https://api.didaugio.vn/api";
const DEV_FALLBACK_API_URL = "http://10.0.2.2:8081/api";
const DEV_LOCAL_API_PORT = process.env.EXPO_PUBLIC_LOCAL_API_PORT?.trim() || "8081";

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
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envApiUrl) return envApiUrl;

  const shouldUseLocalApi = process.env.EXPO_PUBLIC_USE_LOCAL_API === "true";
  if (!shouldUseLocalApi) return PROD_DEFAULT_API_URL;

  const runtimeHost = getRuntimeHost();
  if (runtimeHost) return `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`;

  return DEV_FALLBACK_API_URL.replace(":8081/", `:${DEV_LOCAL_API_PORT}/`);
};

export const API_BASE_URL = __DEV__ ? getDevApiUrl() : PROD_DEFAULT_API_URL;
export const REQUEST_TIMEOUT = 15000;

const buildApiCandidates = () => {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const runtimeHost = getRuntimeHost();
  const runtimeUrl = runtimeHost
    ? `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`
    : null;
  const fallbackUrl = DEV_FALLBACK_API_URL.replace(
    ":8081/",
    `:${DEV_LOCAL_API_PORT}/`,
  );

  return [envApiUrl, runtimeUrl, fallbackUrl, PROD_DEFAULT_API_URL].filter(
    (value, index, array) => value && array.indexOf(value) === index,
  );
};

export const API_BASE_CANDIDATES = __DEV__
  ? buildApiCandidates()
  : [PROD_DEFAULT_API_URL];
