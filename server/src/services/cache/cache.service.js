import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import { getRedisClient } from "../../config/redisClient.js";

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
const CACHE_NAMESPACE = process.env.CACHE_NAMESPACE || "didaugio:v1";
const redis = getRedisClient();
const redisStats = { hits: 0, misses: 0, errors: 0 };

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
const namespaceKey = (key) =>
  key.startsWith(`${CACHE_NAMESPACE}:`) ? key : `${CACHE_NAMESPACE}:${key}`;

export function buildKey(prefix, params = {}) {
  const sorted = Object.keys(params)
    .sort((left, right) => left.localeCompare(right))
    .filter(
      (k) => params[k] !== undefined && params[k] !== null && params[k] !== "",
    )
    .map((k) => `${k}:${params[k]}`)
    .join("|");
  return namespaceKey(sorted ? `${prefix}:${sorted}` : prefix);
}

/* ── Get / Set ───────────────────────────────────────────── */

export async function get(key) {
  const resolvedKey = namespaceKey(key);
  if (redis) {
    try {
      const value = await redis.get(resolvedKey);
      if (value == null) {
        redisStats.misses += 1;
        return null;
      }
      redisStats.hits += 1;
      return JSON.parse(value);
    } catch (error) {
      redisStats.errors += 1;
      logger.error("[Cache] Redis get failed", { error: error.message });
    }
  }
  return cache.get(resolvedKey) ?? null;
}

export async function set(key, value, ttlSec = TTL_PLACES_SEC) {
  const resolvedKey = namespaceKey(key);
  if (redis) {
    try {
      await redis.set(resolvedKey, JSON.stringify(value), { EX: ttlSec });
      return;
    } catch (error) {
      redisStats.errors += 1;
      logger.error("[Cache] Redis set failed", { error: error.message });
    }
  }
  cache.set(resolvedKey, value, ttlSec);
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
export async function flushPattern(prefix) {
  const resolvedPrefix = namespaceKey(prefix);
  if (redis) {
    try {
      let deleted = 0;
      for await (const result of redis.scanIterator({ MATCH: `${resolvedPrefix}*`, COUNT: 100 })) {
        const keys = Array.isArray(result) ? result : [result];
        if (keys.length > 0) deleted += await redis.del(keys);
      }
      if (deleted > 0) logger.info(`[Cache] Flushed ${deleted} Redis keys matching "${resolvedPrefix}*"`);
    } catch (error) {
      redisStats.errors += 1;
      logger.error("[Cache] Redis pattern flush failed", { error: error.message });
    }
  }
  const keys = cache.keys().filter((k) => k.startsWith(resolvedPrefix));
  if (keys.length > 0) {
    cache.del(keys);
    logger.info(`[Cache] Flushed ${keys.length} keys matching "${prefix}*"`);
  }
}

/** Flush everything. */
export async function flushAll() {
  if (redis) await flushPattern("");
  const count = cache.keys().length;
  cache.flushAll();
  if (count > 0) {
    logger.info(`[Cache] Flushed all ${count} keys`);
  }
}

/* ── Stats (for health endpoint) ─────────────────────────── */

export function getStats() {
  return { ...cache.getStats(), redis: { ...redisStats, configured: Boolean(redis) } };
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
