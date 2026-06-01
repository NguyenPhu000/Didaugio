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
  // Strip ALL whitespace (including \n from multi-line base64 strings)
  const compact = value.replace(/\s/g, "");
  // Must be long enough to represent an image (minimum ~200 bytes)
  if (compact.length <= 200) return null;
  // Must only contain valid Base64 characters
  if (!/^[A-Za-z0-9+/]+=*$/.test(compact)) return null;

  // Detect MIME type from Base64 prefix (first 8 chars encode the magic bytes)
  // JPEG starts with /9j/ in Base64 (FF D8 FF)
  // PNG starts with iVBOR in Base64 (89 50 4E 47)
  // GIF starts with R0lGOD in Base64 (47 49 46)
  // WEBP starts with UklGR in Base64 (52 49 46 46)
  const head = compact.slice(0, 12);
  if (head.startsWith("/9j/")) return `data:image/jpeg;base64,${compact}`;
  if (head.startsWith("iVBOR")) return `data:image/png;base64,${compact}`;
  if (head.startsWith("R0lGOD")) return `data:image/gif;base64,${compact}`;
  if (head.startsWith("UklGR")) return `data:image/webp;base64,${compact}`;

  // Valid Base64 but unknown type — assume JPEG (most common in this project)
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

  // Already a data URI
  if (cleaned.startsWith("data:")) return cleaned;

  // Remote URL — rewrite localhost to actual server origin, but never touch cloudinary/picsum
  if (/^https?:\/\//i.test(cleaned)) {
    const isExternal =
      cleaned.includes("cloudinary.com") ||
      cleaned.includes("picsum.photos") ||
      cleaned.includes("unsplash.com") ||
      cleaned.includes("googleapis.com") ||
      cleaned.includes("googleusercontent.com");

    if (isExternal) return escapeUrl(cleaned);

    const origin = MEDIA_ORIGINS[0] || PROD_ORIGIN;
    return escapeUrl(rewriteLocalhostToOrigin(cleaned, origin));
  }

  if (cleaned.startsWith("file:")) return cleaned;
  if (cleaned.startsWith("//")) return escapeUrl(`https:${cleaned}`);

  // Try to interpret as raw Base64
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
  const name = String(categoryName || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (name.includes("an") || name.includes("uong") || name.includes("food") || name.includes("cafe") || name.includes("nha hang") || name.includes("quan")) {
    return "https://picsum.photos/id/292/600/400";
  }
  if (name.includes("khach san") || name.includes("hotel") || name.includes("resort") || name.includes("homestay") || name.includes("luu tru")) {
    return "https://picsum.photos/id/838/600/400";
  }
  if (name.includes("mua sam") || name.includes("shopping") || name.includes("cho") || name.includes("market") || name.includes("cua hang")) {
    return "https://picsum.photos/id/102/600/400";
  }
  if (name.includes("chua") || name.includes("dinh") || name.includes("pagoda") || name.includes("van hoa") || name.includes("bao tang") || name.includes("museum") || name.includes("lich su")) {
    return "https://picsum.photos/id/1040/600/400";
  }
  if (name.includes("giai tri") || name.includes("vui choi") || name.includes("attractions") || name.includes("thien nhien") || name.includes("sinh thai") || name.includes("nature") || name.includes("kdl")) {
    return "https://picsum.photos/id/10/600/400";
  }
  return "https://picsum.photos/id/408/600/400";
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
