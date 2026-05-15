/**
 * In-memory permission cache with TTL.
 * Keeps the interface swappable for Redis migration later.
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

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
