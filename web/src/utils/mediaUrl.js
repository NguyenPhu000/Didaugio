import { API_BASE_URL } from "@/constants/constants";

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

/**
 * Chuẩn hóa URL hiển thị ảnh/PDF: https, data URI, đường dẫn /uploads/..., v.v.
 */
export function resolveMediaUrl(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) {
    const origin = getServerOrigin();
    return origin ? `${origin}${s}` : s;
  }
  return s;
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
