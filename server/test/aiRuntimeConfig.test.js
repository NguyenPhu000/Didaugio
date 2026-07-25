import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  createAiLogService,
} from "../src/services/adminAi/aiLog.service.js";
import {
  createAiOverviewService,
} from "../src/services/adminAi/aiOverview.service.js";
import {
  createAiRuntimeConfigService,
} from "../src/services/ai/runtime/aiRuntimeConfig.js";
import {
  createAiRuntimeExecutionService,
} from "../src/services/ai/runtime/aiRuntimeExecution.js";
import {
  createAiConfigService,
} from "../src/services/adminAi/aiConfig.service.js";

function activeConfigClient({
  activeVersion = {
    version: 7,
    configData: DEFAULT_AI_CONFIG,
  },
  killSwitch = null,
} = {}) {
  const calls = { activeReads: 0, killReads: 0, upserts: [] };
  return {
    calls,
    client: {
      systemConfig: {
        findUnique: async () => {
          calls.killReads += 1;
          return killSwitch ? { value: killSwitch } : null;
        },
        upsert: async (input) => {
          calls.upserts.push(input);
          return input;
        },
      },
      aiConfig: {
        findUnique: async () => {
          calls.activeReads += 1;
          return activeVersion ? { activeVersion } : null;
        },
      },
    },
  };
}

test("active runtime validates and caches only the published snapshot for 30 seconds", async () => {
  let now = Date.parse("2026-07-25T00:00:00.000Z");
  const fixture = activeConfigClient();
  const runtime = createAiRuntimeConfigService({
    client: fixture.client,
    now: () => now,
  });

  const first = await runtime.getActiveAiRuntime();
  now += 29_000;
  const second = await runtime.getActiveAiRuntime();

  assert.deepEqual(first, {
    status: "active",
    version: 7,
    configData: DEFAULT_AI_CONFIG,
    killSwitch: {
      enabled: false,
      message: null,
      updatedAt: null,
    },
  });
  assert.deepEqual(second, first);
  assert.equal(fixture.calls.activeReads, 1);
  assert.equal(fixture.calls.killReads, 2);

  now += 1_001;
  await runtime.getActiveAiRuntime();
  assert.equal(fixture.calls.activeReads, 2);
});

test("runtime invalidation forces the next active snapshot read", async () => {
  const fixture = activeConfigClient();
  const runtime = createAiRuntimeConfigService({ client: fixture.client });

  await runtime.getActiveAiRuntime();
  runtime.invalidateAiRuntimeCache();
  await runtime.getActiveAiRuntime();

  assert.equal(fixture.calls.activeReads, 2);
});

test("kill switch disables runtime without loading a published snapshot", async () => {
  const fixture = activeConfigClient({
    killSwitch: {
      enabled: true,
      message: "Đang bảo trì",
      updatedAt: "2026-07-25T00:00:00.000Z",
    },
  });
  const runtime = createAiRuntimeConfigService({ client: fixture.client });

  assert.deepEqual(await runtime.getActiveAiRuntime(), {
    status: "disabled",
    version: null,
    configData: null,
    killSwitch: {
      enabled: true,
      message: "Đang bảo trì",
      updatedAt: "2026-07-25T00:00:00.000Z",
    },
  });
  assert.equal(fixture.calls.activeReads, 0);
});

test("runtime enters maintenance when no published snapshot exists", async () => {
  const fixture = activeConfigClient({ activeVersion: null });
  const runtime = createAiRuntimeConfigService({ client: fixture.client });

  assert.equal((await runtime.getActiveAiRuntime()).status, "maintenance");
});

test("kill switch upsert records actor metadata and invalidates active cache", async () => {
  const now = Date.parse("2026-07-25T01:02:03.000Z");
  const fixture = activeConfigClient();
  const runtime = createAiRuntimeConfigService({
    client: fixture.client,
    now: () => now,
  });
  await runtime.getActiveAiRuntime();

  await runtime.setAiKillSwitch(
    { enabled: true, reason: "Sự cố nhà cung cấp" },
    { userId: 42 },
  );
  await runtime.getActiveAiRuntime();

  assert.deepEqual(fixture.calls.upserts[0], {
    where: { key: "ai_kill_switch" },
    create: {
      key: "ai_kill_switch",
      value: {
        enabled: true,
        message: "Sự cố nhà cung cấp",
        updatedAt: "2026-07-25T01:02:03.000Z",
      },
      description: "Emergency control for mobile AI runtime.",
      updatedBy: 42,
    },
    update: {
      value: {
        enabled: true,
        message: "Sự cố nhà cung cấp",
        updatedAt: "2026-07-25T01:02:03.000Z",
      },
      updatedBy: 42,
    },
  });
  assert.equal(fixture.calls.activeReads, 2);
});

