import crypto from "node:crypto";
import prisma from "../../config/prismaClient.js";
import { getRedisClient } from "../../config/redisClient.js";
import logger from "../../config/logger.js";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const REDIS_QUOTA_RESERVATION_SCRIPT = `
local persisted = tonumber(ARGV[1])
local dailyLimit = tonumber(ARGV[2])
local ttlSeconds = tonumber(ARGV[3])
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local effective = math.max(current, persisted)

if effective >= dailyLimit then
  redis.call("SET", KEYS[1], effective, "EX", ttlSeconds)
  return {0, effective}
end

local reserved = effective + 1
redis.call("SET", KEYS[1], reserved, "EX", ttlSeconds)
return {1, reserved}
`;
const LOG_SELECT = Object.freeze({
  requestId: true,
  feature: true,
  provider: true,
  model: true,
  configVersion: true,
  inputTokens: true,
  outputTokens: true,
  latencyMs: true,
  status: true,
  errorCode: true,
  safetyBlocked: true,
  feedback: true,
  createdAt: true,
});

function quotaError() {
  return Object.assign(new Error("Daily AI request quota exceeded."), {
    code: "AI_DAILY_QUOTA_EXCEEDED",
    errorCode: "AI_DAILY_QUOTA_EXCEEDED",
    statusCode: 429,
  });
}

function hmacKey(key) {
  if (!/^[0-9a-f]{64}$/i.test(String(key ?? ""))) {
    throw Object.assign(
      new Error("FIELD_ENCRYPTION_KEY is unavailable for AI log anonymization."),
      {
        code: "AI_LOG_KEY_UNAVAILABLE",
        errorCode: "AI_LOG_KEY_UNAVAILABLE",
        statusCode: 503,
      },
    );
  }
  return Buffer.from(key, "hex");
}

