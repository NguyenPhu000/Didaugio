if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret-key-12345678901234567890";
if (!process.env.FIELD_ENCRYPTION_KEY) process.env.FIELD_ENCRYPTION_KEY = "12345678901234567890123456789012";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { Router } from "express";
import { DEFAULT_AI_CONFIG } from "../src/config/defaultAiConfig.js";
import {
  aiConfigDataSchema,
} from "../src/models/schemas/adminAi/adminAi.schema.js";
import adminAiRouter from "../src/routes/adminAi/adminAi.route.js";
import { registerApiRoutes } from "../src/routes/index.js";
import {
  evaluateKeywordSafety,
} from "../src/services/ai/runtime/aiKeywordSafety.js";

const schema = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);
const migrationsUrl = new URL("../prisma/migrations/", import.meta.url);
const migrationSources = readdirSync(migrationsUrl, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((entry) => ({
    name: entry.name,
    sql: readFileSync(
      new URL(`${entry.name}/migration.sql`, migrationsUrl),
      "utf8",
    ),
  }));
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

function aiModelInventory(schemaSource) {
  return [...schemaSource.matchAll(
    /^model\s+([A-Za-z_][A-Za-z0-9_]*)\s+\{/gm,
  )]
    .map(([, model]) => model)
    .filter((model) => model.startsWith("Ai"))
    .sort();
}

function assertExactAiModels(schemaSource) {
  const allAiModels = aiModelInventory(schemaSource);
  const introducedModels = allAiModels
    .filter((model) => model !== "AiPromptHistory")
    .sort();

  assert.deepEqual(introducedModels, APPROVED_MODELS);
  assert.deepEqual(
    allAiModels,
    [...APPROVED_MODELS, "AiPromptHistory"].sort(),
    "an additional Ai* model must not be hidden by the legacy-model allowance",
  );
}

function routeInventory(router, ancestors = new Set()) {
  assert.equal(
    ancestors.has(router),
    false,
    "router nesting must not contain a cycle",
  );
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(router);
  const routes = [];

  for (const layer of router.stack ?? []) {
    if (layer.route) {
      const paths = Array.isArray(layer.route.path)
        ? layer.route.path
        : [layer.route.path];
      for (const path of paths) {
        for (const method of Object.keys(layer.route.methods)) {
          routes.push(`${method.toUpperCase()} ${path}`);
        }
      }
      continue;
    }
    if (Array.isArray(layer.handle?.stack)) {
      routes.push(...routeInventory(layer.handle, nextAncestors));
    }
  }
  return routes.sort();
}

function assertExactAdminAiRoutes(router) {
  const routes = routeInventory(router);
  assert.deepEqual(routes, APPROVED_ROUTES);
  assert.equal(routes.length, 8);
}

function aiPermissionInventory(sources) {
  const permissions = [];
  for (const { sql } of sources) {
    const inserts = sql.match(/INSERT\s+INTO\s+"permissions"[\s\S]*?;/gi) ?? [];
    for (const insert of inserts) {
      permissions.push(
        ...[...insert.matchAll(/'(ai\.[A-Za-z0-9_.-]+)'/g)]
          .map(([, permission]) => permission),
      );
    }
  }
  return [...new Set(permissions)].sort();
}

function aiRoleGrantInventory(sources) {
  return sources.flatMap(({ sql }) =>
    (sql.match(/INSERT\s+INTO\s+"role_permissions"[\s\S]*?;/gi) ?? [])
      .filter((grant) => /ai\.|p\.module\s*=\s*'ai'/i.test(grant))
      .map(normalizedSql),
  );
}

function assertExactAiPermissions(sources) {
  const permissions = aiPermissionInventory(sources);
  assert.deepEqual(permissions, APPROVED_PERMISSIONS);
  assert.equal(permissions.length, 7);

  const grants = aiRoleGrantInventory(sources);
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
}

function adminAiMountInventory(registerRoutes) {
  const uses = [];
  registerRoutes({
    use(...args) {
      uses.push(args);
    },
  });
  return uses
    .filter(([, ...handlers]) => handlers.includes(adminAiRouter))
    .map(([path]) => path);
}

function assertSingleAdminAiMount(registerRoutes) {
  assert.deepEqual(
    adminAiMountInventory(registerRoutes),
    ["/api/v1/admin/ai"],
  );
}

test("the schema contains exactly the three new AI models plus the legitimate legacy history", () => {
  assertExactAiModels(schema);
});

test("model inventory rejects legal underscore identifiers that the prior regex missed", () => {
  const mutated = `${schema}
model Ai_Extra {
  id Int @id
}`;

  assert.deepEqual(
    aiModelInventory(mutated).filter((model) => model === "Ai_Extra"),
    ["Ai_Extra"],
  );
  assert.throws(() => assertExactAiModels(mutated));
});

test("the recursively enumerated Admin AI router exposes exactly eight routes", () => {
  assertExactAdminAiRoutes(adminAiRouter);
});

test("route inventory rejects endpoints hidden in a mounted child router", () => {
  const child = Router();
  child.get("/extra", (_req, res) => res.sendStatus(204));
  const mutated = Router();
  mutated.use(adminAiRouter);
  mutated.use("/nested", child);

  assert.equal(routeInventory(mutated).includes("GET /extra"), true);
  assert.throws(() => assertExactAdminAiRoutes(mutated));
});

test("Admin AI has one top-level mount at the approved API path", () => {
  assertSingleAdminAiMount(registerApiRoutes);
});

test("top-level mount inventory rejects a second Admin AI mount", () => {
  const mutatedRegistration = (app) => {
    registerApiRoutes(app);
    app.use("/api/v1/admin/ai-shadow", adminAiRouter);
  };

  assert.throws(() => assertSingleAdminAiMount(mutatedRegistration));
});

test("all migrations seed exactly seven AI permissions for only approved roles", () => {
  assertExactAiPermissions(migrationSources);
});

test("permission inventory rejects a secondary AI insert in a later migration", () => {
  const mutatedSources = [
    ...migrationSources,
    {
      name: "99999999999999_mutation",
      sql: `
        INSERT INTO "permissions"
          ("name", "display_name", "module")
        VALUES ('ai.extra', 'Extra', 'ai')
        ON CONFLICT ("name") DO NOTHING;
      `,
    },
  ];

  assert.equal(aiPermissionInventory(mutatedSources).includes("ai.extra"), true);
  assert.throws(() => assertExactAiPermissions(mutatedSources));
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