function logClientFixture({ productionCount = 0, rows = [] } = {}) {
  const calls = { creates: [], updates: [], deletes: 0, count: 0 };
  return {
    calls,
    client: {
      aiRequestLog: {
        count: async () => {
          calls.count += 1;
          return productionCount;
        },
        create: async (input) => {
          calls.creates.push(input);
          return input.data;
        },
        update: async (input) => {
          calls.updates.push(input);
          return input.data;
        },
        deleteMany: async () => {
          calls.deletes += 1;
          return { count: 0 };
        },
        findMany: async () => rows,
      },
      $transaction: async (operations) => Promise.all(operations),
    },
  };
}

function atomicRedisFixture() {
  let value = null;
  const calls = [];
  return {
    redis: {
      isReady: true,
      eval: async (_script, { keys, arguments: values }) => {
        const persistedCount = Number(values[0]);
        const dailyLimit = Number(values[1]);
        calls.push({
          key: keys[0],
          persistedCount,
          dailyLimit,
          ttlSeconds: Number(values[2]),
        });
        const current = Math.max(value ?? 0, persistedCount);
        if (current >= dailyLimit) {
          value = current;
          return [0, current];
        }
        value = current + 1;
        return [1, value];
      },
    },
    calls,
    loseKey() {
      value = null;
    },
  };
}

test("log reservation HMACs source user ids, reserves Redis quota, and persists metadata only", async () => {
  const now = Date.parse("2026-07-25T03:00:00.000Z");
  const fixture = logClientFixture();
  const redisFixture = atomicRedisFixture();
  const encryptionKey = "11".repeat(32);
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => redisFixture.redis,
    encryptionKey,
    now: () => now,
  });

  await logs.reserveAiRequest({
    requestId: "request-1",
    userId: 123,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 7,
    dailyLimit: 2,
    isTest: false,
    rawPrompt: "must never be persisted",
    rawResponse: "must never be persisted either",
  });

  const expectedRef = crypto
    .createHmac("sha256", Buffer.from(encryptionKey, "hex"))
    .update("ai-log:123")
    .digest("hex");
  assert.deepEqual(fixture.calls.creates[0].data, {
    requestId: "request-1",
    anonymousUserRef: expectedRef,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 7,
    status: "started",
    safetyBlocked: false,
    isTest: false,
    expiresAt: new Date("2026-10-23T03:00:00.000Z"),
  });
  assert.equal(JSON.stringify(fixture.calls).includes("must never"), false);
  assert.match(redisFixture.calls[0].key, /^ai-quota:2026-07-25:/);
  assert.equal(redisFixture.calls[0].key.includes("123"), false);
  assert.equal(redisFixture.calls[0].persistedCount, 0);
  assert.equal(redisFixture.calls[0].ttlSeconds, 75_600);

  await logs.reserveAiRequest({
    requestId: "request-2",
    userId: 123,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 7,
    dailyLimit: 2,
    isTest: false,
  });
  await assert.rejects(
    logs.reserveAiRequest({
      requestId: "request-3",
      userId: 123,
      feature: "chat",
      provider: "groq",
      model: "model-a",
      configVersion: 7,
      dailyLimit: 2,
      isTest: false,
    }),
    (error) =>
      error.code === "AI_DAILY_QUOTA_EXCEEDED" &&
      error.statusCode === 429,
  );
  assert.equal(fixture.calls.creates.length, 2);
});

test("test rows bypass production quota while retaining isTest metadata", async () => {
  const fixture = logClientFixture({ productionCount: 99 });
  let redisReservations = 0;
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => ({
      isReady: true,
      eval: async () => {
        redisReservations += 1;
        return [0, 100];
      },
    }),
    encryptionKey: "22".repeat(32),
  });

  await logs.reserveAiRequest({
    requestId: "test-request",
    userId: 8,
    feature: "planner",
    provider: "groq",
    model: "model-a",
    configVersion: 9,
    dailyLimit: 0,
    isTest: true,
  });

  assert.equal(redisReservations, 0);
  assert.equal(fixture.calls.count, 0);
  assert.equal(fixture.calls.creates[0].data.isTest, true);
});

test("database quota fallback counts today's production rows before starting a request", async () => {
  const fixture = logClientFixture({ productionCount: 1 });
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => ({ isReady: false }),
    encryptionKey: "33".repeat(32),
  });

  await assert.rejects(
    logs.reserveAiRequest({
      requestId: "request-db-fallback",
      userId: 3,
      feature: "voice",
      provider: "groq",
      model: "model-a",
      configVersion: 1,
      dailyLimit: 1,
      isTest: false,
    }),
    (error) => error.code === "AI_DAILY_QUOTA_EXCEEDED",
  );
  assert.equal(fixture.calls.count, 1);
  assert.equal(fixture.calls.creates.length, 0);
});

