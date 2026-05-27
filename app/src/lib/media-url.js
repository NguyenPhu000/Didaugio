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

export function getCategoryPlaceholder(categoryName = "") {
  const name = String(categoryName).toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (name.includes("an") || name.includes("uong") || name.includes("food") || name.includes("cafe") || name.includes("nha hang") || name.includes("quan")) {
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop";
  }
  if (name.includes("khach san") || name.includes("hotel") || name.includes("resort") || name.includes("homestay") || name.includes("luu tru")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop";
  }
  if (name.includes("mua sam") || name.includes("shopping") || name.includes("cho") || name.includes("market") || name.includes("cua hang")) {
    return "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop";
  }
  if (name.includes("chua") || name.includes("dinh") || name.includes("pagoda") || name.includes("van hoa") || name.includes("bao tang") || name.includes("museum") || name.includes("lich su")) {
    return "https://images.unsplash.com/photo-1542051812871-757511640570?w=600&auto=format&fit=crop";
  }
  if (name.includes("giai tri") || name.includes("vui choi") || name.includes("attractions") || name.includes("thien nhien") || name.includes("sinh thai") || name.includes("nature") || name.includes("kdl")) {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1527668752968-14ce70a6a7ae?w=600&auto=format&fit=crop";
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

  const resolved = resolveMediaUrl(raw);
  if (resolved) return resolved;
  return getCategoryPlaceholder(place?.category?.name);
}
