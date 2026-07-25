import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  aiConfigDataSchema,
} from "../src/models/schemas/adminAi/adminAi.schema.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";
import {
  evaluateKeywordSafety,
} from "../src/services/ai/runtime/aiKeywordSafety.js";

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
const routeSource = readFileSync(
  new URL("../src/routes/adminAi/adminAi.route.js", import.meta.url),
  "utf8",
);
const safetySources = [
  "../src/models/schemas/adminAi/adminAi.schema.js",
  "../src/services/ai/runtime/aiKeywordSafety.js",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

const APPROVED_MODELS = ["AiConfig", "AiConfigVersion", "AiRequestLog"];
const APPROVED_ROUTES = [
  "GET /config",
  "GET /logs",
  "GET /overview",
  "POST /config/publish",
  "POST /config/rollback",
  "POST /config/test",
  "PUT /config/draft",
  "PUT /kill-switch",
];
const APPROVED_PERMISSIONS = [
  "ai.config.manage",
  "ai.config.publish",
  "ai.kill_switch.manage",
  "ai.logs.view",
  "ai.secrets.manage",
  "ai.test.run",
  "ai.view",
];

function normalizedSql(value) {
  return value.replace(/\s+/g, " ").trim();
}

test("the schema contains exactly the three new AI models plus the legitimate legacy history", () => {
  const allAiModels = [...schema.matchAll(/^model\s+(Ai[A-Za-z0-9]+)\s+\{/gm)]
    .map(([, model]) => model)
    .sort();
  const introducedModels = allAiModels
    .filter((model) => model !== "AiPromptHistory")
    .sort();

  assert.deepEqual(introducedModels, APPROVED_MODELS);
  assert.deepEqual(
    allAiModels,
    [...APPROVED_MODELS, "AiPromptHistory"].sort(),
    "an additional Ai* model must not be hidden by the legacy-model allowance",
  );
});

test("the Admin AI router exposes exactly the eight approved method and path pairs", () => {
  const routes = adminAiRouter.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods).map(
        (method) => `${method.toUpperCase()} ${layer.route.path}`,
      ),
    )
    .sort();

  assert.deepEqual(routes, APPROVED_ROUTES);
  assert.equal(routes.length, 8);
  assert.match(routeSource, /router\.use\(authenticate\)/);
});

test("the migration seeds exactly seven AI permissions for only the approved role grants", () => {
  const permissionInsert = migration.match(
    /INSERT INTO "permissions"[\s\S]*?ON CONFLICT \("name"\) DO NOTHING;/,
  )?.[0];
  assert.ok(permissionInsert, "AI permission seed must exist");

  const permissions = [...permissionInsert.matchAll(/\('(ai\.[a-z_.]+)'/g)]
    .map(([, permission]) => permission)
    .sort();
  assert.deepEqual(permissions, APPROVED_PERMISSIONS);
  assert.equal(permissions.length, 7);

  const grants = [...migration.matchAll(
    /INSERT INTO "role_permissions"[\s\S]*?ON CONFLICT \("role_id", "permission_id"\) DO NOTHING;/g,
  )].map(([grant]) => normalizedSql(grant));
  assert.equal(grants.length, 2);
  assert.match(grants[0], /WHERE r\.name = 'super_admin' AND p\.module = 'ai'/);
  assert.match(grants[1], /WHERE r\.name = 'admin'/);
  assert.doesNotMatch(grants.join("\n"), /\bstaff\b/i);

  const explicitAdminPermissions = [...grants[1].matchAll(/'(ai\.[a-z_.]+)'/g)]
    .map(([, permission]) => permission)
    .sort();
  assert.deepEqual(explicitAdminPermissions, [
    "ai.config.manage",
    "ai.logs.view",
    "ai.test.run",
    "ai.view",
  ]);
});

test("Phase 1 safety accepts substring only and treats regex syntax as literal text", () => {
  const withMatchMode = (matchMode) => ({
    ...DEFAULT_AI_CONFIG,
    safety: {
      ...DEFAULT_AI_CONFIG.safety,
      blockedKeywords: ["(a+)+$", ".*"],
      matchMode,
    },
  });

  assert.equal(aiConfigDataSchema.safeParse(withMatchMode("substring")).success, true);
  assert.equal(aiConfigDataSchema.safeParse(withMatchMode("exact")).success, false);
  assert.equal(aiConfigDataSchema.safeParse(withMatchMode("regex")).success, false);

  assert.deepEqual(
    evaluateKeywordSafety("literal (a+)+$ marker", withMatchMode("substring").safety),
    { blocked: true, keyword: "(a+)+$" },
  );
  assert.deepEqual(
    evaluateKeywordSafety("aaaa and any text", withMatchMode("substring").safety),
    { blocked: false, keyword: null },
  );

  for (const source of safetySources) {
    assert.doesNotMatch(
      source,
      /\b(?:new\s+)?RegExp\s*\(/,
      "Admin-authored safety values must never reach a dynamic regular expression",
    );
  }
});
