import NodeCache from "node-cache";
import logger from "../../config/logger.js";

/**
 * Server-side cache service using node-cache.
 * Abstraction layer designed to swap to Redis (ioredis) when scaling.
 *
 * TTL defaults:
 *   - places:  300s (5 min)
 *   - static lists (categories, districts, tags): 1800s (30 min)
 */

const TTL_PLACES_SEC = parseInt(process.env.CACHE_TTL_PLACES_SEC || "300", 10);
const TTL_STATIC_SEC = parseInt(process.env.CACHE_TTL_STATIC_SEC || "1800", 10);
const CHECK_PERIOD_SEC = 120;

const cache = new NodeCache({
  stdTTL: TTL_PLACES_SEC,
  checkperiod: CHECK_PERIOD_SEC,
  useClones: false,
});

/* ── Key helpers ─────────────────────────────────────────── */

/**
 * Build a deterministic cache key from a prefix and an object of params.
 * Keys are sorted so { a:1, b:2 } and { b:2, a:1 } produce the same string.
 */
export function buildKey(prefix, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .map((k) => `${k}:${params[k]}`)
    .join("|");
  return sorted ? `${prefix}:${sorted}` : prefix;
}

/* ── Get / Set ───────────────────────────────────────────── */

export function get(key) {
  return cache.get(key) ?? null;
}

export function set(key, value, ttlSec) {
  cache.set(key, value, ttlSec);
}

/* ── TTL presets ─────────────────────────────────────────── */

export const TTL = {
  PLACES: TTL_PLACES_SEC,
  STATIC: TTL_STATIC_SEC,
};

/* ── Pattern-based flush (invalidation) ──────────────────── */

/**
 * Delete all keys matching a prefix pattern.
 * e.g. flushPattern("places:") removes all cached place data.
 */
export function flushPattern(prefix) {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
    logger.info(`[Cache] Flushed ${keys.length} keys matching "${prefix}*"`);
  }
}

/** Flush everything. */
export function flushAll() {
  const count = cache.keys().length;
  cache.flushAll();
  if (count > 0) {
    logger.info(`[Cache] Flushed all ${count} keys`);
  }
}

/* ── Stats (for health endpoint) ─────────────────────────── */

export function getStats() {
  return cache.getStats();
}

export default {
  buildKey,
  get,
  set,
  flushPattern,
  flushAll,
  getStats,
  TTL,
};
