# Lean Admin AI Control Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a small Admin control center that configures, tests, publishes, rolls back, observes, and safely disables the existing Mobile AI runtime.

**Architecture:** Add exactly three Prisma models: one logical configuration, immutable JSON configuration versions, and metadata-only request logs. A server-owned Zod contract validates every snapshot; the Mobile runtime consumes only the active published snapshot through a focused resolver, while eight permission-gated Admin endpoints expose the lean control plane. The existing `SystemConfig`, `ApiKeyManagement`, `AuditLog`, Admin shell, and AI services are reused.

**Tech Stack:** Node.js 22 test runner, Express 5, Prisma 5, PostgreSQL, Zod 4, Groq SDK 0.18, React 19, Vite 7, Vitest 4, React Testing Library, TanStack Query 5, Tailwind CSS 3, Radix UI, Recharts.

## Global Constraints

- Add exactly three Prisma models: `AiConfig`, `AiConfigVersion`, and `AiRequestLog`.
- Expose exactly eight routes under `/api/v1/admin/ai`.
- Only Super Admin and Admin participate in the module; accounts without an AI permission cannot see it or call its APIs.
- Phase one supports the reviewed Groq adapter only.
- Do not add RAG/vector indexing, document upload, cache-management UI, email alerts, background jobs, Admin-authored regex, automatic multi-provider fallback, or AI-specific Redis Pub/Sub.
- Draft changes never affect Mobile before publish.
- Keep at most ten configuration versions while preserving active, draft, and rollback-required rows.
- Provider secrets use the existing AES-256-GCM `FIELD_ENCRYPTION_KEY` utility and are write-only to the browser.
- Raw prompts, responses, exact coordinates, authentication data, email, phone number, and internal user IDs are not written to `AiRequestLog`.
- Use exact/substr keyword safety only; check both input and output.
- Test Lab rows use `isTest=true` and are excluded from production metrics.
- Do not modify the user's unrelated changes in `app/package.json` or `web/src/components/auth/`.
- Use tests first for every production-code change.

---

## File Structure

### Server control plane

- `server/src/models/schemas/adminAi/adminAi.schema.js` — one Zod contract for configuration, mutations, Test Lab, overview, and log filters.
- `server/src/config/defaultAiConfig.js` — one valid bootstrap snapshot matching current Mobile behavior.
- `server/src/services/adminAi/aiConfig.repository.js` — Prisma reads/writes and ten-version retention.
- `server/src/services/adminAi/aiCredential.service.js` — write-only encrypted Groq credential storage.
- `server/src/services/adminAi/aiConfig.service.js` — draft/test/publish/rollback orchestration.
- `server/src/services/adminAi/aiOverview.service.js` — aggregate request-log metrics.
- `server/src/services/adminAi/aiLog.service.js` — metadata-only request lifecycle and log queries.
- `server/src/controllers/adminAi/adminAi.controller.js` — HTTP response mapping only.
- `server/src/routes/adminAi/adminAi.route.js` — exactly eight permission-gated routes.

### Server runtime

- `server/src/services/ai/runtime/aiRuntimeConfig.js` — active snapshot loading, local TTL, defaults, and kill-switch resolution.
- `server/src/services/ai/runtime/aiKeywordSafety.js` — Vietnamese exact/substr matching.
- `server/src/services/ai/runtime/aiContextPolicy.js` — server-owned context allowlist and token/TTL bounds.
- `server/src/services/ai/runtime/aiRuntimeExecution.js` — quota reservation, safe provider execution, metadata log completion.
- Existing Chat, Planner, Streaming, and Voice services consume this runtime contract instead of module-level environment constants.

### Web

- `web/src/apis/adminAiService.js` — the eight HTTP contracts.
- `web/src/hooks/queries/useAdminAiQueries.js` — query/mutation ownership and invalidation.
- `web/src/pages/admin/ai/AdminAiPage.jsx` — five-tab shell and shared status header.
- `web/src/pages/admin/ai/components/` — focused Overview, Configuration, Safety, Logs, and Test Lab panels.
- `web/src/pages/admin/ai/adminAiForm.js` — pure API-to-form and form-to-API transformations.

---

### Task 1: Add the Three-Table Persistence Contract

**Files:**
- Create: `server/prisma/migrations/20260724170000_create_lean_admin_ai_control_center/migration.sql`
- Create: `server/test/adminAiMigration.contract.test.js`
- Modify: `server/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma delegates `prisma.aiConfig`, `prisma.aiConfigVersion`, and `prisma.aiRequestLog`.
- Preserves: existing `SystemConfig`, `AuditLog`, `AiPromptHistory`, and `ApiKeyManagement` tables.
- Adds: encrypted credential metadata columns to the existing `ApiKeyManagement` model without creating a fourth model.

- [ ] **Step 1: Write the failing migration contract test**

```js
// server/test/adminAiMigration.contract.test.js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL(
    "../prisma/migrations/20260724170000_create_lean_admin_ai_control_center/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

test("lean Admin AI introduces exactly the three approved models", () => {
  for (const model of ["AiConfig", "AiConfigVersion", "AiRequestLog"]) {
    assert.match(schema, new RegExp(`model ${model} \\\\{`));
  }
  for (const banned of [
    "AiProviderConfig",
    "AiPromptTemplate",
    "AiRule",
    "AiRuntimeRelease",
    "AiBackgroundJob",
  ]) {
    assert.doesNotMatch(schema, new RegExp(`model ${banned} \\\\{`));
  }
});