test("database quota fallback serializes concurrent same-user count and create", async () => {
  const rows = [];
  let countCalls = 0;
  let releaseFirstCount;
  let firstCountEntered;
  const firstCountGate = new Promise((resolve) => {
    releaseFirstCount = resolve;
  });
  const firstCountSeen = new Promise((resolve) => {
    firstCountEntered = resolve;
  });
  const client = {
    aiRequestLog: {
      count: async () => {
        countCalls += 1;
        const observed = rows.length;
        if (countCalls === 1) {
          firstCountEntered();
          await firstCountGate;
        }
        return observed;
      },
      create: async ({ data }) => {
        rows.push(data);
        return data;
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const logs = createAiLogService({
    client,
    redisProvider: () => ({ isReady: false }),
    encryptionKey: "34".repeat(32),
  });
  const input = (requestId) => ({
    requestId,
    userId: 10,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  const first = logs.reserveAiRequest(input("concurrent-1"));
  await firstCountSeen;
  const second = logs.reserveAiRequest(input("concurrent-2"));
  await new Promise((resolve) => setImmediate(resolve));
  releaseFirstCount();
  const settled = await Promise.allSettled([first, second]);

  assert.equal(
    settled.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    settled.filter(
      (result) =>
        result.status === "rejected" &&
        result.reason.code === "AI_DAILY_QUOTA_EXCEEDED",
    ).length,
    1,
  );
  assert.equal(rows.length, 1);
});

test("Redis recovery seeds quota from rows created during database fallback", async () => {
  const rows = [];
  let redisReady = false;
  const redisFixture = atomicRedisFixture();
  const client = {
    aiRequestLog: {
      count: async () => rows.length,
      create: async ({ data }) => {
        rows.push(data);
        return data;
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const logs = createAiLogService({
    client,
    redisProvider: () => ({
      ...redisFixture.redis,
      isReady: redisReady,
    }),
    encryptionKey: "35".repeat(32),
  });
  const input = (requestId) => ({
    requestId,
    userId: 11,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  await logs.reserveAiRequest(input("database-first"));
  redisReady = true;

  await assert.rejects(
    logs.reserveAiRequest(input("redis-after-recovery")),
    (error) => error.code === "AI_DAILY_QUOTA_EXCEEDED",
  );
  assert.equal(rows.length, 1);
  assert.equal(redisFixture.calls[0].persistedCount, 1);
});

test("a degraded fallback and recovered Redis cannot reserve concurrently", async () => {
  const rows = [];
  let evalFails = true;
  let countCalls = 0;
  let fallbackCountEntered;
  let releaseFallbackCount;
  const fallbackCountSeen = new Promise((resolve) => {
    fallbackCountEntered = resolve;
  });
  const fallbackCountGate = new Promise((resolve) => {
    releaseFallbackCount = resolve;
  });
  let redisValue = null;
  const redis = {
    isReady: true,
    eval: async (_script, { arguments: values }) => {
      if (evalFails) throw new Error("temporary Redis failure");
      const persisted = Number(values[0]);
      const limit = Number(values[1]);
      const current = Math.max(redisValue ?? 0, persisted);
      if (current >= limit) return [0, current];
      redisValue = current + 1;
      return [1, redisValue];
    },
  };
  const client = {
    aiRequestLog: {
      count: async () => {
        countCalls += 1;
        const observed = rows.length;
        if (countCalls === 2) {
          fallbackCountEntered();
          await fallbackCountGate;
        }
        return observed;
      },
      create: async ({ data }) => {
        rows.push(data);
        return data;
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const logs = createAiLogService({
    client,
    redisProvider: () => redis,
    encryptionKey: "38".repeat(32),
  });
  const input = (requestId) => ({
    requestId,
    userId: 14,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  const degraded = logs.reserveAiRequest(input("degraded-source"));
  await fallbackCountSeen;
  evalFails = false;
  const recovered = logs.reserveAiRequest(input("recovered-source"));
  await new Promise((resolve) => setImmediate(resolve));
  releaseFallbackCount();
  const settled = await Promise.allSettled([degraded, recovered]);

  assert.equal(
    settled.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    settled.filter(
      (result) =>
        result.status === "rejected" &&
        result.reason.code === "AI_DAILY_QUOTA_EXCEEDED",
    ).length,
    1,
  );
  assert.equal(rows.length, 1);
});

test("Redis lost-key recovery seeds from persisted rows before reserving", async () => {
  const rows = [];
  const redisFixture = atomicRedisFixture();
  const client = {
    aiRequestLog: {
      count: async () => rows.length,
      create: async ({ data }) => {
        rows.push(data);
        return data;
      },
      deleteMany: async () => ({ count: 0 }),
    },
  };
  const logs = createAiLogService({
    client,
    redisProvider: () => redisFixture.redis,
    encryptionKey: "36".repeat(32),
  });
  const input = (requestId) => ({
    requestId,
    userId: 12,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  await logs.reserveAiRequest(input("before-key-loss"));
  redisFixture.loseKey();

  await assert.rejects(
    logs.reserveAiRequest(input("after-key-loss")),
    (error) => error.code === "AI_DAILY_QUOTA_EXCEEDED",
  );
  assert.equal(rows.length, 1);
  assert.equal(redisFixture.calls[1].persistedCount, 1);
});

test("split INCR success and EXPIRE failure is not accepted as a Redis reservation", async () => {
  const fixture = logClientFixture({ productionCount: 0 });
  let increments = 0;
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => ({
      isReady: true,
      incr: async () => {
        increments += 1;
        return increments;
      },
      expire: async () => {
        throw new Error("raw expiry storage failure");
      },
    }),
    encryptionKey: "37".repeat(32),
  });

  await logs.reserveAiRequest({
    requestId: "expiry-fallback",
    userId: 13,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  assert.equal(increments, 0);
  assert.equal(fixture.calls.count, 1);
  assert.equal(fixture.calls.creates.length, 1);
});

test("completion records only token, latency, status, error, and safety metadata", async () => {
  const fixture = logClientFixture();
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => null,
    encryptionKey: "44".repeat(32),
  });

  await logs.completeAiRequest("request-4", {
    inputTokens: 10,
    outputTokens: 20,
    latencyMs: 45,
    status: "error",
    errorCode: "AI_TIMEOUT",
    safetyBlocked: false,
    rawResponse: "must-not-be-written",
  });

  assert.deepEqual(fixture.calls.updates[0], {
    where: { requestId: "request-4" },
    data: {
      inputTokens: 10,
      outputTokens: 20,
      latencyMs: 45,
      status: "error",
      errorCode: "AI_TIMEOUT",
      safetyBlocked: false,
    },
  });
  assert.equal(JSON.stringify(fixture.calls.updates).includes("must-not"), false);
});

function runtimeExecutionFixture({
  operationResult = {
    outputText: "Kết quả an toàn",
    inputTokens: 11,
    outputTokens: 22,
  },
  inputText = "Gợi ý điểm đến",
  blockedKeywords = ["từ cấm"],
} = {}) {
  const calls = { reservations: [], completions: [], operations: 0 };
  const configData = {
    ...DEFAULT_AI_CONFIG,
    safety: {
      ...DEFAULT_AI_CONFIG.safety,
      blockedKeywords,
    },
    quotas: {
      freeDailyRequests: 1,
      premiumDailyRequests: 999,
    },
  };
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 5,
      configData,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async (input) => calls.reservations.push(input),
      completeAiRequest: async (...input) => calls.completions.push(input),
    },
    requestId: () => "runtime-request",
    now: (() => {
      const values = [1_000, 1_045];
      return () => values.shift() ?? 1_045;
    })(),
  });
  const operation = async (input) => {
    calls.operations += 1;
    calls.operationInput = input;
    return operationResult;
  };
  return { calls, service, operation, inputText };
}

test("production runtime cannot use an override to bypass the kill switch", async () => {
  let operations = 0;
  let reservations = 0;
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "disabled",
      version: null,
      configData: null,
      killSwitch: {
        enabled: true,
        message: "Runtime disabled",
        updatedAt: "2026-07-25T00:00:00.000Z",
      },
    }),
    logs: {
      reserveAiRequest: async () => {
        reservations += 1;
      },
      completeAiRequest: async () => {},
    },
  });

  await assert.rejects(
    service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: "Gợi ý điểm đến",
      context: {},
      operation: async () => {
        operations += 1;
        return { outputText: "must not run" };
      },
      runtimeOverride: {
        status: "active",
        version: 99,
        configData: DEFAULT_AI_CONFIG,
        killSwitch: { enabled: false, message: null, updatedAt: null },
      },
    }),
    (error) => error.code === "AI_DISABLED",
  );

  assert.equal(operations, 0);
  assert.equal(reservations, 0);
});

test("runtime reserves the free Mobile quota even for admin-shaped users", async () => {
  const fixture = runtimeExecutionFixture();

  await fixture.service.executeAiRequest({
    feature: "chat",
    user: { userId: 55, role: "admin", subscription: "premium" },
    isTest: false,
    inputText: fixture.inputText,
    context: { currentCity: "Cần Thơ" },
    operation: fixture.operation,
  });

  assert.equal(fixture.calls.reservations[0].dailyLimit, 1);
  assert.equal("role" in fixture.calls.reservations[0], false);
});

test("runtime blocks unsafe input before provider execution and completes the log", async () => {
  const fixture = runtimeExecutionFixture({ inputText: "Có từ cấm ở đây" });

  await assert.rejects(
    fixture.service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: fixture.inputText,
      context: {},
      operation: fixture.operation,
    }),
    (error) =>
      error.code === "AI_SAFETY_BLOCKED" &&
      error.message === DEFAULT_AI_CONFIG.safety.safeResponse,
  );

  assert.equal(fixture.calls.operations, 0);
  assert.deepEqual(fixture.calls.completions[0][1], {
    inputTokens: null,
    outputTokens: null,
    latencyMs: 45,
    status: "blocked",
    errorCode: "AI_SAFETY_BLOCKED",
    safetyBlocked: true,
  });
});

test("runtime blocks unsafe provider output and never returns it", async () => {
  const fixture = runtimeExecutionFixture({
    operationResult: {
      outputText: "Phản hồi chứa từ cấm",
      inputTokens: 5,
      outputTokens: 6,
    },
  });

  await assert.rejects(
    fixture.service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: fixture.inputText,
      context: {},
      operation: fixture.operation,
    }),
    (error) =>
      error.code === "AI_SAFETY_BLOCKED" &&
      !error.message.includes("Phản hồi chứa"),
  );
  assert.equal(fixture.calls.completions[0][1].safetyBlocked, true);
});

test("runtime passes masked context to the operation and completes success metadata", async () => {
  const fixture = runtimeExecutionFixture();

  const result = await fixture.service.executeAiRequest({
    feature: "chat",
    user: { userId: 55 },
    isTest: false,
    inputText: fixture.inputText,
    context: {
      currentCity: "Cần Thơ",
      currentCoords: { latitude: 10, longitude: 105 },
    },
    operation: fixture.operation,
  });

  assert.deepEqual(fixture.calls.operationInput.context, {
    currentCity: "Cần Thơ",
  });
  assert.deepEqual(result, {
    requestId: "runtime-request",
    result: {
      outputText: "Kết quả an toàn",
      inputTokens: 11,
      outputTokens: 22,
    },
  });
  assert.deepEqual(fixture.calls.completions[0][1], {
    inputTokens: 11,
    outputTokens: 22,
    latencyMs: 45,
    status: "success",
    errorCode: null,
    safetyBlocked: false,
  });
});

test("overview excludes Test Lab rows and returns aggregate runtime metadata", async () => {
  const rows = [
    {
      status: "success",
      inputTokens: 10,
      outputTokens: 20,
      latencyMs: 100,
      safetyBlocked: false,
      feedback: "up",
      createdAt: new Date("2026-07-24T01:00:00.000Z"),
    },
    {
      status: "error",
      inputTokens: 5,
      outputTokens: 0,
      latencyMs: 300,
      safetyBlocked: false,
      feedback: "down",
      createdAt: new Date("2026-07-24T02:00:00.000Z"),
    },
    {
      status: "blocked",
      inputTokens: null,
      outputTokens: null,
      latencyMs: 50,
      safetyBlocked: true,
      feedback: null,
      createdAt: new Date("2026-07-25T02:00:00.000Z"),
    },
  ];
  const findManyCalls = [];
  const overview = createAiOverviewService({
    client: {
      aiRequestLog: {
        findMany: async (input) => {
          findManyCalls.push(input);
          return rows;
        },
      },
    },
    getRuntime: async () => ({
      status: "active",
      version: 3,
      configData: DEFAULT_AI_CONFIG,
    }),
  });

  assert.deepEqual(
    await overview.getOverview({
      from: "2026-07-24T00:00:00.000Z",
      to: "2026-07-26T00:00:00.000Z",
    }),
    {
      runtime: {
        status: "active",
        provider: "groq",
        model: DEFAULT_AI_CONFIG.provider.model,
        version: 3,
      },
      totals: {
        requests: 3,
        inputTokens: 15,
        outputTokens: 20,
        successRate: 33.33,
        safetyBlocks: 1,
        negativeFeedback: 1,
      },
      latency: { averageMs: 150, p95Ms: 300 },
      timeline: [
        {
          bucket: "2026-07-24",
          requests: 2,
          errors: 1,
          inputTokens: 15,
          outputTokens: 20,
        },
        {
          bucket: "2026-07-25",
          requests: 1,
          errors: 0,
          inputTokens: 0,
          outputTokens: 0,
        },
      ],
    },
  );
  assert.equal(findManyCalls[0].where.isTest, false);
});

test("logs expose paginated metadata without anonymous references or retention fields", async () => {
  const row = {
    requestId: "request-visible",
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 2,
    inputTokens: 3,
    outputTokens: 4,
    latencyMs: 90,
    status: "success",
    errorCode: null,
    safetyBlocked: false,
    feedback: "up",
    createdAt: new Date("2026-07-25T01:00:00.000Z"),
  };
  const calls = [];
  const logs = createAiLogService({
    client: {
      aiRequestLog: {
        findMany: (input) => {
          calls.push(input);
          return [row];
        },
        count: () => 1,
      },
      $transaction: async (operations) => Promise.all(operations),
    },
    encryptionKey: "55".repeat(32),
  });

  assert.deepEqual(
    await logs.getLogs({
      page: 2,
      limit: 1,
      feature: "chat",
      isTest: false,
    }),
    {
      items: [row],
      pagination: { page: 2, limit: 1, total: 1, totalPages: 1 },
    },
  );
  assert.equal(calls[0].skip, 1);
  assert.equal(calls[0].where.feature, "chat");
  assert.equal("anonymousUserRef" in calls[0].select, false);
  assert.equal("expiresAt" in calls[0].select, false);
});

test("the public voice log filter includes every internal voice feature only", async () => {
  const rows = [
    { requestId: "legacy", feature: "voice" },
    { requestId: "intro", feature: "voice-introduction" },
    { requestId: "stt", feature: "voice-transcription" },
    { requestId: "tts", feature: "voice-speech" },
    { requestId: "chat", feature: "chat" },
    { requestId: "planner", feature: "planner" },
  ];
  const calls = [];
  const client = {
    aiRequestLog: {
      findMany: async (input) => {
        calls.push(input);
        const allowedFeatures = Array.isArray(input.where.feature?.in)
          ? input.where.feature.in
          : [input.where.feature];
        return rows.filter((row) =>
          allowedFeatures.includes(row.feature),
        );
      },
      count: async ({ where }) => {
        const allowedFeatures = Array.isArray(where.feature?.in)
          ? where.feature.in
          : [where.feature];
        return rows.filter((row) =>
          allowedFeatures.includes(row.feature)
        ).length;
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };
  const logs = createAiLogService({
    client,
    encryptionKey: "58".repeat(32),
  });

  const result = await logs.getLogs({ feature: "voice" });

  assert.deepEqual(
    calls[0].where.feature,
    {
      in: [
        "voice",
        "voice-introduction",
        "voice-transcription",
        "voice-speech",
      ],
    },
  );
  assert.deepEqual(
    result.items.map((row) => row.requestId),
    ["legacy", "intro", "stt", "tts"],
  );
  assert.equal(result.pagination.total, 4);
});

test("log service falls back to today's database count when ready Redis fails", async () => {
  const fixture = logClientFixture({ productionCount: 0 });
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => ({
      isReady: true,
      incr: async () => {
        throw new Error("redis unavailable");
      },
    }),
    encryptionKey: "66".repeat(32),
  });

  await logs.reserveAiRequest({
    requestId: "redis-fallback",
    userId: 9,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 1,
    isTest: false,
  });

  assert.equal(fixture.calls.count, 1);
  assert.equal(fixture.calls.creates.length, 1);
});

test("lazy retention pruning runs at most once per process hour after writes", async () => {
  let now = Date.parse("2026-07-25T00:00:00.000Z");
  const fixture = logClientFixture();
  const logs = createAiLogService({
    client: fixture.client,
    redisProvider: () => null,
    encryptionKey: "77".repeat(32),
    now: () => now,
  });

  await logs.reserveAiRequest({
    requestId: "prune-1",
    userId: 1,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 1,
    dailyLimit: 2,
    isTest: true,
  });
  await logs.completeAiRequest("prune-1", {
    status: "success",
    safetyBlocked: false,
  });
  now += 60 * 60 * 1000 - 1;
  await logs.completeAiRequest("prune-1", {
    status: "success",
    safetyBlocked: false,
  });
  assert.equal(fixture.calls.deletes, 1);

  now += 2;
  await logs.completeAiRequest("prune-1", {
    status: "success",
    safetyBlocked: false,
  });
  assert.equal(fixture.calls.deletes, 2);
});

test("runtime replaces provider failures with stable errors before logging or returning", async () => {
  const fixture = runtimeExecutionFixture();
  const rawError = new Error("provider leaked internal request details");

  await assert.rejects(
    fixture.service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: fixture.inputText,
      context: {},
      operation: async () => {
        throw rawError;
      },
    }),
    (error) =>
      error.code === "AI_ERROR" &&
      error.message === "AI provider request failed.",
  );
  assert.equal(fixture.calls.completions[0][1].errorCode, "AI_ERROR");
  assert.equal(
    JSON.stringify(fixture.calls.completions).includes("provider leaked"),
    false,
  );
});

