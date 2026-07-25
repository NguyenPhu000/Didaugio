import assert from "node:assert/strict";
import test from "node:test";
import { createAiConfigService } from "../src/services/adminAi/aiConfig.service.js";
import { createAiCredentialService } from "../src/services/adminAi/aiCredential.service.js";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import { createAiConfigRepository } from "../src/services/adminAi/aiConfig.repository.js";

test("saveDraft rejects stale revisions and never returns a secret", async () => {
  const repository = {
    getForUpdate: async () => ({ id: 1, revision: 4 }),
    saveDraft: async () => assert.fail("must not write stale draft"),
  };
  const service = createAiConfigService({ repository, credentials: {} });

  await assert.rejects(
    service.saveDraft(
      { revision: 3, configData: {}, changeReason: "stale update" },
      { userId: 7 },
    ),
    (error) => error.code === "AI_CONFIG_CONFLICT" && error.statusCode === 409,
  );
});

test("rollback republishes a copied snapshot instead of mutating history", async () => {
  const calls = [];
  const repository = {
    getVersion: async () => ({ id: 8, version: 2, configData: { provider: { adapter: "groq" } } }),
    publishCopiedVersion: async (input) => { calls.push(input); return { version: 6 }; },
  };
  const service = createAiConfigService({ repository, credentials: {} });
  const result = await service.rollbackConfig(
    { targetVersion: 2, changeReason: "Khôi phục cấu hình ổn định" },
    { userId: 7 },
  );
  assert.equal(result.version, 6);
  assert.deepEqual(calls[0].sourceVersionId, 8);
});

test("replaceProviderSecret stores only encrypted material and returns metadata", async () => {
  const writes = [];
  const updatedAt = new Date("2026-07-24T10:00:00.000Z");
  const credentials = createAiCredentialService({
    client: {
      apiKeyManagement: {
        upsert: async (input) => {
          writes.push(input);
          return { serviceName: "groq-primary", keySuffix: "7890", updatedAt };
        },
      },
    },
    encrypt: (value) => `encrypted:${value.length}`,
    decrypt: assert.fail,
  });

  const result = await credentials.replaceProviderSecret(
    "groq-primary",
    "gsk_private_1234567890",
  );

  assert.equal(writes[0].create.apiKey, "encrypted:22");
  assert.equal(writes[0].update.apiKey, "encrypted:22");
  assert.equal(JSON.stringify(writes).includes("gsk_private_1234567890"), false);
  assert.deepEqual(result, {
    reference: "groq-primary",
    configured: true,
    suffix: "7890",
    updatedAt,
  });
});

test("resolveProviderSecret returns plaintext only to service-layer callers", async () => {
  const credentials = createAiCredentialService({
    client: {
      apiKeyManagement: {
        findUnique: async () => ({ apiKey: "encrypted-value", status: "active" }),
      },
    },
    encrypt: assert.fail,
    decrypt: (value) => value === "encrypted-value" ? "runtime-secret" : assert.fail(),
  });

  assert.equal(await credentials.resolveProviderSecret("groq-primary"), "runtime-secret");
});

test("redactAdminAiAuditData omits provider secrets and prompt contents", async () => {
  const { redactAdminAiAuditData } = await import(
    "../src/services/adminAi/aiConfig.service.js"
  );
  const redacted = redactAdminAiAuditData({
    revision: 5,
    changeReason: "rotate credential",
    providerSecret: "gsk_private_1234567890",
    configData: {
      provider: {
        adapter: "groq",
        model: "model-a",
        secretReference: "groq-primary",
      },
      prompts: { chat: "sensitive prompt" },
    },
  });

  assert.deepEqual(redacted, {
    revision: 5,
    changeReason: "rotate credential",
    configData: {
      provider: {
        adapter: "groq",
        model: "model-a",
        secretReference: "groq-primary",
      },
      changedSections: ["provider", "prompts"],
    },
  });
  assert.equal(JSON.stringify(redacted).includes("gsk_private"), false);
  assert.equal(JSON.stringify(redacted).includes("sensitive prompt"), false);
});

