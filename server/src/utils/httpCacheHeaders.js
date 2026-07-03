/**
 * Cache-Control cho API danh sách ít đổi (categories, districts, wards).
 * Giảm tải server & giúp mobile/Expo bám plan HTTP cache (docs/plan §3.3).
 * Ghi đè: HTTP_CACHE_STATIC_LIST_SEC (giây), mặc định 120.
 */
const maxAgeSec = (() => {
  const n = parseInt(String(process.env.HTTP_CACHE_STATIC_LIST_SEC || "120"), 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 86400) : 120;
})();

export function setPublicListCache(res, req) {
  const hasAuth = req && (req.headers?.authorization || req.headers?.Authorization);
  const noCacheQuery = req && req.query && req.query.noCache === "true";

  if (hasAuth || noCacheQuery) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
  } else {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${maxAgeSec}, stale-while-revalidate=${Math.min(60, maxAgeSec)}`,
    );
  }
}