test("reservation storage failure is normalized before provider execution", async () => {
  let operations = 0;
  let completions = 0;
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 5,
      configData: DEFAULT_AI_CONFIG,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => {
        throw new Error("raw reservation database details");
      },
      completeAiRequest: async () => {
        completions += 1;
      },
    },
  });

  await assert.rejects(
    service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: "Gợi ý điểm đến",
      context: {},
      operation: async () => {
        operations += 1;
        return { outputText: "must not run" };
      },
    }),
    (error) =>
      error.code === "AI_REQUEST_LOG_UNAVAILABLE" &&
      error.statusCode === 503 &&
      error.message === "AI request logging is unavailable." &&
      !error.message.includes("raw reservation"),
  );
  assert.equal(operations, 0);
  assert.equal(completions, 0);
});

test("completion storage failure cannot replace a stable provider failure", async () => {
  let completions = 0;
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 5,
      configData: DEFAULT_AI_CONFIG,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => {},
      completeAiRequest: async () => {
        completions += 1;
        throw new Error("raw completion database details");
      },
    },
  });

  await assert.rejects(
    service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: "Gợi ý điểm đến",
      context: {},
      operation: async () => {
        throw new Error("raw provider response details");
      },
    }),
    (error) =>
      error.code === "AI_ERROR" &&
      error.message === "AI provider request failed." &&
      !error.message.includes("raw completion") &&
      !error.message.includes("raw provider"),
  );
  assert.equal(completions, 1);
});

