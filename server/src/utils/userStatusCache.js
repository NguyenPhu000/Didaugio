import { getRedisClient } from "../config/redisClient.js";
import logger from "../config/logger.js";

const CACHE_TTL_SECONDS = 30;

/**
 * Get user status and role from Redis cache or fetch callback.
 * @param {number|string} userId
 * @param {Function} fetchFromDb - () => Promise<{ roleId, status, role: { name } }>
 */
export async function getUserStatusCached(userId, fetchFromDb) {
  if (!userId) return null;

  const redis = getRedisClient();
  const cacheKey = `user_status:${userId}`;

  if (redis && redis.isOpen) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("[userStatusCache] Redis get failed, falling back to DB", { error: error.message });
    }
  }

  const userRecord = await fetchFromDb();

  if (userRecord && redis && redis.isOpen) {
    try {
      await redis.set(cacheKey, JSON.stringify(userRecord), { EX: CACHE_TTL_SECONDS });
    } catch (error) {
      logger.warn("[userStatusCache] Redis set failed", { error: error.message });
    }
  }

  return userRecord;
}

/**
 * Invalidate cached user status in Redis (e.g. when banned or role changed).
 * @param {number|string} userId
 */
export async function invalidateUserStatusCache(userId) {
  if (!userId) return;

  const redis = getRedisClient();
  const cacheKey = `user_status:${userId}`;

  if (redis && redis.isOpen) {
    try {
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn("[userStatusCache] Redis del failed", { error: error.message });
    }
  }
}
