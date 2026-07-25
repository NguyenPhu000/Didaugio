import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  createAiConfigService,
  redactAdminAiAuditData,
} from "../src/services/adminAi/aiConfig.service.js";
import {
  createAiCredentialService,
} from "../src/services/adminAi/aiCredential.service.js";
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

const PRIVATE_SECRET = "gsk_private_1234567890";

test("provider secrets are encrypted on write and reduced to metadata on every Admin read or audit", async () => {
  const writes = [];
  const updatedAt = new Date("2026-07-25T02:00:00.000Z");
  const credentials = createAiCredentialService({
    client: {
      apiKeyManagement: {
        upsert: async (input) => {
          writes.push(input);
          return {
            serviceName: "groq-primary",
            keySuffix: "7890",
            updatedAt,
          };
        },
      },
    },
    encrypt: (secret) => `ciphertext:${secret.length}`,
    decrypt: assert.fail,
  });

  const writeResult = await credentials.replaceProviderSecret(
    "groq-primary",
    PRIVATE_SECRET,
  );
  assert.deepEqual(writeResult, {
    reference: "groq-primary",
    configured: true,
    suffix: "7890",
    updatedAt,
  });
  assert.equal(JSON.stringify(writes).includes(PRIVATE_SECRET), false);
  assert.equal(writes[0].create.apiKey, `ciphertext:${PRIVATE_SECRET.length}`);

  const service = createAiConfigService({
    repository: {
      getConfigView: async () => ({
        key: "mobile_ai",
        revision: 4,
        activeVersion: { version: 3, configData: DEFAULT_AI_CONFIG },
        draftVersion: { version: 4, configData: DEFAULT_AI_CONFIG },
        versions: [],
      }),
    },
    credentials: {
      getProviderSecretMetadata: async () => writeResult,
      resolveProviderSecret: async () => assert.fail("Admin reads are write-only"),
    },
  });
  const view = await service.getConfigView();
  assert.deepEqual(view.providerCredential, writeResult);
  assert.equal(JSON.stringify(view).includes(PRIVATE_SECRET), false);

  const audit = redactAdminAiAuditData({
    revision: 4,
    changeReason: "Rotate provider credential",
    providerSecret: PRIVATE_SECRET,
    configData: {
      ...DEFAULT_AI_CONFIG,
      prompts: { ...DEFAULT_AI_CONFIG.prompts, chat: "private prompt" },
      safety: {
        ...DEFAULT_AI_CONFIG.safety,
        blockedKeywords: ["private keyword"],
      },
    },
  });
  const serializedAudit = JSON.stringify(audit);
  assert.equal(serializedAudit.includes(PRIVATE_SECRET), false);
  assert.equal(serializedAudit.includes("private prompt"), false);
  assert.equal(serializedAudit.includes("private keyword"), false);
  assert.equal(audit.configData.provider.model, DEFAULT_AI_CONFIG.provider.model);
});

test("request-log writes and Admin log reads expose metadata only", async () => {
  const calls = { creates: [], finds: [] };
  const client = {
    aiRequestLog: {
      create: async (input) => {
        calls.creates.push(input);
        return { id: 51, ...input.data };
      },
      deleteMany: async () => ({ count: 0 }),
      findMany: async (input) => {
        calls.finds.push(input);
        return [];
      },
      count: async () => 0,
    },
    $transaction: async (operations) => Promise.all(operations),
  };
  const logs = createAiLogService({
    client,
    redisProvider: () => null,
    encryptionKey: "11".repeat(32),
    now: () => Date.parse("2026-07-25T03:00:00.000Z"),
  });

  await logs.reserveAiRequest({
    requestId: "test-request",
    userId: 88,
    feature: "chat",
    provider: "groq",
    model: "model-a",
    configVersion: 3,
    dailyLimit: 0,
    isTest: true,
    prompt: "private prompt",
    response: "private response",
    email: "private@example.com",
    phone: "0900000000",
    coordinates: [105.78, 10.03],
  });
  await logs.getLogs({ page: 1, limit: 50 });

  const persistedKeys = Object.keys(calls.creates[0].data).sort();
  assert.deepEqual(persistedKeys, [
    "anonymousUserRef",
    "configVersion",
    "expiresAt",
    "feature",
    "isTest",
    "model",
    "provider",
    "requestId",
    "safetyBlocked",
    "status",
  ]);
  for (const sensitiveValue of [
    "private prompt",
    "private response",
    "private@example.com",
    "0900000000",
    "105.78",
  ]) {
    assert.equal(JSON.stringify(calls.creates).includes(sensitiveValue), false);
  }

  assert.deepEqual(
    Object.entries(calls.finds[0].select)
      .filter(([, selected]) => selected)
      .map(([field]) => field)
      .sort(),
    [
      "configVersion",
      "createdAt",
      "errorCode",
      "feature",
      "feedback",
      "inputTokens",
      "latencyMs",
      "model",
      "outputTokens",
      "provider",
      "requestId",
      "safetyBlocked",
      "status",
    ],
  );
});

