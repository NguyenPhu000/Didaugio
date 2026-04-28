import { API_BASE_URL } from "@/constants/constants";

const RELATIVE_MEDIA_PREFIX_REGEX = /^(api|uploads|storage|media|images?)\//i;
const LOCALHOST_OR_LAN_REGEX =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?/i;

/**
 * Lấy origin server (bỏ hậu tố /api) để ghép đường dẫn tĩnh nếu có.
 */
function getServerOrigin() {
  try {
    const u = new URL(API_BASE_URL);
    return u.origin;
  } catch {
    return "";
  }
}

function safeEncodeUri(value) {
  try {
    return encodeURI(value);
  } catch {
    return value;
  }
}

function asDataUrlIfBase64(value) {
  const compact = value.replace(/\s/g, "");
  if (compact.length <= 120) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return null;
  return `data:image/jpeg;base64,${compact}`;
}

function rewriteLocalhostToServerOrigin(url, origin) {
  if (!origin) return url;
  return url.replace(LOCALHOST_OR_LAN_REGEX, origin);
}

/**
 * Chuẩn hóa URL hiển thị ảnh/PDF: https, data URI, đường dẫn /uploads/..., v.v.
 */
export function resolveMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().replace(/\\/g, "/");
  if (!s) return null;

  const serverOrigin = getServerOrigin();

  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) {
    return safeEncodeUri(rewriteLocalhostToServerOrigin(s, serverOrigin));
  }
  if (s.startsWith("//")) return safeEncodeUri(`https:${s}`);

  const base64DataUrl = asDataUrlIfBase64(s);
  if (base64DataUrl) return base64DataUrl;

  if (s.startsWith("/")) {
    return serverOrigin
      ? safeEncodeUri(`${serverOrigin}${s}`)
      : safeEncodeUri(s);
  }

  if (RELATIVE_MEDIA_PREFIX_REGEX.test(s)) {
    const normalized = s.replace(/^\/+/, "");
    return serverOrigin
      ? safeEncodeUri(`${serverOrigin}/${normalized}`)
      : safeEncodeUri(`/${normalized}`);
  }

  return safeEncodeUri(s);
}

export function isPdfSource(resolved) {
  if (!resolved || typeof resolved !== "string") return false;
  if (resolved.startsWith("data:application/pdf")) return true;
  const base = resolved.split("?")[0].toLowerCase();
  return base.endsWith(".pdf");
}

export function isImageSource(resolved) {
  if (!resolved || typeof resolved !== "string") return false;
  if (resolved.startsWith("data:image/")) return true;
  if (resolved.startsWith("data:")) return false;
  const base = resolved.split("?")[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(base);
}