test("success completion failure returns one stable logging error without retry", async () => {
  let completions = 0;
  const service = createAiRuntimeExecutionService({
    getRuntime: async () => ({
      status: "active",
      version: 5,
      configData: DEFAULT_AI_CONFIG,
      killSwitch: { enabled: false, message: null, updatedAt: null },
    }),
    logs: {
      reserveAiRequest: async () => {},
      completeAiRequest: async () => {
        completions += 1;
        throw new Error("raw success completion database details");
      },
    },
  });

  await assert.rejects(
    service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: false,
      inputText: "Gợi ý điểm đến",
      context: {},
      operation: async () => ({
        outputText: "Kết quả an toàn",
        inputTokens: 4,
        outputTokens: 5,
      }),
    }),
    (error) =>
      error.code === "AI_REQUEST_LOG_UNAVAILABLE" &&
      error.statusCode === 503 &&
      error.message === "AI request logging is unavailable." &&
      !error.message.includes("raw success"),
  );
  assert.equal(completions, 1);
});

test("Test Lab uses the selected snapshot, logs isTest, and returns no message, secret, or provider output", async () => {
  const calls = {
    sources: [],
    reservations: [],
    completions: [],
    providerInputs: [],
    secretReferences: [],
  };
  const configData = {
    ...DEFAULT_AI_CONFIG,
    context: {
      ...DEFAULT_AI_CONFIG.context,
      enabledSources: ["coarseLocation"],
      fieldAllowlist: ["currentCity"],
    },
  };
  const service = createAiRuntimeExecutionService({
    loadSnapshot: async (source) => {
      calls.sources.push(source);
      return { version: 12, configData };
    },
    resolveSecret: async (reference) => {
      calls.secretReferences.push(reference);
      return "runtime-secret";
    },
    executeTestProvider: async (input) => {
      calls.providerInputs.push(input);
      return {
        outputText: "raw provider output",
        inputTokens: 14,
        outputTokens: 9,
        latencyMs: 80,
        finishReason: "stop",
      };
    },
    logs: {
      reserveAiRequest: async (input) => calls.reservations.push(input),
      completeAiRequest: async (...input) => calls.completions.push(input),
    },
    requestId: () => "test-lab-request",
    now: () => 1_000,
  });

  const result = await service.runAiConfigTest(
    {
      source: "draft",
      feature: "chat",
      message: "private test message",
      context: {
        currentCity: "Cần Thơ",
        email: "private@example.com",
        currentCoords: { latitude: 10, longitude: 105 },
      },
    },
    { userId: 70 },
  );

  assert.deepEqual(calls.sources, ["draft"]);
  assert.deepEqual(calls.secretReferences, ["groq-primary"]);
  assert.equal(calls.providerInputs[0].secret, "runtime-secret");
  assert.equal(calls.reservations[0].isTest, true);
  assert.deepEqual(result, {
    requestId: "test-lab-request",
    renderedPrompt: {
      system: configData.prompts.chat,
      user: "[REDACTED_TEST_MESSAGE]",
    },
    context: { currentCity: "Cần Thơ" },
    provider: {
      provider: "groq",
      model: configData.provider.model,
      status: "success",
      inputTokens: 14,
      outputTokens: 9,
      latencyMs: 80,
      finishReason: "stop",
    },
  });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("private test message"), false);
  assert.equal(serialized.includes("runtime-secret"), false);
  assert.equal(serialized.includes("raw provider output"), false);
  assert.equal(serialized.includes("private@example.com"), false);
});

