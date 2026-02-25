import Constants from "expo-constants";

const PROD_DEFAULT_API_URL = "https://api.didaugio.vn/api";
const DEV_FALLBACK_API_URL = "http://10.0.2.2:8081/api";

const getRuntimeHost = () => {
  // SDK 54 Expo Go: debuggerHost = "192.168.x.x:8083"
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

  const runtimeHost = getRuntimeHost();
  if (runtimeHost) return `http://${runtimeHost}:8081/api`;

  return DEV_FALLBACK_API_URL;
};

export const API_BASE_URL = __DEV__ ? getDevApiUrl() : PROD_DEFAULT_API_URL;
export const REQUEST_TIMEOUT = 15000;