test("repository saveDraft uses a revision lock and creates a new immutable snapshot", async () => {
  const calls = [];
  const transaction = {
    aiConfig: {
      findUnique: async () => ({
        id: 1,
        revision: 4,
        activeVersionId: 10,
        draftVersionId: 11,
      }),
      updateMany: async (input) => {
        calls.push(["revision-lock", input]);
        return { count: 1 };
      },
      update: async (input) => {
        calls.push(["config-update", input]);
        return input;
      },
    },
    aiConfigVersion: {
      aggregate: async () => ({ _max: { version: 2 } }),
      create: async (input) => {
        calls.push(["version-create", input]);
        return { id: 12, ...input.data };
      },
      updateMany: async (input) => {
        calls.push(["version-archive", input]);
        return { count: 1 };
      },
      findMany: async () => [],
      deleteMany: async () => assert.fail("nothing should be pruned"),
    },
  };
  const repository = createAiConfigRepository({
    client: { $transaction: async (operation) => operation(transaction) },
  });

  const saved = await repository.saveDraft({
    revision: 4,
    configData: DEFAULT_AI_CONFIG,
    changeReason: "Điều chỉnh cấu hình Chat",
    actorId: 7,
    providerSecret: "must-not-reach-repository-output",
  });

  assert.deepEqual(calls[0][1].where, { id: 1, revision: 4 });
  assert.deepEqual(calls[0][1].data, { revision: { increment: 1 } });
  assert.equal(calls[1][1].data.version, 3);
  assert.equal(calls[1][1].data.configData, DEFAULT_AI_CONFIG);
  assert.equal(saved.revision, 5);
  assert.equal(JSON.stringify(saved).includes("must-not-reach"), false);
});

test("repository rejects a concurrent draft write when the revision lock loses", async () => {
  let reads = 0;
  const transaction = {
    aiConfig: {
      findUnique: async () => {
        reads += 1;
        return reads === 1
          ? { id: 1, revision: 4, activeVersionId: 10, draftVersionId: 11 }
          : { revision: 5 };
      },
      updateMany: async () => ({ count: 0 }),
    },
  };
  const repository = createAiConfigRepository({
    client: { $transaction: async (operation) => operation(transaction) },
  });

  await assert.rejects(
    repository.saveDraft({
      revision: 4,
      configData: DEFAULT_AI_CONFIG,
      changeReason: "Điều chỉnh cấu hình Chat",
      actorId: 7,
    }),
    (error) =>
      error.code === "AI_CONFIG_CONFLICT" &&
      error.statusCode === 409 &&
      error.currentRevision === 5,
  );
});

test("bootstrap skips versions and credentials once mobile_ai already exists", async () => {
  const transaction = {
    aiConfig: {
      upsert: async () => ({
        id: 1,
        activeVersionId: 10,
        draftVersionId: 11,
      }),
      updateMany: async () => ({ count: 0 }),
    },
    aiConfigVersion: {
      create: async () => assert.fail("must not create another version"),
    },
    apiKeyManagement: {
      upsert: async () => assert.fail("must seed environment secret only on first bootstrap"),
    },
  };
  const repository = createAiConfigRepository({
    client: { $transaction: async (operation) => operation(transaction) },
  });

  const result = await repository.ensureDefaultAiConfig({
    configData: DEFAULT_AI_CONFIG,
    getBootstrapCredential: assert.fail,
  });

  assert.deepEqual(result, { bootstrapped: false, id: 1 });
});

test("first bootstrap atomically creates active and draft snapshots and seeds Groq once", async () => {
  const calls = [];
  let nextId = 10;
  const transaction = {
    aiConfig: {
      upsert: async () => ({
        id: 1,
        activeVersionId: null,
        draftVersionId: null,
      }),
      updateMany: async () => ({ count: 1 }),
      update: async (input) => {
        calls.push(["config-update", input]);
        return input;
      },
    },
    aiConfigVersion: {
      create: async (input) => {
        const row = { id: nextId, ...input.data };
        nextId += 1;
        calls.push(["version-create", input]);
        return row;
      },
    },
    apiKeyManagement: {
      upsert: async (input) => {
        calls.push(["credential-upsert", input]);
        return input;
      },
    },
  };
  const repository = createAiConfigRepository({
    client: { $transaction: async (operation) => operation(transaction) },
  });

  const result = await repository.ensureDefaultAiConfig({
    configData: DEFAULT_AI_CONFIG,
    getBootstrapCredential: () => ({
      reference: "groq-primary",
      encrypted: "encrypted-value",
      suffix: "1234",
    }),
  });

  assert.deepEqual(result, { bootstrapped: true, id: 1 });
  assert.equal(calls[0][1].data.version, 1);
  assert.equal(calls[0][1].data.status, "published");
  assert.equal(calls[1][1].data.version, 2);
  assert.equal(calls[1][1].data.status, "draft");
  assert.deepEqual(calls[2][1].data, {
    activeVersionId: 10,
    draftVersionId: 11,
    status: "active",
  });
  assert.equal(calls[3][1].create.apiKey, "encrypted-value");
  assert.deepEqual(calls[3][1].update, {});
});

