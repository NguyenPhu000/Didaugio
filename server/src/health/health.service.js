const DEFAULT_TIMEOUT_MS = 2_000;

const normalizeTimeout = (value) => {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS;
};

const runWithTimeout = async (operation, timeoutMs) => {
  let timeoutId;
  const controller = new AbortController();

  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error("Health check timed out"));
        }, normalizeTimeout(timeoutMs));
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const checkDatabase = async ({ prisma, timeoutMs }) => {
  try {
    await runWithTimeout(() => prisma.$queryRaw`SELECT 1`, timeoutMs);
    return { status: "ok" };
  } catch (_error) {
    return { status: "unavailable" };
  }
};

const checkRouting = async ({ routingUrl, routingEnabled, fetchImpl, timeoutMs }) => {
  if (!routingEnabled || !routingUrl) return { status: "not_configured" };

  try {
    const url = `${String(routingUrl).replace(/\/+$/, "")}/nearest/v1/driving/105.7200532,10.0345852?number=1`;
    const response = await runWithTimeout(
      (signal) => fetchImpl(url, { signal }),
      timeoutMs,
    );
    return response?.ok ? { status: "ok" } : { status: "unavailable" };
  } catch (_error) {
    return { status: "unavailable" };
  }
};

const checkRedis = async ({ redis, timeoutMs }) => {
  if (!redis?.ping) return { status: "not_configured" };

  try {
    await runWithTimeout(() => redis.ping(), timeoutMs);
    return { status: "ok" };
  } catch (_error) {
    return { status: "unavailable" };
  }
};

const checkSpatial = async ({ prisma, required, timeoutMs }) => {
  if (!required) return null;

  try {
    const rows = await runWithTimeout(
      () => prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'postgis'`,
      timeoutMs,
    );
    return Array.isArray(rows) && rows.length > 0
      ? { status: "ok" }
      : { status: "unavailable" };
  } catch (_error) {
    return { status: "unavailable" };
  }
};

export const checkReadiness = async ({
  prisma,
  routingUrl,
  routingEnabled = Boolean(routingUrl),
  fetchImpl = globalThis.fetch,
  redis,
  requireSpatial = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
  const [database, routing, redisCheck, spatial] = await Promise.all([
    checkDatabase({ prisma, timeoutMs }),
    checkRouting({ routingUrl, routingEnabled, fetchImpl, timeoutMs }),
    checkRedis({ redis, timeoutMs }),
    checkSpatial({ prisma, required: requireSpatial, timeoutMs }),
  ]);

  return {
    ready:
      database.status === "ok" &&
      routing.status !== "unavailable" &&
      redisCheck.status !== "unavailable" &&
      spatial?.status !== "unavailable",
    checks: {
      database,
      routing,
      redis: redisCheck,
      ...(spatial ? { spatial } : {}),
    },
  };
};
