import { API_BASE_CANDIDATES } from "../constants/api";

const PROD_ORIGIN = "https://api.didaugio.vn";

const MEDIA_ORIGINS = API_BASE_CANDIDATES.map((base) =>
  String(base)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, ""),
)
  .filter((value, index, array) => value && array.indexOf(value) === index)
  .sort((a, b) => {
    const aScore =
      Number(a === PROD_ORIGIN) * 3 + Number(a.startsWith("https://")) * 2;
    const bScore =
      Number(b === PROD_ORIGIN) * 3 + Number(b.startsWith("https://")) * 2;
    return bScore - aScore;
  });

function maybeBase64Image(value) {
  const compact = value.replace(/\s/g, "");
  if (compact.length <= 120) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return null;
  return `data:image/jpeg;base64,${compact}`;
}

function escapeUrl(url) {
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
}

function rewriteLocalhostToOrigin(url, origin) {
  if (!url || !origin) return url;
  return url.replace(
    /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?/i,
    origin,
  );
}

export function resolveMediaUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;

  const cleaned = raw.trim().replace(/\\/g, "/");
  if (!cleaned) return null;

  if (cleaned.startsWith("data:")) return cleaned;
  if (/^https?:\/\//i.test(cleaned)) {
    const origin = MEDIA_ORIGINS[0] || PROD_ORIGIN;
    return escapeUrl(rewriteLocalhostToOrigin(cleaned, origin));
  }
  if (cleaned.startsWith("file:")) return cleaned;
  if (cleaned.startsWith("//")) return escapeUrl(`https:${cleaned}`);

  const base64 = maybeBase64Image(cleaned);
  if (base64) return base64;

  const origin = MEDIA_ORIGINS[0] || PROD_ORIGIN;

  if (cleaned.startsWith("/")) {
    return escapeUrl(`${origin}${cleaned}`);
  }

  if (/^api\//i.test(cleaned)) {
    return escapeUrl(`${origin}/${cleaned.replace(/^\/+/, "")}`);
  }

  if (/^(uploads|storage|media|images?)\//i.test(cleaned)) {
    return escapeUrl(`${origin}/${cleaned.replace(/^\/+/, "")}`);
  }

  return escapeUrl(cleaned);
}

export function resolvePlaceImageUri(place) {
  const firstImage = place?.images?.[0];
  const raw =
    firstImage?.secureUrl ||
    firstImage?.thumbnailUrl ||
    firstImage?.imageData ||
    firstImage?.url ||
    place?.thumbnailUrl ||
    place?.thumbnail ||
    null;

  return resolveMediaUrl(raw);
}