test("getConfigView returns credential metadata without resolving plaintext", async () => {
  const updatedAt = new Date("2026-07-24T10:00:00.000Z");
  const repository = {
    getConfigView: async () => ({
      key: "mobile_ai",
      revision: 4,
      activeVersion: { version: 3, configData: DEFAULT_AI_CONFIG },
      draftVersion: { version: 4, configData: DEFAULT_AI_CONFIG },
      versions: [],
    }),
  };
  const credentials = {
    getProviderSecretMetadata: async (reference) => ({
      reference,
      configured: true,
      suffix: "7890",
      updatedAt,
    }),
    resolveProviderSecret: async () => assert.fail("admin views are write-only"),
  };
  const service = createAiConfigService({ repository, credentials });

  const view = await service.getConfigView();

  assert.deepEqual(view.providerCredential, {
    reference: "groq-primary",
    configured: true,
    suffix: "7890",
    updatedAt,
  });
  assert.equal(JSON.stringify(view).includes("runtime-secret"), false);
});

test("admin AI public service exports do not expose secret resolution", async () => {
  const publicService = await import("../src/services/adminAi/index.js");

  assert.equal(typeof publicService.getConfigView, "function");
  assert.equal(typeof publicService.saveDraft, "function");
  assert.equal(typeof publicService.publishDraft, "function");
  assert.equal(typeof publicService.rollbackConfig, "function");
  assert.equal(typeof publicService.replaceProviderSecret, "function");
  assert.equal(typeof publicService.ensureDefaultAiConfig, "function");
  assert.equal("resolveProviderSecret" in publicService, false);
});

test("saveDraft sends plaintext only to credential storage and persists parsed config", async () => {
  const repositoryWrites = [];
  const credentialWrites = [];
  const repository = {
    getForUpdate: async () => ({ id: 1, revision: 4 }),
    saveDraft: async (input) => {
      repositoryWrites.push(input);
      return { revision: 5 };
    },
  };
  const credentials = {
    replaceProviderSecret: async (...args) => {
      credentialWrites.push(args);
      return { configured: true };
    },
  };
  const service = createAiConfigService({ repository, credentials });
  const configData = {
    ...DEFAULT_AI_CONFIG,
    prompts: {
      ...DEFAULT_AI_CONFIG.prompts,
      chat: `  ${DEFAULT_AI_CONFIG.prompts.chat}  `,
    },
  };

  await service.saveDraft(
    {
      revision: 4,
      configData,
      changeReason: "Điều chỉnh cấu hình Chat",
      providerSecret: "gsk_private_1234567890",
    },
    { userId: 7 },
  );

  assert.deepEqual(credentialWrites, [
    ["groq-primary", "gsk_private_1234567890"],
  ]);
  assert.equal("providerSecret" in repositoryWrites[0], false);
  assert.equal(
    repositoryWrites[0].configData.prompts.chat,
    DEFAULT_AI_CONFIG.prompts.chat,
  );
});

test("publishDraft archives active, publishes draft, creates a fresh draft, and prunes oldest history", async () => {
  const calls = [];
  const currentDraft = {
    id: 11,
    aiConfigId: 1,
    version: 2,
    status: "draft",
    configData: DEFAULT_AI_CONFIG,
    changeReason: "Draft before publish",
    createdBy: 7,
  };
  const transaction = {
    aiConfig: {
      findUnique: async () => ({
        id: 1,
        revision: 4,
        activeVersionId: 10,
        draftVersionId: 11,
        draftVersion: currentDraft,
      }),
      updateMany: async () => ({ count: 1 }),
      update: async (input) => {
        calls.push(["config-update", input]);
        return input;
      },
    },
    aiConfigVersion: {
      updateMany: async (input) => {
        calls.push(["archive", input]);
        return { count: 1 };
      },
      update: async (input) => {
        calls.push(["publish", input]);
        return { ...currentDraft, ...input.data };
      },
      aggregate: async () => ({ _max: { version: 2 } }),
      create: async (input) => {
        calls.push(["fresh-draft", input]);
        return { id: 12, ...input.data };
      },
      findMany: async () => [
        ...Array.from({ length: 9 }, (_, index) => ({ id: index + 1 })),
        { id: 11 },
        { id: 12 },
      ],
      deleteMany: async (input) => {
        calls.push(["prune", input]);
        return { count: 1 };
      },
    },
  };
  const repository = createAiConfigRepository({
    client: { $transaction: async (operation) => operation(transaction) },
  });

  const published = await repository.publishDraft({
    revision: 4,
    changeReason: "Xuất bản cấu hình đã kiểm tra",
    actorId: 7,
  });

  assert.deepEqual(calls[0][1], {
    where: { id: 10 },
    data: { status: "archived" },
  });
  assert.equal(calls[1][1].data.status, "published");
  assert.equal(calls[2][1].data.version, 3);
  assert.deepEqual(calls[3][1].data, {
    activeVersionId: 11,
    draftVersionId: 12,
    updatedBy: 7,
  });
  assert.deepEqual(calls[4][1].where.id.in, [1]);
  assert.equal(published.revision, 5);
  assert.equal(published.status, "published");
});