test("Test Lab rows are excluded from production overview metrics at the query boundary", async () => {
  const queries = [];
  const overview = createAiOverviewService({
    client: {
      aiRequestLog: {
        findMany: async (input) => {
          queries.push(input);
          return [];
        },
      },
    },
    getRuntime: async () => ({
      status: "active",
      version: 7,
      configData: DEFAULT_AI_CONFIG,
    }),
  });

  const result = await overview.getOverview();
  assert.deepEqual(queries[0].where, { isTest: false });
  assert.equal(result.totals.requests, 0);
});

test("Mobile runtime reads only the published snapshot and ignores draft-only changes", async () => {
  const queries = [];
  const publishedConfig = {
    ...DEFAULT_AI_CONFIG,
    prompts: { ...DEFAULT_AI_CONFIG.prompts, chat: "published prompt" },
  };
  const client = {
    systemConfig: {
      findUnique: async () => null,
    },
    aiConfig: {
      findUnique: async (input) => {
        queries.push(input);
        return {
          activeVersion: { version: 9, configData: publishedConfig },
          draftVersion: {
            version: 10,
            configData: {
              ...publishedConfig,
              prompts: { ...publishedConfig.prompts, chat: "draft prompt" },
            },
          },
        };
      },
    },
  };
  const runtime = createAiRuntimeConfigService({ client });

  const resolved = await runtime.getActiveAiRuntime();
  assert.equal(resolved.version, 9);
  assert.equal(resolved.configData.prompts.chat, "published prompt");
  assert.deepEqual(queries[0].select, {
    activeVersion: {
      select: {
        version: true,
        configData: true,
      },
    },
  });
});

test("stale draft revisions return 409 without writing and rollback republishes an immutable copy", async () => {
  const calls = { saves: 0, copies: [] };
  const repository = {
    getForUpdate: async () => ({ id: 1, revision: 8 }),
    saveDraft: async () => {
      calls.saves += 1;
    },
    getVersion: async () => ({
      id: 31,
      version: 3,
      configData: DEFAULT_AI_CONFIG,
    }),
    publishCopiedVersion: async (input) => {
      calls.copies.push(input);
      return { id: 44, version: 11, status: "published" };
    },
  };
  const service = createAiConfigService({ repository, credentials: {} });

  await assert.rejects(
    service.saveDraft(
      {
        revision: 7,
        configData: DEFAULT_AI_CONFIG,
        changeReason: "Stale draft update",
      },
      { userId: 12 },
    ),
    (error) =>
      error.code === "AI_CONFIG_CONFLICT" &&
      error.statusCode === 409 &&
      error.currentRevision === 8,
  );
  assert.equal(calls.saves, 0);

  const restored = await service.rollbackConfig(
    { targetVersion: 3, changeReason: "Restore stable snapshot" },
    { userId: 12 },
  );
  assert.deepEqual(restored, { id: 44, version: 11, status: "published" });
  assert.deepEqual(calls.copies, [{
    sourceVersionId: 31,
    configData: DEFAULT_AI_CONFIG,
    changeReason: "Restore stable snapshot",
    actorId: 12,
  }]);
});

