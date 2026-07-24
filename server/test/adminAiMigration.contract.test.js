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
    assert.match(schema, new RegExp(`model ${model} \\{`));
  }
  for (const banned of [
    "AiProviderConfig",
    "AiPromptTemplate",
    "AiRule",
    "AiRuntimeRelease",
    "AiBackgroundJob",
  ]) {
    assert.doesNotMatch(schema, new RegExp(`model ${banned} \\{`));
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