test("migration creates three tables and metadata indexes", () => {
  assert.equal((migration.match(/CREATE TABLE/g) || []).length, 3);
  assert.match(migration, /CREATE TABLE "ai_configs"/);
  assert.match(migration, /CREATE TABLE "ai_config_versions"/);
  assert.match(migration, /CREATE TABLE "ai_request_logs"/);
  assert.match(migration, /ai_request_logs_created_at_idx/);
  assert.match(migration, /ai_request_logs_is_test_created_at_idx/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
cd server
node --test test/adminAiMigration.contract.test.js
```

Expected: FAIL because the migration and three models do not exist.

- [ ] **Step 3: Add the Prisma models and credential metadata**

Add these model shapes to `server/prisma/schema.prisma`, with named relations added to `User`:

```prisma
model AiConfig {
  id              Int              @id @default(autoincrement())
  key             String           @unique
  activeVersionId Int?             @unique @map("active_version_id")
  draftVersionId  Int?             @unique @map("draft_version_id")
  status          String           @default("active")
  revision        Int              @default(0)
  updatedBy       Int?             @map("updated_by")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  versions        AiConfigVersion[] @relation("AiConfigVersions")
  activeVersion   AiConfigVersion? @relation("ActiveAiConfigVersion", fields: [activeVersionId], references: [id], onDelete: SetNull)
  draftVersion    AiConfigVersion? @relation("DraftAiConfigVersion", fields: [draftVersionId], references: [id], onDelete: SetNull)
  updatedByUser   User?            @relation("AiConfigUpdatedBy", fields: [updatedBy], references: [id], onDelete: SetNull)

  @@map("ai_configs")
}

model AiConfigVersion {
  id            Int       @id @default(autoincrement())
  aiConfigId    Int       @map("ai_config_id")
  version       Int
  status        String
  configData    Json      @map("config_data")
  changeReason  String    @map("change_reason")
  createdBy     Int?      @map("created_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  publishedAt   DateTime? @map("published_at")
  aiConfig      AiConfig  @relation("AiConfigVersions", fields: [aiConfigId], references: [id], onDelete: Cascade)
  activeFor     AiConfig? @relation("ActiveAiConfigVersion")
  draftFor      AiConfig? @relation("DraftAiConfigVersion")
  createdByUser User?     @relation("AiConfigVersionCreatedBy", fields: [createdBy], references: [id], onDelete: SetNull)

  @@unique([aiConfigId, version])
  @@index([aiConfigId, status])
  @@map("ai_config_versions")
}

model AiRequestLog {
  id               Int       @id @default(autoincrement())
  requestId        String    @unique @map("request_id")
  anonymousUserRef String?   @map("anonymous_user_ref")
  feature          String
  provider         String
  model            String
  configVersion    Int?      @map("config_version")
  inputTokens      Int?      @map("input_tokens")
  outputTokens     Int?      @map("output_tokens")
  latencyMs        Int?      @map("latency_ms")
  status           String
  errorCode        String?   @map("error_code")
  safetyBlocked    Boolean   @default(false) @map("safety_blocked")
  feedback         String?
  feedbackReason   String?   @map("feedback_reason")
  isTest           Boolean   @default(false) @map("is_test")
  createdAt        DateTime  @default(now()) @map("created_at")
  expiresAt        DateTime  @map("expires_at")

  @@index([createdAt])
  @@index([isTest, createdAt])
  @@index([feature, status, createdAt])
  @@map("ai_request_logs")
}
```

Add these relation fields to the existing `User` model:

```prisma
aiConfigsUpdated        AiConfig[]        @relation("AiConfigUpdatedBy")
aiConfigVersionsCreated AiConfigVersion[] @relation("AiConfigVersionCreatedBy")
```

Modify the existing `ApiKeyManagement` model without adding another model:

```prisma
model ApiKeyManagement {
  id           Int       @id @default(autoincrement())
  serviceName  String    @unique @map("service_name")
  apiKey       String    @map("api_key") @db.Text
  keySuffix    String?   @map("key_suffix")
  monthlyLimit Int       @default(1000) @map("monthly_limit")
  currentUsage Int       @default(0) @map("current_usage")
  resetDay     Int       @default(1) @map("reset_day")
  status       String    @default("active")
  expiresAt    DateTime? @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("api_keys_management")
}
```

- [ ] **Step 4: Generate and complete the migration**

Generate the table, index, foreign-key, and credential-column SQL for inspection:

```powershell
cd server
npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script
```

Create the exact planned file `server/prisma/migrations/20260724170000_create_lean_admin_ai_control_center/migration.sql` from that DDL. Verify it creates only the three approved tables. Before adding unique `service_name`, add a `DO` block that raises an exception when duplicate non-null service names exist; do not silently delete credential rows. Append the seven permission seeds:

```sql
INSERT INTO "permissions" ("name", "display_name", "module", "description")
VALUES
  ('ai.view', 'Xem AI Control Center', 'ai', 'Xem dashboard và cấu hình AI'),
  ('ai.config.manage', 'Sửa cấu hình AI', 'ai', 'Tạo và sửa draft'),
  ('ai.config.publish', 'Phát hành cấu hình AI', 'ai', 'Publish và rollback'),
  ('ai.secrets.manage', 'Quản lý khóa AI', 'ai', 'Thay khóa provider'),
  ('ai.logs.view', 'Xem log AI', 'ai', 'Xem metadata vận hành'),
  ('ai.test.run', 'Chạy AI Test Lab', 'ai', 'Chạy request thử nghiệm'),
  ('ai.kill_switch.manage', 'Điều khiển AI khẩn cấp', 'ai', 'Bật hoặc tắt AI')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'super_admin' AND p.module = 'ai'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
JOIN "permissions" p ON p.name IN (
  'ai.view', 'ai.config.manage', 'ai.logs.view', 'ai.test.run'
)
WHERE r.name = 'admin'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
```

- [ ] **Step 5: Verify schema and migration**

Run:

```powershell
cd server
npx prisma format --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
node --test test/adminAiMigration.contract.test.js
```

Expected: Prisma validation succeeds and the contract test passes.

- [ ] **Step 6: Commit**

```powershell
git add server/prisma/schema.prisma server/prisma/migrations/20260724170000_create_lean_admin_ai_control_center/migration.sql server/test/adminAiMigration.contract.test.js
git commit -m "feat: add lean admin AI persistence"
```

---

### Task 2: Define the Configuration, Safety, and Context Contracts

**Files:**
- Create: `server/src/models/schemas/adminAi/adminAi.schema.js`
- Create: `server/src/models/schemas/adminAi/index.js`
- Create: `server/src/config/defaultAiConfig.js`
- Create: `server/test/adminAiConfigSchema.test.js`
- Modify: `server/src/models/schemas/index.js`
- Modify: `server/src/models/index.js`

**Interfaces:**
- Produces: `aiConfigDataSchema`, `aiDraftUpdateSchema`, `aiTestRequestSchema`, `aiPublishSchema`, `aiRollbackSchema`, `aiKillSwitchSchema`, and `aiLogsQuerySchema`.
- Produces: `normalizeKeyword(value, diacriticInsensitive) -> string`.
- Produces: `DEFAULT_AI_CONFIG`, a schema-valid Groq snapshot that preserves the current Chat, Planner, and Voice behavior.
- Enforces: Groq-only adapter, three prompt scopes, registered context source enum, bounded keyword arrays, and no unknown keys.

- [ ] **Step 1: Write failing schema tests**

```js
// server/test/adminAiConfigSchema.test.js
import assert from "node:assert/strict";
import test from "node:test";
import {
  aiConfigDataSchema,
  aiDraftUpdateSchema,
  normalizeKeyword,
} from "../src/models/schemas/adminAi/adminAi.schema.js";

const validConfig = {
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    secretReference: "groq-primary",
  },
  modelParameters: {
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 2000,
    timeoutMs: 15000,
  },
  prompts: { chat: "Chat {{context}}", planner: "Plan {{context}}", voice: "Voice {{context}}" },
  context: {
    enabledSources: ["coarseLocation", "travelPreferences", "places"],
    fieldAllowlist: ["currentCity", "budget", "partySize", "tripDuration"],
    maxTokens: 1800,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: ["từ cấm"],
    matchMode: "substring",
    diacriticInsensitive: false,
    safeResponse: "Yêu cầu này không thể được xử lý.",
  },
  quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
  fallback: { maintenanceMessage: "AI đang bảo trì.", staticPlannerEnabled: true },
};

test("accepts the lean config and strips no unknown executable values", () => {
  assert.equal(aiConfigDataSchema.safeParse(validConfig).success, true);
  assert.equal(
    aiConfigDataSchema.safeParse({ ...validConfig, javascript: "process.exit()" }).success,
    false,
  );
  assert.equal(
    aiConfigDataSchema.safeParse({
      ...validConfig,
      provider: { ...validConfig.provider, adapter: "arbitrary-rest" },
    }).success,
    false,
  );
  assert.equal(
    aiConfigDataSchema.safeParse({
      ...validConfig,
      provider: { ...validConfig.provider, baseUrl: "http://127.0.0.1:11434" },
    }).success,
    false,
  );
});

test("draft updates require revision and bounded reason", () => {
  assert.equal(
    aiDraftUpdateSchema.safeParse({
      revision: 2,
      configData: validConfig,
      changeReason: "Điều chỉnh prompt Chat",
    }).success,
    true,
  );
  assert.equal(aiDraftUpdateSchema.safeParse({ revision: 2, configData: validConfig }).success, false);
});

test("Vietnamese normalization is deterministic", () => {
  assert.equal(normalizeKeyword("  TỪ   CẤM ", false), "từ cấm");
  assert.equal(normalizeKeyword("  TỪ   CẤM ", true), "tu cam");
});
```

- [ ] **Step 2: Run RED**

```powershell
cd server
node --test test/adminAiConfigSchema.test.js
```

Expected: FAIL because the schema module does not exist.

- [ ] **Step 3: Implement strict Zod contracts**

Use `.strict()` on every persisted object. Bound temperature to `0..1`, Top P to `0..1`, maximum output tokens to `256..4096`, timeout to `3000..30000`, each prompt to `1..12000` characters, keyword count to `500`, each keyword to `1..120`, context tokens to `256..4000`, and daily quotas to `0..10000`.

```js
export const normalizeKeyword = (value, diacriticInsensitive = false) => {
  const normalized = String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
  return diacriticInsensitive
    ? normalized.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d")
    : normalized;
};

const providerSchema = z.object({
  adapter: z.literal("groq"),
  baseUrl: z.string().url().max(300).refine(
    (value) => new URL(value).origin === "https://api.groq.com",
    "Groq base URL is not approved",
  ),
  model: z.string().trim().min(1).max(160),
  secretReference: z.string().trim().min(1).max(100),
}).strict();
```

Define mutation contracts with these exact shapes:

```js
export const aiDraftUpdateSchema = z.object({
  revision: z.number().int().nonnegative(),
  configData: aiConfigDataSchema,
  changeReason: z.string().trim().min(5).max(300),
  providerSecret: z.string().trim().min(20).max(500).optional(),
}).strict();

export const aiTestRequestSchema = z.object({
  source: z.enum(["draft", "published"]),
  feature: z.enum(["chat", "planner", "voice"]),
  message: z.string().trim().min(1).max(4000),
  context: z.object({
    currentCity: z.string().trim().max(120).optional(),
    budget: z.number().nonnegative().optional(),
    partySize: z.number().int().min(1).max(20).optional(),
    tripDuration: z.number().int().min(1).max(14).optional(),
  }).strict().optional().default({}),
}).strict();
```

Create `DEFAULT_AI_CONFIG` using:

```js
export const DEFAULT_AI_CONFIG = Object.freeze({
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: process.env.GROQ_MODEL_NAME || "meta-llama/llama-4-scout-17b-16e-instruct",
    secretReference: "groq-primary",
  },
  modelParameters: { temperature: 0.3, topP: 0.9, maxTokens: 2000, timeoutMs: 15000 },
  prompts: {
    chat: "Bạn là Genie, trợ lý du lịch địa phương. Trả lời ngắn gọn, trung thực và chỉ dùng dữ liệu địa điểm do hệ thống cung cấp.",
    planner: "Tạo lịch trình khả thi theo số ngày, ngân sách và danh sách địa điểm do hệ thống cung cấp. Không tự tạo địa điểm.",
    voice: "Giới thiệu địa điểm tự nhiên bằng tiếng Việt trong 3-4 câu ngắn. Không dùng emoji.",
  },
  context: {
    enabledSources: ["coarseLocation", "travelPreferences", "places", "time"],
    fieldAllowlist: ["currentCity", "travelPreferences", "budget", "partySize", "tripDuration", "places", "timeOfDay"],
    maxTokens: 1800,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: [],
    matchMode: "substring",
    diacriticInsensitive: false,
    safeResponse: "Genie không thể hỗ trợ yêu cầu này.",
  },
  quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
  fallback: { maintenanceMessage: "Trợ lý AI đang bảo trì, vui lòng thử lại sau.", staticPlannerEnabled: true },
});
```

- [ ] **Step 4: Run GREEN**

```powershell
cd server
node --test test/adminAiConfigSchema.test.js
```

Expected: all schema tests pass.

- [ ] **Step 5: Commit**

```powershell
git add server/src/config/defaultAiConfig.js server/src/models/schemas/adminAi server/src/models/schemas/index.js server/src/models/index.js server/test/adminAiConfigSchema.test.js
git commit -m "feat: define lean admin AI contracts"
```

---

### Task 3: Implement Versioned Configuration and Write-Only Credentials

**Files:**
- Create: `server/src/services/adminAi/aiConfig.repository.js`
- Create: `server/src/services/adminAi/aiCredential.service.js`
- Create: `server/src/services/adminAi/aiConfig.service.js`
- Create: `server/src/services/adminAi/index.js`
- Create: `server/test/adminAiConfigService.test.js`
- Modify: `server/src/server.js`

**Interfaces:**
- Produces: `getConfigView()`, `saveDraft(input, actor)`, `publishDraft(input, actor)`, and `rollbackConfig(input, actor)`.
- Produces: `replaceProviderSecret(reference, plaintext) -> { reference, configured, suffix, updatedAt }`.
- Produces: `resolveProviderSecret(reference) -> string`, never callable from controllers.
- Produces: `redactAdminAiAuditData(value) -> metadata-only object`.
- Depends on: Task 2 `aiConfigDataSchema`.

- [ ] **Step 1: Write failing repository/service tests with injected Prisma**

```js
// server/test/adminAiConfigService.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { createAiConfigService } from "../src/services/adminAi/aiConfig.service.js";

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
```

- [ ] **Step 2: Run RED**

```powershell
cd server
node --test test/adminAiConfigService.test.js
```

Expected: FAIL because the services do not exist.

- [ ] **Step 3: Implement credential encryption by reusing `fieldEncryption.js`**

```js
// aiCredential.service.js
import prisma from "../../config/prismaClient.js";
import { decryptField, encryptField } from "../../utils/fieldEncryption.js";

export async function replaceProviderSecret(reference, plaintext) {
  const encrypted = encryptField(plaintext);
  const suffix = String(plaintext).slice(-4);
  const row = await prisma.apiKeyManagement.upsert({
    where: { serviceName: reference },
    create: { serviceName: reference, apiKey: encrypted, keySuffix: suffix },
    update: { apiKey: encrypted, keySuffix: suffix, status: "active" },
    select: { serviceName: true, keySuffix: true, updatedAt: true },
  });
  return { reference: row.serviceName, configured: true, suffix: row.keySuffix, updatedAt: row.updatedAt };
}

export async function resolveProviderSecret(reference) {
  const row = await prisma.apiKeyManagement.findUnique({
    where: { serviceName: reference },
    select: { apiKey: true, status: true },
  });
  if (!row || row.status !== "active") {
    throw Object.assign(new Error("Provider credential is unavailable."), {
      code: "AI_SECRET_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return decryptField(row.apiKey);
}
```

- [ ] **Step 4: Implement transactional draft/publish/rollback**

Repository requirements:

- Create `mobile_ai` lazily with a system-authored active `DEFAULT_AI_CONFIG` snapshot and a draft copy, using nullable actor fields only for this bootstrap.
- During first bootstrap only, if `groq-primary` has no credential and `GROQ_API_KEY` exists, encrypt and store that environment value; after bootstrap, runtime reads the credential repository.
- Run `ensureDefaultAiConfig()` before the server starts accepting requests so the migration does not cause Mobile AI downtime.
- Lock by revision using `updateMany({ where: { id, revision }, data: { revision: { increment: 1 } } })`.
- Create immutable numbered versions inside a Prisma transaction.
- On publish: mark the previous active row `archived`, mark draft `published`, update `activeVersionId`, then create a fresh draft copy.
- Keep at most ten rows total. Protect the active and draft IDs, then delete the oldest unreferenced rows until the total is ten.
- Return a view that replaces credentials with `{ configured, suffix, updatedAt }`.

```js
export const createAiConfigService = ({ repository, credentials }) => ({
  async saveDraft(input, actor) {
    const current = await repository.getForUpdate();
    if (current.revision !== input.revision) {
      throw Object.assign(new Error("AI configuration changed."), {
        code: "AI_CONFIG_CONFLICT",
        statusCode: 409,
        currentRevision: current.revision,
      });
    }
    if (input.providerSecret) {
      await credentials.replaceProviderSecret(
        input.configData.provider.secretReference,
        input.providerSecret,
      );
    }
    return repository.saveDraft({ ...input, actorId: actor.userId });
  },
  async publishDraft(input, actor) {
    return repository.publishDraft({ ...input, actorId: actor.userId });
  },
  async rollbackConfig(input, actor) {
    const source = await repository.getVersion(input.targetVersion);
    if (!source) throw Object.assign(new Error("Version not found."), { statusCode: 404, code: "AI_VERSION_NOT_FOUND" });
    return repository.publishCopiedVersion({
      sourceVersionId: source.id,
      configData: source.configData,
      changeReason: input.changeReason,
      actorId: actor.userId,
    });
  },
});

export function redactAdminAiAuditData(value) {
  if (!value || typeof value !== "object") return value;
  return {
    revision: value.revision,
    changeReason: value.changeReason,
    configData: value.configData
      ? {
          provider: {
            adapter: value.configData.provider?.adapter,
            model: value.configData.provider?.model,
            secretReference: value.configData.provider?.secretReference,
          },
          changedSections: Object.keys(value.configData),
        }
      : undefined,
  };
}
```

- [ ] **Step 5: Run focused and Prisma validation tests**

```powershell
cd server
node --test test/adminAiConfigService.test.js
npx prisma validate --schema=prisma/schema.prisma
```

Expected: tests and schema validation pass.

- [ ] **Step 6: Bootstrap before listening**

Call `await ensureDefaultAiConfig()` after environment validation and before `httpServer.listen(...)`. Bootstrap must be idempotent; a second start neither creates another logical config nor increments the published version.

- [ ] **Step 7: Commit**

```powershell
git add server/src/services/adminAi server/src/server.js server/test/adminAiConfigService.test.js
git commit -m "feat: add versioned AI configuration service"
```

---

### Task 4: Add Metadata Logging, Overview, Quota, and Runtime Guards

**Files:**
- Create: `server/src/services/adminAi/aiLog.service.js`
- Create: `server/src/services/adminAi/aiOverview.service.js`
- Create: `server/src/services/ai/runtime/aiKeywordSafety.js`
- Create: `server/src/services/ai/runtime/aiContextPolicy.js`
- Create: `server/src/services/ai/runtime/aiRuntimeConfig.js`
- Create: `server/src/services/ai/runtime/aiRuntimeExecution.js`
- Create: `server/test/aiRuntimeConfig.test.js`
- Create: `server/test/aiRuntimeSafety.test.js`

**Interfaces:**
- Produces: `getActiveAiRuntime() -> { status, version, configData, killSwitch }`.
- Produces: `evaluateKeywordSafety(text, safety) -> { blocked, keyword? }`.
- Produces: `buildAllowedContext(input, policy) -> masked bounded object`.
- Produces: `executeAiRequest({ feature, user, isTest, inputText, context, operation })`.
- Produces: `runAiConfigTest({ source, feature, message, context }, actor)`.
- Produces: `setAiKillSwitch({ enabled, reason }, actor)` and `invalidateAiRuntimeCache()`.
- Produces: `getOverview({ from, to })` and `getLogs(filters)`.

- [ ] **Step 1: Write failing runtime tests**

```js
// server/test/aiRuntimeSafety.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { evaluateKeywordSafety } from "../src/services/ai/runtime/aiKeywordSafety.js";
import { buildAllowedContext } from "../src/services/ai/runtime/aiContextPolicy.js";

test("keyword safety checks normalized exact and substring matches without regex", () => {
  assert.equal(
    evaluateKeywordSafety("  nội dung TỪ CẤM ở đây ", {
      blockedKeywords: ["từ cấm"],
      matchMode: "substring",
      diacriticInsensitive: false,
    }).blocked,
    true,
  );
  assert.equal(
    evaluateKeywordSafety("không liên quan", {
      blockedKeywords: ["(a+)+$"],
      matchMode: "exact",
      diacriticInsensitive: false,
    }).blocked,
    false,
  );
});

test("context allowlist drops PII and exact coordinates", () => {
  assert.deepEqual(
    buildAllowedContext(
      { currentCity: "Cần Thơ", email: "private@example.com", currentCoords: { latitude: 10, longitude: 105 } },
      { enabledSources: ["coarseLocation"], fieldAllowlist: ["currentCity"], maxTokens: 500 },
    ),
    { currentCity: "Cần Thơ" },
  );
});
```

- [ ] **Step 2: Run RED**

```powershell
cd server
node --test test/aiRuntimeSafety.test.js test/aiRuntimeConfig.test.js
```

Expected: FAIL because runtime modules do not exist.

- [ ] **Step 3: Implement pure safety and context guards**

```js
export function evaluateKeywordSafety(text, safety) {
  const normalizedText = normalizeKeyword(text, safety.diacriticInsensitive);
  const keyword = safety.blockedKeywords
    .map((value) => normalizeKeyword(value, safety.diacriticInsensitive))
    .find((value) =>
      safety.matchMode === "exact"
        ? normalizedText === value
        : normalizedText.includes(value),
    );
  return { blocked: Boolean(keyword), keyword: keyword || null };
}

const CONTEXT_FIELDS = new Set([
  "currentCity", "budget", "partySize", "tripDuration",
  "transportPreference", "travelPreferences", "places",
  "events", "timeOfDay", "weather", "openingStatus", "messages",
]);

export function buildAllowedContext(input, policy) {
  const allowed = new Set(policy.fieldAllowlist.filter((field) => CONTEXT_FIELDS.has(field)));
  const filtered = Object.fromEntries(
    Object.entries(input || {}).filter(([key, value]) => allowed.has(key) && value != null),
  );
  const maxChars = policy.maxTokens * 4;
  const result = {};
  for (const [key, value] of Object.entries(filtered)) {
    const candidate = { ...result, [key]: value };
    if (JSON.stringify(candidate).length <= maxChars) result[key] = value;
  }
  return result;
}

export function isFreshContextSource(fetchedAt, freshnessTtl, now = Date.now()) {
  const timestamp = new Date(fetchedAt).getTime();
  return Number.isFinite(timestamp) && now - timestamp <= freshnessTtl * 1000;
}
```

- [ ] **Step 4: Implement runtime loading and kill switch**

Use `SystemConfig` key `ai_kill_switch` with value `{ enabled, message, updatedAt }`. Cache only the active validated snapshot for 30 seconds and expose `invalidateAiRuntimeCache()` for local publish/rollback invalidation.

```js
export async function getActiveAiRuntime() {
  const killSwitch = await getKillSwitch();
  if (killSwitch.enabled) {
    return { status: "disabled", version: null, configData: null, killSwitch };
  }
  const active = await loadActiveVersion();
  if (!active) {
    return { status: "maintenance", version: null, configData: null, killSwitch };
  }
  return {
    status: "active",
    version: active.version,
    configData: aiConfigDataSchema.parse(active.configData),
    killSwitch,
  };
}
```

- [ ] **Step 5: Implement request reservation and metadata-only completion**

`executeAiRequest` must:

1. Resolve active config.
2. Enforce kill switch.
3. HMAC `user.userId` with the existing `FIELD_ENCRYPTION_KEY` and domain prefix `ai-log:` to `anonymousUserRef`; never store the source ID.
4. Count/reserve the daily quota using the existing Redis client when ready, otherwise count today's production rows before creating a `started` row.
5. Check input safety.
6. Execute the supplied operation.
7. Check output safety.
8. Update tokens, latency, status, and stable error code.
9. Never receive or persist raw prompts/responses in the log service.

Use a 90-day `expiresAt`. Test rows bypass production quota and use `isTest=true`.

The current project has no consumer Premium membership source; therefore all Mobile users resolve to the free quota in phase one. Keep `premiumDailyRequests` in the snapshot for forward compatibility, but do not infer Premium from business subscriptions or Admin roles. Activating Premium quota later requires an explicit, trusted user-tier source.
After a log write, call `pruneExpiredAiLogs()` at most once per process hour; the function deletes rows where `expiresAt < now`. This bounded lazy cleanup avoids a new scheduler or job table while enforcing retention during normal traffic.

`runAiConfigTest` selects the draft or published snapshot, applies the same context and safety guards, resolves the write-only secret, executes the reviewed Groq adapter with `isTest=true`, and returns only redacted rendered prompt/context plus provider result metadata.

`setAiKillSwitch` upserts `SystemConfig` key `ai_kill_switch` with `{ enabled, message, updatedAt }`, records the actor through `updatedBy`, and invalidates the local runtime cache.

- [ ] **Step 6: Implement aggregate overview and paginated logs**

Overview returns:

```js
{
  runtime: { status, provider, model, version },
  totals: { requests, inputTokens, outputTokens, successRate, safetyBlocks, negativeFeedback },
  latency: { averageMs, p95Ms },
  timeline: [{ bucket, requests, errors, inputTokens, outputTokens }],
}
```

Logs return:

```js
{
  items: [{ requestId, feature, provider, model, configVersion, inputTokens, outputTokens, latencyMs, status, errorCode, safetyBlocked, feedback, createdAt }],
  pagination: { page, limit, total, totalPages },
}
```

- [ ] **Step 7: Run GREEN**

```powershell
cd server
node --test test/aiRuntimeSafety.test.js test/aiRuntimeConfig.test.js
```

Expected: runtime, safety, context, and metadata contracts pass.

- [ ] **Step 8: Commit**

```powershell
git add server/src/services/adminAi/aiLog.service.js server/src/services/adminAi/aiOverview.service.js server/src/services/ai/runtime server/test/aiRuntimeConfig.test.js server/test/aiRuntimeSafety.test.js
git commit -m "feat: add lean AI runtime guards and observability"
```

---

### Task 5: Expose Exactly Eight Admin Endpoints

**Files:**
- Create: `server/src/controllers/adminAi/adminAi.controller.js`
- Create: `server/src/controllers/adminAi/index.js`
- Create: `server/src/routes/adminAi/adminAi.route.js`
- Create: `server/src/routes/adminAi/index.js`
- Create: `server/test/adminAiRoute.contract.test.js`
- Modify: `server/src/routes/index.js`

**Interfaces:**
- Consumes: Tasks 2–4 services and schemas.
- Produces: exactly eight routes mounted at `/api/v1/admin/ai`.
- Enforces: endpoint-specific `hasPermission`.

- [ ] **Step 1: Write the failing route contract**

```js
// server/test/adminAiRoute.contract.test.js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { authenticate } from "../src/middlewares/authMiddleware.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";

const expected = new Set([
  "get /overview",
  "get /config",
  "put /config/draft",
  "post /config/test",
  "post /config/publish",
  "post /config/rollback",
  "put /kill-switch",
  "get /logs",
]);

test("Admin AI exposes exactly the approved route surface", () => {
  assert.equal(adminAiRouter.stack[0].handle, authenticate);
  const actual = new Set(
    adminAiRouter.stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route.methods).map((method) => `${method} ${layer.route.path}`),
      ),
  );
  assert.deepEqual(actual, expected);
});

test("every route has permission middleware before its controller", () => {
  for (const layer of adminAiRouter.stack.filter((entry) => entry.route)) {
    assert.equal(layer.route.stack.length >= 2, true);
    assert.notEqual(layer.route.stack[0].handle, layer.route.stack.at(-1).handle);
  }
  const source = readFileSync(
    new URL("../src/routes/adminAi/adminAi.route.js", import.meta.url),
    "utf8",
  );
  for (const permission of [
    "ai.view",
    "ai.config.manage",
    "ai.test.run",
    "ai.config.publish",
    "ai.kill_switch.manage",
    "ai.logs.view",
  ]) {
    assert.equal(source.includes(`hasPermission("${permission}")`), true);
  }
});
```

- [ ] **Step 2: Run RED**

```powershell
cd server
node --test test/adminAiRoute.contract.test.js
```

Expected: FAIL because the router does not exist.

- [ ] **Step 3: Implement the exact router**

```js
router.use(authenticate);
router.get("/overview", hasPermission("ai.view"), controller.getOverview);
router.get("/config", hasPermission("ai.view"), controller.getConfig);
router.put("/config/draft", hasPermission("ai.config.manage"), validateBody(aiDraftUpdateSchema), controller.saveDraft);
router.post("/config/test", hasPermission("ai.test.run"), validateBody(aiTestRequestSchema), controller.testConfig);
router.post("/config/publish", hasPermission("ai.config.publish"), validateBody(aiPublishSchema), controller.publishConfig);
router.post("/config/rollback", hasPermission("ai.config.publish"), validateBody(aiRollbackSchema), controller.rollbackConfig);
router.put("/kill-switch", hasPermission("ai.kill_switch.manage"), validateBody(aiKillSwitchSchema), controller.updateKillSwitch);
router.get("/logs", hasPermission("ai.logs.view"), controller.getLogs);
```

`saveDraft` must additionally reject `providerSecret` unless `req.userPermissions` contains `ai.secrets.manage` or the user is Super Admin.

- [ ] **Step 4: Implement thin controllers and audit reasons**

Each controller:

- Uses `req.user.userId`.
- Returns `{ success, data, message }`.
- Maps service errors through the shared error handler.
- Calls `createAuditLog` after successful draft, publish, rollback, secret replacement, or kill-switch mutation.
- Redacts `providerSecret`, prompt bodies, blocked keyword lists, and provider responses from `oldData`/`newData`.
- Calls `invalidateAiRuntimeCache()` after publish, rollback, or kill-switch updates.

- [ ] **Step 5: Mount the router once**

```js
import adminAiRoutes from "./adminAi/adminAi.route.js";
// inside registerApiRoutes
app.use("/api/v1/admin/ai", adminAiRoutes);
```

- [ ] **Step 6: Run route and permission tests**

```powershell
cd server
node --test test/adminAiRoute.contract.test.js test/aiRouteSecurity.test.js
```

Expected: both tests pass and the existing Mobile AI routes remain unchanged.

- [ ] **Step 7: Commit**

```powershell
git add server/src/controllers/adminAi server/src/routes/adminAi server/src/routes/index.js server/test/adminAiRoute.contract.test.js
git commit -m "feat: expose lean admin AI API"
```

---

### Task 6: Make Chat, Planner, and Voice Consume Published Runtime Configuration

**Files:**
- Create: `server/test/aiRuntimeIntegration.test.js`
- Modify: `server/src/services/ai/groq.service.js`
- Modify: `server/src/services/ai/aiStreaming.service.js`
- Modify: `server/src/services/ai/itinerary.service.js`
- Modify: `server/src/services/ai/hybridPlanner.service.js`
- Modify: `server/src/services/ai/groqSpeech.service.js`
- Modify: `server/src/lib/promptBuilder.js`
- Modify: `server/src/controllers/ai/ai.controller.js`
- Modify: `server/src/controllers/ai/groqChat.controller.js`
- Modify: `server/src/controllers/ai/hybridPlanner.controller.js`
- Modify: `server/src/services/trip/tripAiPlanner.service.js`
- Modify: `server/src/controllers/feedback/feedback.controller.js`
- Modify: `server/src/services/app/app.service.js`
- Modify: `app/src/modules/ai/hooks/useGroqChat.js`
- Modify: `app/src/modules/ai/components/genie/AIPlannerMessageItem.jsx`
- Modify: `app/src/modules/feedback/api/feedbackApi.js`
- Create: `app/src/modules/ai/lib/aiFeedback.test.js`

**Interfaces:**
- Consumes: `executeAiRequest` and `getActiveAiRuntime`.
- Changes: `createGroqClient({ apiKey, baseUrl })`.
- Changes: provider calls receive `{ model, temperature, topP, maxTokens, timeoutMs }`.
- Replaces: new writes to `AiPromptHistory` with `AiRequestLog` lifecycle.
- Produces: additive `requestLogId` in AI responses and thumbs feedback through the existing `/api/feedback` route.

- [ ] **Step 1: Write failing integration contracts**

```js
// server/test/aiRuntimeIntegration.test.js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const files = [
  "groq.service.js",
  "aiStreaming.service.js",
  "itinerary.service.js",
  "hybridPlanner.service.js",
  "groqSpeech.service.js",
];

test("provider services no longer own hard-coded Groq runtime configuration", () => {
  for (const file of files) {
    const source = readFileSync(new URL(`../src/services/ai/${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /process\.env\.GROQ_API_KEY/);
    assert.match(source, /runtime|providerOptions|modelParameters/);
  }
});

test("trip AI stops writing AiPromptHistory", () => {
  const source = readFileSync(
    new URL("../src/services/trip/tripAiPlanner.service.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /aiPromptHistory\.create/);
});
```

- [ ] **Step 2: Run RED**

```powershell
cd server
node --test test/aiRuntimeIntegration.test.js
```

Expected: FAIL on environment-owned Groq configuration and `AiPromptHistory`.

- [ ] **Step 3: Refactor provider factories without changing output contracts**

```js
export function createGroqClient({ apiKey, baseUrl = "https://api.groq.com" }) {
  if (!apiKey) {
    throw Object.assign(new Error("Groq credential is unavailable."), {
      code: "AI_SECRET_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return new Groq({ apiKey, baseURL: baseUrl });
}
```

Every completion uses the published model parameters. Planner may cap temperature at `0.3` to preserve structured output:

```js
temperature: Math.min(modelParameters.temperature, 0.3),
top_p: modelParameters.topP,
max_tokens: modelParameters.maxTokens,
```

- [ ] **Step 4: Render published prompts while preserving trusted data appendices**

Keep the existing trusted place/output instructions in code. Treat Admin prompts as persona/task instructions, not as a replacement for server safety and output contracts.

```js
export function buildChatSystemPrompt(context = {}, configuredPrompt) {
  const parts = [configuredPrompt];
  // append only server-built, allowed context and authoritative place instructions
  return parts.join("\n");
}
```

Planner and Voice use `prompts.planner` and `prompts.voice`. Unknown prompt variables fail before provider execution.

- [ ] **Step 5: Wrap all Mobile provider calls**

Controllers pass the authenticated actor, feature, final user input, and allowed context into `executeAiRequest`. Preserve existing response payloads and stable error codes. When disabled or unavailable, use the existing fallback paths.

- [ ] **Step 6: Cut over itinerary logging**

Delete the `prisma.aiPromptHistory.create` block in `tripAiPlanner.service.js`. The shared runtime wrapper writes the metadata-only row. Do not drop the old table in phase one.

- [ ] **Step 7: Connect Mobile thumbs feedback without a new Admin route**

Return the numeric `AiRequestLog.id` as additive `requestLogId` metadata from Chat, Planner, and Voice responses. Preserve it on assistant messages. Add accessible thumbs-up/down buttons only for completed AI messages.

Submit through the existing feedback API:

```js
submitFeedbackApi({
  reportType: "ai_quality",
  title: value === "up" ? "AI helpful" : "AI not helpful",
  content: reason || value,
  targetType: "ai_request",
  targetId: requestLogId,
});
```

When `targetType === "ai_request"`, `appService.submitFeedback` verifies that the referenced log exists and updates only `feedback` and `feedbackReason` before creating the existing `FeedbackReport`. It never copies prompt/response content into the report.

- [ ] **Step 8: Run all AI server and focused Mobile tests**

```powershell
cd server
node --test test/aiOutputGuard.test.js test/aiProviderPolicy.test.js test/aiRequestContract.test.js test/aiRouteSecurity.test.js test/aiStreaming.test.js test/hybridPlannerFallback.test.js test/itineraryFallback.test.js test/tripAiPlannerSecurity.test.js test/aiRuntimeIntegration.test.js test/aiRuntimeConfig.test.js test/aiRuntimeSafety.test.js
cd ../app
npm test -- src/modules/ai/lib/aiFeedback.test.js
```

Expected: all AI tests pass.

- [ ] **Step 9: Commit**

```powershell
git add server/src/services/ai server/src/controllers/ai server/src/lib/promptBuilder.js server/src/services/trip/tripAiPlanner.service.js server/src/controllers/feedback/feedback.controller.js server/src/services/app/app.service.js server/test/aiRuntimeIntegration.test.js app/src/modules/ai app/src/modules/feedback/api/feedbackApi.js
git commit -m "feat: apply published AI runtime to mobile"
```

---

### Task 7: Add the Web API Layer, Route, Permissions, and Test Harness

**Files:**
- Create: `web/src/apis/adminAiService.js`
- Create: `web/src/hooks/queries/useAdminAiQueries.js`
- Create: `web/src/pages/admin/ai/adminAiForm.js`
- Create: `web/src/pages/admin/ai/adminAiForm.test.js`
- Create: `web/src/test/setup.js`
- Create: `web/vitest.config.js`
- Modify: `web/package.json`
- Modify: `web/src/constants/routes.js`
- Modify: `web/src/constants/permissions.js`
- Modify: `web/src/routes.jsx`
- Modify: `web/src/layouts/sidebar/menuData.js`

**Interfaces:**
- Produces: `adminAiService` methods matching the eight API routes.
- Produces: React Query hooks `useAdminAiOverview`, `useAdminAiConfig`, `useSaveAiDraft`, `useTestAiConfig`, `usePublishAiConfig`, `useRollbackAiConfig`, `useUpdateAiKillSwitch`, and `useAdminAiLogs`.
- Produces: `toAiConfigForm(apiData)` and `toAiDraftPayload(form, revision, reason)`.

- [ ] **Step 1: Add Vitest and write failing pure-form tests**

```js
// web/src/pages/admin/ai/adminAiForm.test.js
import { describe, expect, it } from "vitest";
import { toAiConfigForm, toAiDraftPayload } from "./adminAiForm";

describe("Admin AI form mapping", () => {
  it("never maps a provider secret from a read response", () => {
    const form = toAiConfigForm({
      revision: 3,
      draft: { configData: { provider: { adapter: "groq", model: "llama" } } },
      credential: { configured: true, suffix: "1234" },
    });
    expect(form.providerSecret).toBe("");
    expect(form.credentialSuffix).toBe("1234");
  });

  it("includes a new secret only when the admin entered one", () => {
    const payload = toAiDraftPayload(
      { configData: { provider: { adapter: "groq" } }, providerSecret: "" },
      3,
      "Cập nhật prompt",
    );
    expect(payload).not.toHaveProperty("providerSecret");
  });
});
```

Add:

```json
"test": "vitest run"
```

Configure `jsdom`, alias `@`, and `web/src/test/setup.js`:

```js
// web/src/test/setup.js
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 2: Run RED**

```powershell
cd web
npm test -- src/pages/admin/ai/adminAiForm.test.js
```

Expected: FAIL because the form adapter does not exist.

- [ ] **Step 3: Implement API and query modules**

```js
const BASE = "/v1/admin/ai";
export const adminAiService = {
  getOverview: () => api.get(`${BASE}/overview`),
  getConfig: () => api.get(`${BASE}/config`),
  saveDraft: (payload) => api.put(`${BASE}/config/draft`, payload),
  testConfig: (payload) => api.post(`${BASE}/config/test`, payload),
  publishConfig: (payload) => api.post(`${BASE}/config/publish`, payload),
  rollbackConfig: (payload) => api.post(`${BASE}/config/rollback`, payload),
  updateKillSwitch: (payload) => api.put(`${BASE}/kill-switch`, payload),
  getLogs: (params) => api.get(`${BASE}/logs`, { params }),
};
```

React Query mutations invalidate `["admin-ai", "overview"]`, `["admin-ai", "config"]`, and `["admin-ai", "logs"]` only when relevant.

- [ ] **Step 4: Register permissions and route**

Add:

```js
AI: {
  VIEW: "ai.view",
  CONFIG_MANAGE: "ai.config.manage",
  CONFIG_PUBLISH: "ai.config.publish",
  SECRETS_MANAGE: "ai.secrets.manage",
  LOGS_VIEW: "ai.logs.view",
  TEST_RUN: "ai.test.run",
  KILL_SWITCH_MANAGE: "ai.kill_switch.manage",
},
```

Add `ADMIN_ROUTES.AI = "/admin/ai"`, lazy-load `AdminAiPage`, protect it with `adminRoles`, and add one sidebar item guarded by `PERMISSIONS.AI.VIEW`. AI route and menu role lists contain only `SUPER_ADMIN` and `ADMIN`.

- [ ] **Step 5: Run tests, lint focused files, and build**

```powershell
cd web
npm test -- src/pages/admin/ai/adminAiForm.test.js
npx eslint src/apis/adminAiService.js src/hooks/queries/useAdminAiQueries.js src/pages/admin/ai/adminAiForm.js src/pages/admin/ai/adminAiForm.test.js src/constants/routes.js src/constants/permissions.js src/routes.jsx src/layouts/sidebar/menuData.js
npm run build
```

Expected: form tests pass, focused lint passes, and Vite build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add web/package.json web/vitest.config.js web/src/test web/src/apis/adminAiService.js web/src/hooks/queries/useAdminAiQueries.js web/src/pages/admin/ai/adminAiForm.js web/src/pages/admin/ai/adminAiForm.test.js web/src/constants/routes.js web/src/constants/permissions.js web/src/routes.jsx web/src/layouts/sidebar/menuData.js
git commit -m "feat: wire admin AI web contracts"
```

---

### Task 8: Build the Operations Cockpit, Overview, and Logs

**Files:**
- Create: `web/src/pages/admin/ai/AdminAiPage.jsx`
- Create: `web/src/pages/admin/ai/AdminAiPage.test.jsx`
- Create: `web/src/pages/admin/ai/components/AiStatusHeader.jsx`
- Create: `web/src/pages/admin/ai/components/AiOverviewPanel.jsx`
- Create: `web/src/pages/admin/ai/components/AiLogsPanel.jsx`
- Create: `web/src/pages/admin/ai/components/AiMetricCard.jsx`
- Create: `web/src/pages/admin/ai/components/AiEmptyState.jsx`

**Interfaces:**
- Consumes: Task 7 query hooks.
- Produces: five permission-aware tabs with Overview default.
- Enforces: metadata-only logs and no raw conversation viewer.

- [ ] **Step 1: Write failing page behavior tests**

```jsx
// AdminAiPage.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminAiPage from "./AdminAiPage";

vi.mock("@/hooks/queries/useAdminAiQueries", () => ({
  useAdminAiOverview: () => ({
    data: {
      runtime: { status: "active", provider: "Groq", model: "llama", version: 4 },
      totals: { requests: 20, inputTokens: 100, outputTokens: 60, successRate: 95, safetyBlocks: 1, negativeFeedback: 2 },
      latency: { averageMs: 900, p95Ms: 1500 },
      timeline: [],
    },
    isLoading: false,
  }),
  useAdminAiConfig: () => ({ data: null, isLoading: false }),
  useAdminAiLogs: () => ({ data: { items: [], pagination: { page: 1, total: 0 } }, isLoading: false }),
}));

describe("AdminAiPage", () => {
  it("shows operational state and the five approved sections", () => {
    render(<AdminAiPage />);
    expect(screen.getByText("AI đang hoạt động")).toBeInTheDocument();
    for (const label of ["Tổng quan", "Cấu hình", "An toàn", "Logs & Feedback", "Test Lab"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run RED**

```powershell
cd web
npm test -- src/pages/admin/ai/AdminAiPage.test.jsx
```

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Build the shared status header and overview**

Use existing `Card`, `Badge`, `Skeleton`, `Tabs`, and chart components. Display:

- Status with icon and text.
- Provider/model/version.
- Requests, token totals, success rate, average/P95 latency, safety blocks, and negative feedback.
- Timeline chart only when real buckets exist.
- Isolated error/empty state per panel.

Do not use purple-blue gradients, decorative AI art, glass effects, or GSAP.

- [ ] **Step 4: Build metadata-only logs**

Add server-pagination controls and filters for date, feature, status, safety, and feedback. Columns are:

```js
["Thời gian", "Tính năng", "Provider / Model", "Token", "Latency", "Trạng thái", "Safety", "Feedback"]
```

No prompt, response, exact location, email, phone, or internal user ID column exists.

- [ ] **Step 5: Run page tests, accessibility assertions, lint, and build**

```powershell
cd web
npm test -- src/pages/admin/ai/AdminAiPage.test.jsx
npx eslint src/pages/admin/ai
npm run build
```

Expected: page tests and build pass; status is not communicated by color alone.

- [ ] **Step 6: Commit**

```powershell
git add web/src/pages/admin/ai
git commit -m "feat: add admin AI operations overview"
```

---

### Task 9: Build Configuration, Safety, Test Lab, and Guarded Mutations

**Files:**
- Create: `web/src/pages/admin/ai/components/AiConfigurationPanel.jsx`
- Create: `web/src/pages/admin/ai/components/AiSafetyPanel.jsx`
- Create: `web/src/pages/admin/ai/components/AiTestLabPanel.jsx`
- Create: `web/src/pages/admin/ai/components/AiPublishDialog.jsx`
- Create: `web/src/pages/admin/ai/components/AiRollbackDialog.jsx`
- Create: `web/src/pages/admin/ai/components/AiKillSwitchDialog.jsx`
- Create: `web/src/pages/admin/ai/components/AiConfigurationPanel.test.jsx`
- Modify: `web/src/pages/admin/ai/AdminAiPage.jsx`

**Interfaces:**
- Consumes: Task 7 mutations and form adapters.
- Produces: Save Draft, Test Draft, Publish, Rollback, and Kill Switch flows.
- Enforces: blank secret input on every load and explicit reasons for dangerous mutations.

- [ ] **Step 1: Write failing mutation UX tests**

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AiConfigurationPanel from "./AiConfigurationPanel";

describe("AiConfigurationPanel", () => {
  it("keeps the credential write-only and separates draft from publish", async () => {
    const saveDraft = vi.fn();
    const validConfig = {
      provider: { adapter: "groq", baseUrl: "https://api.groq.com", model: "llama", secretReference: "groq-primary" },
      modelParameters: { temperature: 0.3, topP: 0.9, maxTokens: 2000, timeoutMs: 15000 },
      prompts: { chat: "chat", planner: "planner", voice: "voice" },
      context: { enabledSources: [], fieldAllowlist: [], maxTokens: 1000, freshnessTtl: 300 },
      safety: { blockedKeywords: [], matchMode: "substring", diacriticInsensitive: false, safeResponse: "Không thể xử lý." },
      quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
      fallback: { maintenanceMessage: "AI đang bảo trì.", staticPlannerEnabled: true },
    };
    render(
      <AiConfigurationPanel
        config={{
          revision: 4,
          credential: { configured: true, suffix: "1234" },
          draft: { configData: validConfig },
        }}
        permissions={{ manage: true, publish: false, secrets: true }}
        onSaveDraft={saveDraft}
      />,
    );
    expect(screen.getByLabelText("API key mới")).toHaveValue("");
    expect(screen.getByText(/kết thúc bằng 1234/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phát hành" })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Lý do thay đổi"), "Điều chỉnh prompt");
    await userEvent.click(screen.getByRole("button", { name: "Lưu draft" }));
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run RED**

```powershell
cd web
npm test -- src/pages/admin/ai/components/AiConfigurationPanel.test.jsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement Configuration sections**

Use controlled form sections for:

- Groq base URL, model, and secret rotation.
- Temperature, Top P, Max Tokens, timeout.
- Chat, Planner, and Voice prompts.
- Registered context source switches, field allowlist, token budget, and TTL.
- Free/Premium daily request limits.
- Maintenance message and static planner fallback.

Keep a sticky action bar. Disable Save Draft until a five-character reason exists and form validation passes.

- [ ] **Step 4: Implement Safety without regex**

Support exact/substr mode, optional diacritic-insensitive matching, keyword chips/table, safe response, and client-side CSV import/export. Reject empty, duplicate normalized, over-120-character, and over-500-entry lists before mutation.

Never render a regex option.

- [ ] **Step 5: Implement Test Lab**

Inputs: source, feature, message, and optional bounded context. Results show:

- Masked context preview.
- Redacted rendered prompt.
- Provider/model/version.
- Reply or structured result.
- Input/output tokens.
- Latency.
- Safety result.
- Validation error.

Do not cache a Test Lab response in production UI state.

- [ ] **Step 6: Implement guarded dialogs**

- Publish and rollback require a reason and show current/target versions.
- Kill switch requires reason plus typed text `TAT AI`.
- Secret replacement requires `ai.secrets.manage`.
- A 409 conflict shows the newer revision and offers Reload; it never auto-retries a mutation.

- [ ] **Step 7: Run focused tests, lint, and build**

```powershell
cd web
npm test -- src/pages/admin/ai
npx eslint src/pages/admin/ai
npm run build
```

Expected: all Admin AI tests and Vite build pass.

- [ ] **Step 8: Commit**

```powershell
git add web/src/pages/admin/ai
git commit -m "feat: add admin AI configuration workflows"
```

---

### Task 10: Verify Cutover, Security, Migration, and Scope

**Files:**
- Create: `server/test/adminAiSecurity.test.js`
- Create: `server/test/adminAiScope.contract.test.js`
- Modify: `server/test/aiProviderPolicy.test.js`
- Modify: `server/test/aiRouteSecurity.test.js`
- Modify: `docs/superpowers/specs/2026-07-24-admin-ai-control-center-design.md` only if implementation discoveries require a factual clarification

**Interfaces:**
- Verifies: three models, eight routes, seven permissions, two Admin roles only, secret redaction, metadata-only logs, no regex, and Mobile fallback behavior.

- [ ] **Step 1: Add scope and security contracts**

```js
// server/test/adminAiScope.contract.test.js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";

test("scope remains lean", () => {
  const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
  const approved = ["AiConfig", "AiConfigVersion", "AiRequestLog"];
  const aiModels = [...schema.matchAll(/model (Ai[A-Za-z0-9]+) \{/g)]
    .map((match) => match[1])
    .filter((name) => !["AiPromptHistory"].includes(name));
  assert.deepEqual(aiModels.sort(), approved.sort());
  assert.equal(adminAiRouter.stack.filter((layer) => layer.route).length, 8);
});
```

```js
// server/test/adminAiSecurity.test.js
import assert from "node:assert/strict";
import test from "node:test";
import { redactAdminAiAuditData } from "../src/services/adminAi/aiConfig.service.js";

test("audit data excludes secrets and sensitive prompt/rule content", () => {
  const redacted = redactAdminAiAuditData({
    providerSecret: "gsk_private",
    configData: {
      prompts: { chat: "private prompt" },
      safety: { blockedKeywords: ["private keyword"] },
      provider: { model: "llama" },
    },
  });
  assert.equal(JSON.stringify(redacted).includes("gsk_private"), false);
  assert.equal(JSON.stringify(redacted).includes("private prompt"), false);
  assert.equal(JSON.stringify(redacted).includes("private keyword"), false);
  assert.equal(redacted.configData.provider.model, "llama");
});
```

- [ ] **Step 2: Run the complete server gate**

```powershell
cd server
npx prisma format --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npm run migrate:verify
node --test test/*.test.js
```

Expected: schema/migration verification and all tracked server tests pass. If unrelated ignored local tests exist, record them separately; do not weaken the tracked gate.

- [ ] **Step 3: Run the complete web gate**

```powershell
cd web
npm test
npm run lint
npm run build
```

Expected: all Web tests, ESLint, and production build pass.

- [ ] **Step 4: Run Mobile regression tests**

```powershell
cd app
npm test
```

Expected: all Mobile tests pass and the existing AI response contracts remain unchanged.

- [ ] **Step 5: Verify migration against an isolated database**

With a disposable PostgreSQL database:

```powershell
cd server
npm run migrate:deploy
npm run generate
npm run migrate:verify
```

Expected: migration deploys once, Prisma Client generates, and migration history is consistent. Confirm only `ai_configs`, `ai_config_versions`, and `ai_request_logs` were added.

- [ ] **Step 6: Manual security and failure-path smoke test**

Verify:

1. Admin without `ai.config.publish` receives 403 from direct publish API calls.
2. Config GET never contains the API key.
3. Invalid/private provider URL is rejected.
4. Draft changes do not change Mobile behavior.
5. Published changes do change Chat/Planner/Voice behavior.
6. Input/output keyword blocks return stable safe errors.
7. Test Lab requests do not appear in production totals.
8. Kill switch activates the Mobile fallback.
9. Rollback restores the chosen snapshot as a new version.
10. A stale revision returns 409 without overwriting.

- [ ] **Step 7: Commit final verification additions**

```powershell
git add server/test/adminAiSecurity.test.js server/test/adminAiScope.contract.test.js server/test/aiProviderPolicy.test.js server/test/aiRouteSecurity.test.js
git commit -m "test: verify lean admin AI control center"
```

---

## Final Definition of Done

- The migration adds exactly three Prisma models and passes migration verification.
- The Admin router exposes exactly eight routes under `/api/v1/admin/ai`.
- Only Super Admin and explicitly permitted Admin accounts can access the module.
- Provider keys are encrypted with the existing field-encryption utility and never returned.
- Draft, Test, Publish, Rollback, and Kill Switch work with audit reasons.
- Mobile Chat, Planner, and Voice consume only the active published snapshot.
- Input and output exact/substr safety work without dynamic regular expressions.
- Logs are metadata-only and Test Lab data is excluded from production metrics.
- All server, Web, and Mobile regression gates pass.
- The user's unrelated dirty files remain untouched.