test("kill switch and missing published configuration produce stable Mobile fallback errors", async () => {
  const cases = [
    {
      systemConfig: {
        value: {
          enabled: true,
          message: "AI is temporarily disabled.",
          updatedAt: "2026-07-25T04:00:00.000Z",
        },
      },
      activeVersion: { version: 9, configData: DEFAULT_AI_CONFIG },
      expected: {
        code: "AI_DISABLED",
        statusCode: 503,
        message: "AI is temporarily disabled.",
      },
      expectedActiveReads: 0,
    },
    {
      systemConfig: null,
      activeVersion: null,
      expected: {
        code: "AI_MAINTENANCE",
        statusCode: 503,
        message: "AI runtime is under maintenance.",
      },
      expectedActiveReads: 1,
    },
  ];

  for (const fixture of cases) {
    let activeReads = 0;
    const runtimeConfig = createAiRuntimeConfigService({
      client: {
        systemConfig: {
          findUnique: async () => fixture.systemConfig,
        },
        aiConfig: {
          findUnique: async () => {
            activeReads += 1;
            return fixture.activeVersion
              ? { activeVersion: fixture.activeVersion }
              : null;
          },
        },
      },
    });
    const execution = createAiRuntimeExecutionService({
      getRuntime: runtimeConfig.getActiveAiRuntime,
      logs: {
        reserveAiRequest: async () => assert.fail("fallback must precede logging"),
        completeAiRequest: async () => assert.fail("fallback must precede logging"),
      },
    });

    await assert.rejects(
      execution.executeAiRequest({
        feature: "chat",
        user: { userId: 5 },
        inputText: "safe input",
        context: {},
        operation: async () => assert.fail("provider must not run"),
      }),
      (error) => {
        assert.deepEqual(
          {
            code: error.code,
            statusCode: error.statusCode,
            message: error.message,
          },
          fixture.expected,
        );
        return true;
      },
    );
    assert.equal(activeReads, fixture.expectedActiveReads);
  }
});

test("input and output keyword blocks return the same stable safe error without leaking output", async () => {
  const safeResponse = "This request cannot be processed.";
  const configData = {
    ...DEFAULT_AI_CONFIG,
    safety: {
      blockedKeywords: ["literal .* marker"],
      matchMode: "substring",
      diacriticInsensitive: false,
      safeResponse,
    },
  };

  for (const blockedAt of ["input", "output"]) {
    let providerCalls = 0;
    const completions = [];
    const service = createAiRuntimeExecutionService({
      getRuntime: async () => ({
        status: "active",
        version: 4,
        configData,
        killSwitch: { enabled: false, message: null, updatedAt: null },
      }),
      logs: {
        reserveAiRequest: async () => ({ id: 72 }),
        completeAiRequest: async (...input) => completions.push(input),
      },
      requestId: () => `blocked-${blockedAt}`,
      now: () => 100,
    });
    const privateProviderOutput = "private provider output literal .* marker";

    await assert.rejects(
      service.executeAiRequest({
        feature: "chat",
        user: { userId: 5 },
        inputText: blockedAt === "input"
          ? "literal .* marker"
          : "safe input",
        context: {},
        operation: async () => {
          providerCalls += 1;
          return {
            outputText: blockedAt === "output"
              ? privateProviderOutput
              : "safe output",
          };
        },
      }),
      (error) =>
        error.code === "AI_SAFETY_BLOCKED" &&
        error.statusCode === 422 &&
        error.message === safeResponse &&
        !error.message.includes("private provider output"),
    );
    assert.equal(providerCalls, blockedAt === "input" ? 0 : 1);
    assert.deepEqual(completions[0][1], {
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      status: "blocked",
      errorCode: "AI_SAFETY_BLOCKED",
      safetyBlocked: true,
    });
    assert.equal(
      JSON.stringify(completions).includes(privateProviderOutput),
      false,
    );
  }
});
