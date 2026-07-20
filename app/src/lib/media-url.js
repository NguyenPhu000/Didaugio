import { API_BASE_CANDIDATES, API_BASE_URL } from "../constants/api";

const PROD_ORIGIN = "https://api.didaugio.vn";

const MEDIA_ORIGINS = API_BASE_CANDIDATES.map((base) =>
  String(base)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, ""),
)
  .filter((value, index, array) => value && array.indexOf(value) === index)
  .sort((a, b) => {
    // 1. Ưu tiên API_BASE_URL hiện tại của ứng dụng
    const currentOrigin = API_BASE_URL
      ? String(API_BASE_URL).replace(/\/+$/, "").replace(/\/api$/i, "")
      : "";
    const aCurrent = a === currentOrigin;
    const bCurrent = b === currentOrigin;
    if (aCurrent && !bCurrent) return -1;
    if (!aCurrent && bCurrent) return 1;

    // 2. Dự phòng (các quy tắc cũ)
    const aScore =
      Number(a === PROD_ORIGIN) * 3 + Number(a.startsWith("https://")) * 2;
    const bScore =
      Number(b === PROD_ORIGIN) * 3 + Number(b.startsWith("https://")) * 2;
    return bScore - aScore;
  });

function maybeBase64Image(value) {
  if (typeof value !== "string") return null;
  // Strip ALL whitespace, newlines, carriage returns
  const compact = value.replace(/[\s\r\n]/g, "");
  // Must be long enough to represent an image (minimum ~100 bytes)
  if (compact.length <= 100) return null;
  // Allow Standard Base64 and Base64Url characters
  if (!/^[A-Za-z0-9+/=\-_]+$/.test(compact)) return null;

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

/**
 * Tr\u1ea3 v\u1ec1 icon name + m\u00e0u s\u1eafc d\u1ef1a tr\u00ean category \u0111\u1ec3 hi\u1ec3n th\u1ecb placeholder
 * khi \u0111\u1ecba \u0111i\u1ec3m kh\u00f4ng c\u00f3 \u1ea3nh th\u1eadt. Kh\u00f4ng d\u00f9ng \u1ea3nh picsum random n\u1eefa.
 */
export function getCategoryIcon(categoryName = "") {
  const name = String(categoryName || "").toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (name.includes("an") || name.includes("uong") || name.includes("food") || name.includes("cafe") || name.includes("nha hang") || name.includes("quan")) {
    return { icon: "restaurant", color: "#F97316" }; // orange
  }
  if (name.includes("khach san") || name.includes("hotel") || name.includes("resort") || name.includes("homestay") || name.includes("luu tru")) {
    return { icon: "hotel", color: "#8B5CF6" }; // violet
  }
  if (name.includes("mua sam") || name.includes("shopping") || name.includes("cho") || name.includes("market") || name.includes("cua hang")) {
    return { icon: "shopping-bag", color: "#EC4899" }; // pink
  }
  if (name.includes("chua") || name.includes("dinh") || name.includes("pagoda") || name.includes("van hoa") || name.includes("bao tang") || name.includes("museum") || name.includes("lich su")) {
    return { icon: "account-balance", color: "#A16207" }; // amber
  }
  if (name.includes("giai tri") || name.includes("vui choi") || name.includes("attractions") || name.includes("thien nhien") || name.includes("sinh thai") || name.includes("nature") || name.includes("kdl")) {
    return { icon: "park", color: "#16A34A" }; // green
  }
  return { icon: "place", color: "#64748B" }; // slate
}

/**
 * @deprecated D\u00f9ng getCategoryIcon() thay v\u00ec picsum random.
 * Gi\u1eef l\u1ea1i \u0111\u1ec3 kh\u00f4ng break c\u00e1c import c\u0169 nh\u01b0ng lu\u00f4n tr\u1ea3 null.
 */
export function getCategoryPlaceholder() {
  return null;
}

function pickImageValue(source) {
  if (typeof source === "string") return source;
  if (!source || typeof source !== "object") return null;

  return (
    source.secureUrl ||
    source.secure_url ||
    source.thumbnailUrl ||
    source.thumbnail_url ||
    source.imageUrl ||
    source.image_url ||
    source.imageData ||
    source.image_data ||
    source.mediaData ||
    source.media_data ||
    source.url ||
    source.uri ||
    null
  );
}

function pickPlaceImageValue(place) {
  if (!place || typeof place !== "object") return null;

  const firstImage = Array.isArray(place.images) ? place.images[0] : null;

  return (
    pickImageValue(firstImage) ||
    place.markerImageUri ||
    place.marker_image_uri ||
    place.markerUrl ||
    place.marker_url ||
    place.secureUrl ||
    place.secure_url ||
    place.thumbnailUrl ||
    place.thumbnail_url ||
    place.thumbnail ||
    place.imageUrl ||
    place.image_url ||
    place.imageData ||
    place.image_data ||
    place.mediaData ||
    place.media_data ||
    place.image ||
    place.coverImage ||
    place.cover_image ||
    place.coverUrl ||
    place.cover_url ||
    place.photoUrl ||
    place.photo_url ||
    place.url ||
    place.uri ||
    null
  );
}

export function resolvePlaceImageUri(place) {
  if (!place) return getCategoryPlaceholder();

  const resolved = resolveMediaUrl(pickPlaceImageValue(place));
  if (resolved) return resolved;
  return getCategoryPlaceholder();
}

/**
 * Ảnh bìa/thumbnail cho trip card — cùng logic với EditTripModal (resolveMediaUrl trước).
 * Trả về `null` nếu không có ảnh thật (không dùng picsum fake).
 */
export function resolveTripCoverUri(trip, width = 400) {
  if (!trip || typeof trip !== "object") return null;

  const tripThumb = resolveMediaUrl(
    trip.thumbnail ||
      trip.thumbnailUrl ||
      trip.thumbnail_url ||
      trip.coverImage ||
      trip.cover_image ||
      trip.imageUrl ||
      trip.image_url,
  );
  if (tripThumb) {
    if (tripThumb.startsWith("data:")) return tripThumb;
    if (tripThumb.includes("res.cloudinary.com")) {
      return getOptimizedCloudinaryUrl(tripThumb, width) || tripThumb;
    }
    return tripThumb;
  }

  const destinations = Array.isArray(trip.destinations) ? trip.destinations : [];
  for (const dest of destinations) {
    const place = dest?.place;
    if (!place) continue;
    const resolved = resolveMediaUrl(pickPlaceImageValue(place));
    if (resolved) {
      if (resolved.includes("res.cloudinary.com")) {
        return getOptimizedCloudinaryUrl(resolved, width) || resolved;
      }
      return resolved;
    }
  }

  return null;
}

export function getOptimizedCloudinaryUrl(url, width = 800) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;

  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return url;

  const prefix = url.slice(0, markerIndex + marker.length);
  const suffix = url.slice(markerIndex + marker.length);
  const segments = suffix.split("/");
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex < 0) return url;

  const publicPath = segments.slice(versionIndex).join("/");
  return `${prefix}f_auto,q_auto,w_${width},c_fill/${publicPath}`;
}