test("Test Lab rejects unknown prompt variables before secret or provider access", async () => {
  const calls = {
    completions: [],
    secrets: 0,
    providers: 0,
  };
  const configData = {
    ...DEFAULT_AI_CONFIG,
    prompts: {
      ...DEFAULT_AI_CONFIG.prompts,
      chat: "Welcome to {{unknownVariable}}",
    },
  };
  const service = createAiRuntimeExecutionService({
    loadSnapshot: async () => ({ version: 12, configData }),
    resolveSecret: async () => {
      calls.secrets += 1;
      return "must-not-resolve";
    },
    executeTestProvider: async () => {
      calls.providers += 1;
      return { outputText: "must not run" };
    },
    logs: {
      reserveAiRequest: async () => ({ id: 15 }),
      completeAiRequest: async (...input) => calls.completions.push(input),
    },
    requestId: () => "invalid-test-lab-prompt",
    now: () => 1_000,
  });

  await assert.rejects(
    service.runAiConfigTest(
      {
        source: "draft",
        feature: "chat",
        message: "private test message",
        context: {},
      },
      { userId: 70 },
    ),
    (error) =>
      error.code === "AI_INVALID_REQUEST" &&
      error.statusCode === 400,
  );

  assert.equal(calls.secrets, 0);
  assert.equal(calls.providers, 0);
  assert.equal(calls.completions.length, 1);
  assert.deepEqual(calls.completions[0][1], {
    inputTokens: null,
    outputTokens: null,
    latencyMs: 0,
    status: "error",
    errorCode: "AI_INVALID_REQUEST",
    safetyBlocked: false,
  });
  assert.equal(
    JSON.stringify(calls.completions).includes("unknownVariable"),
    false,
  );
});

