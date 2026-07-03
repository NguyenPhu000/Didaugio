/**
 * In-memory permission cache with TTL.
 * Keeps the interface swappable for Redis migration later.
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 10000; // Maximum number of entries
const CLEANUP_INTERVAL = 60 * 1000; // Cleanup every 1 minute

const cache = new Map();

// Periodic cleanup of expired entries
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry <= now) {
      cache.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// Allow the interval to not prevent Node from exiting
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Get cached permissions for a user.
 * @param {string} cacheKey - `${userId}:${roleId}`
 * @returns {object|null} Cached entry or null if expired/missing
 */
export function getCachedPermissions(cacheKey) {
  const entry = cache.get(cacheKey);
  if (entry && entry.expiry > Date.now()) {
    return entry;
  }
  if (entry) {
    cache.delete(cacheKey);
  }
  return null;
}

/**
 * Store permissions in cache.
 * @param {string} cacheKey
 * @param {object} value - { isSuperAdmin, permissions }
 */
export function setCachedPermissions(cacheKey, value) {
  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(cacheKey, {
    ...value,
    expiry: Date.now() + CACHE_TTL,
  });
}

/**
 * Invalidate cache for a specific user.
 * @param {number} userId
 */
export function invalidateUserCache(userId) {
  const prefix = `${userId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate cache for all users with a specific role.
 * @param {number} roleId
 */
export function invalidateRoleCache(roleId) {
  const suffix = `:${roleId}`;
  for (const key of cache.keys()) {
    if (key.endsWith(suffix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear entire permission cache.
 */
export function clearPermissionCache() {
  cache.clear();
}

/**
 * Get current cache size (for monitoring).
 */
export function getCacheSize() {
  return cache.size;
}