function utcDayBounds(timestamp) {
  const current = new Date(timestamp);
  const start = new Date(Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate(),
  ));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function integerOrNull(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function createAiLogService({
  client,
  redisProvider = getRedisClient,
  encryptionKey = process.env.FIELD_ENCRYPTION_KEY,
  now = Date.now,
}) {
  let lastPruneAt = Number.NEGATIVE_INFINITY;
  const quotaLocks = new Map();

  function anonymousUserRef(userId) {
    if (userId == null) return null;
    return crypto
      .createHmac("sha256", hmacKey(encryptionKey))
      .update(`ai-log:${String(userId)}`)
      .digest("hex");
  }

  async function pruneExpiredAiLogs() {
    return client.aiRequestLog.deleteMany({
      where: { expiresAt: { lt: new Date(now()) } },
    });
  }

  async function maybePruneExpiredLogs() {
    const currentTime = now();
    if (currentTime - lastPruneAt < PRUNE_INTERVAL_MS) return;
    lastPruneAt = currentTime;
    try {
      await pruneExpiredAiLogs();
    } catch (error) {
      logger.warn("[AI] Expired metadata log cleanup failed", {
        error: error.message,
      });
    }
  }

  async function withQuotaLock(key, operation) {
    const previous = quotaLocks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    quotaLocks.set(key, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (quotaLocks.get(key) === current) quotaLocks.delete(key);
    }
  }

  function productionCountWhere(reference, start, end) {
    return {
      anonymousUserRef: reference,
      isTest: false,
      createdAt: { gte: start, lt: end },
    };
  }

  async function tryRedisReservation({
    reference,
    limit,
    timestamp,
    start,
    end,
  }) {
    const redis = redisProvider?.();
    if (redis?.isReady !== true || typeof redis.eval !== "function") {
      return false;
    }

    try {
      const persistedCount = await client.aiRequestLog.count({
        where: productionCountWhere(reference, start, end),
      });
      const day = start.toISOString().slice(0, 10);
      const key = `ai-quota:${day}:${reference}`;
      const ttlSeconds = Math.max(
        1,
        Math.ceil((end.getTime() - timestamp) / 1000),
      );
      const result = await redis.eval(REDIS_QUOTA_RESERVATION_SCRIPT, {
        keys: [key],
        arguments: [
          String(persistedCount),
          String(limit),
          String(ttlSeconds),
        ],
      });
      if (Number(result?.[0]) !== 1) throw quotaError();
      return true;
    } catch (error) {
      if (error?.code === "AI_DAILY_QUOTA_EXCEEDED") throw error;
      logger.warn("[AI] Atomic Redis quota reservation failed; using database", {
        error: error.message,
      });
      return false;
    }
  }

  async function reserveAiRequest({
    requestId,
    userId,
    feature,
    provider,
    model,
    configVersion,
    dailyLimit,
    isTest = false,
  }) {
    const timestamp = now();
    const reference = anonymousUserRef(userId);
    const data = {
      requestId,
      anonymousUserRef: reference,
      feature,
      provider,
      model,
      configVersion: configVersion ?? null,
      status: "started",
      safetyBlocked: false,
      isTest: Boolean(isTest),
      expiresAt: new Date(timestamp + RETENTION_MS),
    };
    const createStartedRow = () =>
      client.aiRequestLog.create({ data });

    let row;
    if (isTest) {
      row = await createStartedRow();
    } else {
      const limit = Number.isSafeInteger(dailyLimit) ? dailyLimit : 0;
      if (limit <= 0) throw quotaError();
      const { start, end } = utcDayBounds(timestamp);
      const lockKey = `${start.toISOString()}:${reference}`;
      row = await withQuotaLock(lockKey, async () => {
        const redisReserved = await tryRedisReservation({
          reference,
          limit,
          timestamp,
          start,
          end,
        });
        if (redisReserved) return createStartedRow();

        const count = await client.aiRequestLog.count({
          where: productionCountWhere(reference, start, end),
        });
        if (count >= limit) throw quotaError();
        return createStartedRow();
      });
    }

    await maybePruneExpiredLogs();
    return row;
  }

  async function completeAiRequest(requestId, metadata = {}) {
    const row = await client.aiRequestLog.update({
      where: { requestId },
      data: {
        inputTokens: integerOrNull(metadata.inputTokens),
        outputTokens: integerOrNull(metadata.outputTokens),
        latencyMs: integerOrNull(metadata.latencyMs),
        status: metadata.status,
        errorCode: metadata.errorCode ?? null,
        safetyBlocked: metadata.safetyBlocked === true,
      },
    });
    await maybePruneExpiredLogs();
    return row;
  }

  async function getLogs(filters = {}) {
    const page = Number.isSafeInteger(filters.page) && filters.page > 0
      ? filters.page
      : 1;
    const limit = Number.isSafeInteger(filters.limit)
      ? Math.min(100, Math.max(1, filters.limit))
      : 50;
    const where = {};
    for (const key of [
      "feature",
      "provider",
      "status",
      "safetyBlocked",
      "feedback",
      "isTest",
    ]) {
      if (filters[key] !== undefined) where[key] = filters[key];
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const operations = [
      client.aiRequestLog.findMany({
        where,
        select: LOG_SELECT,
        orderBy: [{ createdAt: "desc" }, { requestId: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.aiRequestLog.count({ where }),
    ];
    const [items, total] = client.$transaction
      ? await client.$transaction(operations)
      : await Promise.all(operations);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  return {
    anonymousUserRef,
    reserveAiRequest,
    completeAiRequest,
    pruneExpiredAiLogs,
    getLogs,
  };
}

const service = createAiLogService({ client: prisma });

export const reserveAiRequest =
  service.reserveAiRequest.bind(service);
export const completeAiRequest =
  service.completeAiRequest.bind(service);
export const anonymousAiUserRef =
  service.anonymousUserRef.bind(service);
export const pruneExpiredAiLogs =
  service.pruneExpiredAiLogs.bind(service);
export const getLogs = service.getLogs.bind(service);