test("successful publish and rollback invalidate the local active runtime cache", async () => {
  let invalidations = 0;
  const repository = {
    publishDraft: async () => ({ version: 5 }),
    getVersion: async () => ({
      id: 8,
      configData: DEFAULT_AI_CONFIG,
    }),
    publishCopiedVersion: async () => ({ version: 6 }),
  };
  const service = createAiConfigService({
    repository,
    credentials: {},
    invalidateRuntime: () => {
      invalidations += 1;
    },
  });

  await service.publishDraft(
    { revision: 3, changeReason: "Publish tested config" },
    { userId: 4 },
  );
  await service.rollbackConfig(
    { targetVersion: 2, changeReason: "Restore stable config" },
    { userId: 4 },
  );

  assert.equal(invalidations, 2);
});

test("runtime preserves stable credential failures while still completing metadata", async () => {
  const fixture = runtimeExecutionFixture();

  await assert.rejects(
    fixture.service.executeAiRequest({
      feature: "chat",
      user: { userId: 55 },
      isTest: true,
      inputText: fixture.inputText,
      context: {},
      operation: async () => {
        throw Object.assign(new Error("Credential is unavailable."), {
          code: "AI_SECRET_UNAVAILABLE",
          errorCode: "AI_SECRET_UNAVAILABLE",
          statusCode: 503,
        });
      },
    }),
    (error) =>
      error.code === "AI_SECRET_UNAVAILABLE" &&
      error.statusCode === 503,
  );
  assert.equal(
    fixture.calls.completions[0][1].errorCode,
    "AI_SECRET_UNAVAILABLE",
  );
});

test("admin AI service exposes runtime controls and metadata reads without secret resolution", async () => {
  const publicService = await import("../src/services/adminAi/index.js");

  assert.equal(typeof publicService.runAiConfigTest, "function");
  assert.equal(typeof publicService.setAiKillSwitch, "function");
  assert.equal(typeof publicService.getOverview, "function");
  assert.equal(typeof publicService.getLogs, "function");
  assert.equal("resolveProviderSecret" in publicService, false);
});
