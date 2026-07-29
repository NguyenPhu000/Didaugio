import Constants from "expo-constants";

// ────────────────────────────────────────────────────────────────────
// Cấu hình môi trường
//
// Thứ tự ưu tiên trong __DEV__:
//   1. Runtime host (LAN)   ← nhanh nhất, không cần public URL
//   2. EXPO_PUBLIC_API_URL (ngrok / public tunnel) — hiện tại hầu hết dev
//   3. EXPO_PUBLIC_API_FALLBACK_URL — backup LAN khi 1+2 chết
//
// Production: lấy EXPO_PUBLIC_API_URL_PROD (BẮT BUỘC phải có, xem eas.json).
// ────────────────────────────────────────────────────────────────────

const DEV_LOCAL_API_PORT =
  process.env.EXPO_PUBLIC_LOCAL_API_PORT?.trim() || "8081";
const DEV_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || "";
const PROD_ENV_API_URL = process.env.EXPO_PUBLIC_API_URL_PROD?.trim() || "";
const DEV_FALLBACK_API_URL =
  process.env.EXPO_PUBLIC_API_FALLBACK_URL?.trim() || "";
const USE_RUNTIME_HOST = process.env.EXPO_PUBLIC_USE_RUNTIME_HOST === "true";

const rewriteFallbackPort = (url) => {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      parsed.port = String(DEV_LOCAL_API_PORT);
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
};

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

// DEV: ưu tiên Runtime host (LAN) → ngrok/public URL → fallback LAN cố định.
const getDevApiUrl = () => {
  if (USE_RUNTIME_HOST) {
    const runtimeHost = getRuntimeHost();
    if (runtimeHost) return `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`;
  }

  if (DEV_ENV_API_URL) return DEV_ENV_API_URL;

  if (DEV_FALLBACK_API_URL) {
    return rewriteFallbackPort(DEV_FALLBACK_API_URL);
  }

  return "";
};

// Production build BẮT BUỘC phải có EXPO_PUBLIC_API_URL_PROD —
// nếu rỗng, in cảnh báo 1 lần trong console để dễ debug.
if (!__DEV__ && !PROD_ENV_API_URL && !DEV_ENV_API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api] Không tìm thấy EXPO_PUBLIC_API_URL_PROD hoặc EXPO_PUBLIC_API_URL — " +
      "mọi request sẽ thất bại. Cập nhật eas.json env block cho profile build.",
  );
}

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

// Dedupe + bảo toàn thứ tự ưu tiên của mảng candidate dùng trong fallback
// khi baseURL đầu tiên bị ERR_NETWORK/ECONNABORTED.
const buildApiCandidates = () => {
  const runtimeHost = getRuntimeHost();
  const runtimeUrl =
    USE_RUNTIME_HOST && runtimeHost
      ? `http://${runtimeHost}:${DEV_LOCAL_API_PORT}/api`
      : null;
  const fallbackUrl = DEV_FALLBACK_API_URL
    ? rewriteFallbackPort(DEV_FALLBACK_API_URL)
    : null;

  // Thứ tự đã được định nghĩa ở getDevApiUrl:
  //   runtime host (nếu bật) > EXPO_PUBLIC_API_URL > EXPO_PUBLIC_API_FALLBACK_URL
  // Khi tắt runtime-host, ngrok URL chiếm vị trí đầu.
  const ordered = USE_RUNTIME_HOST
    ? [runtimeUrl, DEV_ENV_API_URL, fallbackUrl]
    : [DEV_ENV_API_URL, runtimeUrl, fallbackUrl];

  return ordered.filter(
    (value, index, array) => value && array.indexOf(value) === index,
  );
};

export const API_BASE_CANDIDATES = __DEV__
  ? buildApiCandidates()
  : [PROD_ENV_API_URL || DEV_ENV_API_URL].filter(Boolean);
