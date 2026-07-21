import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import * as migrationAudit from "../src/scripts/lib/migrationAudit.js";
import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildAuditDatabaseName,
  buildPrismaCommands,
  buildAdminDatabaseUrl,
  buildDatabaseUrl,
  quoteIdentifier,
  dropOwnedAuditDatabase,
  assertOnlyAllowedRawSqlDrift,
  redactDatabaseUrl,
  runMigrationAudit,
} from "../src/scripts/lib/migrationAudit.js";

const packageJson = JSON.parse(fs.readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
));
const migrationRunbookPath = new URL(
  "../docs/migration-integrity-runbook.md",
  import.meta.url,
);
const serverRoot = fileURLToPath(new URL("..", import.meta.url));

function spawnMigrationQualityGate(env) {
  const command = process.platform === "win32"
    ? {
        executable: process.env.ComSpec,
        args: ["/d", "/s", "/c", "npm.cmd run quality:migrations"],
      }
    : { executable: "npm", args: ["run", "quality:migrations"] };
  return spawnSync(command.executable, command.args, {
    cwd: serverRoot,
    env,
    encoding: "utf8",
    shell: false,
    timeout: 60_000,
  });
}

const verifyMigrationHistorySource = fs.readFileSync(
  new URL("../src/scripts/verifyMigrationHistory.js", import.meta.url),
  "utf8",
);
const reconciliationIntegrationSource = fs.readFileSync(
  new URL("./migrationReconciliation.integration.test.js", import.meta.url),
  "utf8",
);

test("migration audit uses deploy and emits a reviewable drift script", () => {
  const commands = buildPrismaCommands({
    schemaPath: "prisma/schema.prisma",
  });
  assert.deepEqual(commands.deploy, [
    "prisma",
    "migrate",
    "deploy",
    "--schema=prisma/schema.prisma",
  ]);
  assert.deepEqual(commands.diff.slice(0, 4), ["prisma", "migrate", "diff", "--script"]);
  assert.ok(commands.diff.includes("--from-schema-datasource"));
  assert.ok(commands.diff.includes("--to-schema-datamodel"));
  assert.ok(!commands.diff.some((arg) => arg.includes("postgresql://")));
});

test("migration audit cleans up only after this invocation creates the database", async () => {
  for (const failedStep of ["deploy", "diff"]) {
    const calls = [];
    const step = (name) => async () => {
      calls.push(name);
      if (name === failedStep) throw new Error(`${name} failed`);
      return name === "diff" ? "" : undefined;
    };
    await assert.rejects(
      runMigrationAudit({
        create: step("create"),
        deploy: step("deploy"),
        diff: step("diff"),
        cleanup: step("cleanup"),
      }),
      new RegExp(`${failedStep} failed`, "u"),
    );
    assert.equal(calls.at(-1), "cleanup");
  }

  const calls = [];
  await assert.rejects(
    runMigrationAudit({
      create: async () => {
        calls.push("create");
        throw new Error("create collision");
      },
      deploy: async () => calls.push("deploy"),
      diff: async () => calls.push("diff"),
      cleanup: async () => calls.push("cleanup"),
    }),
    /create collision/u,
  );
  assert.deepEqual(calls, ["create"]);
});

test("migration audit preserves primary and cleanup failures", async () => {
  const primaryFailure = new Error("deploy failed");
  const cleanupFailure = new Error("cleanup failed");

  await assert.rejects(
    runMigrationAudit({
      create: async () => undefined,
      deploy: async () => {
        throw primaryFailure;
      },
      diff: async () => "",
      cleanup: async () => {
        throw cleanupFailure;
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(error.errors, [primaryFailure, cleanupFailure]);
      return true;
    },
  );
});

test("migration audit preserves drift validation and cleanup failures in lifecycle order", async () => {
  let driftFailure;
  const cleanupFailure = new Error("cleanup failed after invalid drift");

  await assert.rejects(
    runMigrationAudit({
      create: async () => undefined,
      deploy: async () => undefined,
      diff: async () => 'DROP TABLE "unexpected_managed_table";',
      validate: (driftSql) => {
        try {
          return assertOnlyAllowedRawSqlDrift(driftSql);
        } catch (error) {
          driftFailure = error;
          throw error;
        }
      },
      cleanup: async () => {
        throw cleanupFailure;
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(driftFailure.message, /managed schema drift/iu);
      assert.deepEqual(error.errors, [driftFailure, cleanupFailure]);
      return true;
    },
  );
});

test("migration audit accepts only its dedicated database prefix", () => {
  assert.equal(
    assertSafeAuditDatabaseName(`${AUDIT_DB_PREFIX}clean_123`),
    `${AUDIT_DB_PREFIX}clean_123`,
  );
  for (const unsafe of ["didaugio", "postgres", "template1", "../didaugio", "audit-db"]) {
    assert.throws(() => assertSafeAuditDatabaseName(unsafe), /unsafe audit database name/i);
  }
  assert.throws(
    () => assertSafeAuditDatabaseName(`${AUDIT_DB_PREFIX}${"x".repeat(64)}`),
    /unsafe audit database name/i,
  );
});

test("audit database name builder preserves entropy before a bounded scenario suffix", () => {
  const first = buildAuditDatabaseName("Same very long scenario label ".repeat(20), {
    entropy: "0123456789abcdef0123456789abcdef",
  });
  const second = buildAuditDatabaseName("Same very long scenario label ".repeat(20), {
    entropy: "fedcba9876543210fedcba9876543210",
  });

  assert.ok(first.startsWith(`${AUDIT_DB_PREFIX}0123456789abcdef0123456789abcdef_`));
  assert.ok(second.startsWith(`${AUDIT_DB_PREFIX}fedcba9876543210fedcba9876543210_`));
  assert.notEqual(first, second);
  assert.ok(Buffer.byteLength(first, "ascii") <= 63);
  assert.ok(Buffer.byteLength(second, "ascii") <= 63);
  assert.equal(assertSafeAuditDatabaseName(first), first);
  assert.equal(assertSafeAuditDatabaseName(second), second);
});

test("audit database name builder generates independent strong entropy", () => {
  const first = buildAuditDatabaseName("clean");
  const second = buildAuditDatabaseName("clean");
  assert.notEqual(first, second);
  assert.match(first, /^didaugio_codex_migration_[a-f0-9]{32}_clean$/u);
  assert.match(second, /^didaugio_codex_migration_[a-f0-9]{32}_clean$/u);
});

test("owned database cleanup uses the PostgreSQL 12 compatible sequence", async () => {
  const calls = [];
  const client = {
    query: async (...args) => {
      calls.push(args);
      return { rowCount: 0 };
    },
  };
  const databaseName = buildAuditDatabaseName("cleanup", {
    entropy: "0123456789abcdef0123456789abcdef",
  });

  await dropOwnedAuditDatabase(client, databaseName);

  assert.deepEqual(calls, [
    [`ALTER DATABASE ${quoteIdentifier(databaseName)} ALLOW_CONNECTIONS false`],
    [
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [databaseName],
    ],
    [`DROP DATABASE ${quoteIdentifier(databaseName)}`],
  ]);
});

test("migration audit rewrites only the database path", () => {
  const result = new URL(
    buildDatabaseUrl(
      "postgresql://user:secret@localhost:5432/didaugio?schema=public",
      `${AUDIT_DB_PREFIX}clean_123`,
    ),
  );
  assert.equal(result.pathname, `/${AUDIT_DB_PREFIX}clean_123`);
  assert.equal(result.searchParams.get("schema"), "public");
  assert.equal(result.username, "user");
});

test("migration audit redacts only PostgreSQL URL passwords", () => {
  assert.equal(
    redactDatabaseUrl("postgresql://alice:secret@localhost:5432/db?schema=public"),
    "postgresql://alice:***@localhost:5432/db?schema=public",
  );
  assert.equal(
    redactDatabaseUrl("postgres://alice:s%40cret@localhost/db?sslmode=require#audit"),
    "postgres://alice:***@localhost/db?sslmode=require#audit",
  );
  assert.equal(
    redactDatabaseUrl("postgresql://alice@localhost/db"),
    "postgresql://alice@localhost/db",
  );
  assert.equal(
    redactDatabaseUrl(
      "postgresql://alice:userinfo-secret@localhost/db?sslmode=require&PASSWORD=query%40secret&application_name=audit",
    ),
    "postgresql://alice:***@localhost/db?sslmode=require&PASSWORD=***&application_name=audit",
  );
  assert.equal(
    redactDatabaseUrl(
      "postgresql://alice:userinfo-secret@localhost/db?password=first%2Fsecret&Password=second%3Fsecret&schema=public",
    ),
    "postgresql://alice:***@localhost/db?password=***&Password=***&schema=public",
  );
});

test("migration audit redaction rejects malformed and non-PostgreSQL input without echoing it", () => {
  const sensitiveInputs = [
    "not-a-url-secret-password",
    "mysql://alice:secret@localhost/db",
  ];
  for (const value of sensitiveInputs) {
    assert.throws(
      () => redactDatabaseUrl(value),
      (error) => {
        assert.match(error.message, /database URL/iu);
        assert.ok(!error.message.includes(value));
        assert.ok(!error.message.includes("secret"));
        return true;
      },
    );
  }
});

test("all PostgreSQL URL builders reject malformed input without leaking it", () => {
  const sentinel = "TASK5_URL_SENTINEL_SECRET";
  const malformed = `postgresql://alice:${sentinel}@[::1`;
  for (const operation of [
    () => buildDatabaseUrl(malformed, `${AUDIT_DB_PREFIX}safe_parse`),
    () => buildAdminDatabaseUrl(malformed),
    () => migrationAudit.buildPgClientConfig(malformed),
    () => redactDatabaseUrl(malformed),
  ]) {
    assert.throws(operation, (error) => {
      assert.match(error.message, /valid PostgreSQL database URL/iu);
      assert.ok(!error.message.includes(sentinel));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test("spawn diagnostics redact both userinfo and query-string passwords", () => {
  const databaseUrl = "postgresql://alice:userinfo-secret@localhost/db?password=query-secret&schema=public";
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      {
        status: 1,
        stderr: `failed for ${databaseUrl}`,
      },
      "Prisma migrate deploy",
      { databaseUrl },
    ),
    (error) => {
      assert.match(
        error.message,
        /postgresql:\/\/alice:\*\*\*@localhost\/db\?password=\*\*\*&schema=public/iu,
      );
      assert.doesNotMatch(error.message, /userinfo-secret|query-secret/iu);
      return true;
    },
  );
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      { error: new Error(`could not start for ${databaseUrl}`) },
      "Prisma migrate deploy",
      { databaseUrl },
    ),
    (error) => {
      assert.doesNotMatch(error.message, /userinfo-secret|query-secret/iu);
      assert.equal(error.cause, undefined);
      return true;
    },
  );
});

test("real aggregate gate rejects malformed DATABASE_URL without leaking it or running tests", () => {
  const sentinel = "TASK5_REAL_PROCESS_SENTINEL_SECRET";
  const result = spawnMigrationQualityGate({
    ...process.env,
    DATABASE_URL: `postgresql://alice:${sentinel}@[::1`,
  });
  const output = `${String(result.stdout ?? "")}\n${String(result.stderr ?? "")}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /valid PostgreSQL database URL/iu);
  assert.doesNotMatch(output, new RegExp(sentinel, "u"));
  assert.doesNotMatch(output, /migration audit uses deploy/iu);
});

test("real aggregate gate rejects missing DATABASE_URL before focused tests", () => {
  const env = {
    ...process.env,
    DOTENV_CONFIG_PATH: fileURLToPath(
      new URL("../.env.task5-intentionally-missing", import.meta.url),
    ),
  };
  delete env.DATABASE_URL;
  const result = spawnMigrationQualityGate(env);
  const output = `${String(result.stdout ?? "")}\n${String(result.stderr ?? "")}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /DATABASE_URL is required/u);
  assert.doesNotMatch(output, /migration audit uses deploy/iu);
});

test("migration quality gate verifies clean history before all focused tests", () => {
  assert.equal(
    packageJson.scripts["quality:migrations"],
    "npm run migrate:verify && node --test test/migrationAudit.test.js test/migrationHistory.contract.test.js test/migrationReconciliation.integration.test.js test/bookingIdempotencyMigration.integration.test.js",
  );
});

test("live reconciliation tests load the same dotenv credentials as the verifier", () => {
  assert.match(reconciliationIntegrationSource, /^import "dotenv\/config";/u);
  assert.match(
    reconciliationIntegrationSource,
    /assertSuccessfulSpawn\([^;]*\{\s*databaseUrl,?\s*\}\s*\)/su,
  );
});

test("migration integrity runbook documents the destructive-safety contract", () => {
  const runbook = fs.readFileSync(migrationRunbookPath, "utf8");
  for (const required of [
    "CREATE DATABASE",
    "PostGIS",
    AUDIT_DB_PREFIX,
    "npm run quality:migrations",
    "prisma migrate status",
    "read-only",
    "invocation-owned",
    "never deploys or resets the application database",
    "never emits an unredacted database URL or credential",
    "backup",
    "explicit approval",
    "PostgreSQL 12-14",
  ]) assert.match(runbook, new RegExp(required, "iu"));
  assert.doesNotMatch(runbook, /postgres(?:ql)?:\/\/[^\s`]+/iu);
  assert.doesNotMatch(runbook, /never prints a database URL/iu);
  assert.doesNotMatch(runbook, /retain(?:ed|ing)?[^\n]*failed[^\n]*database/iu);
  assert.doesNotMatch(runbook, /must return zero/iu);
  assert.match(runbook, /local orphan audit/iu);
});

test("identifier quoting rejects values outside the safe database grammar", () => {
  assert.equal(quoteIdentifier(`${AUDIT_DB_PREFIX}clean_123`), `"${AUDIT_DB_PREFIX}clean_123"`);
  assert.throws(() => quoteIdentifier(`x"; DROP DATABASE didaugio; --`), /unsafe audit database name/i);
});

test("drift guard permits only exact residual statements for preserved raw objects", () => {
  assert.doesNotThrow(() => assertOnlyAllowedRawSqlDrift(`
    -- DropForeignKey
    ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey";
    -- DropForeignKey
    ALTER TABLE "province_boundaries" DROP CONSTRAINT "province_boundaries_dataset_release_id_province_code_fkey";
    -- DropIndex
    DROP INDEX "ward_records_search_trgm_idx";
    -- DropIndex
    DROP INDEX "province_records_search_trgm_idx";
    -- DropTable
    DROP TABLE "province_boundaries";
    -- DropTable
    DROP TABLE "administrative_ward_boundaries";
  `));
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('DROP TABLE "administrative_province_boundaries";'),
    /managed schema drift/i,
  );
  for (const unsafe of [
    'ALTER TABLE "province_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey";',
    'ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "unexpected_fkey";',
    'DROP INDEX "ward_records_search_trgm_idx_extra";',
    'DROP INDEX "province_boundaries_geom_gist_idx";',
  ]) assert.throws(() => assertOnlyAllowedRawSqlDrift(unsafe), /managed schema drift/i);
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('ALTER TABLE "bookings" DROP COLUMN "resource_id";'),
    /managed schema drift/i,
  );

  const exact = [
    'ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey"',
    'ALTER TABLE "province_boundaries" DROP CONSTRAINT "province_boundaries_dataset_release_id_province_code_fkey"',
    'DROP INDEX "ward_records_search_trgm_idx"',
    'DROP INDEX "province_records_search_trgm_idx"',
    'DROP TABLE "administrative_ward_boundaries"',
    'DROP TABLE "province_boundaries"',
  ];
  for (const invalid of [
    "",
    exact.slice(0, -1).join(";"),
    [...exact, exact[0]].join(";"),
    [...exact, 'DROP TABLE "near_miss"'].join(";"),
    exact.map((statement, index) => index === 0 ? `${statement}_near_miss` : statement).join(";"),
  ]) assert.throws(() => assertOnlyAllowedRawSqlDrift(invalid), /managed schema drift/i);
});

test("Phase 1 cleanup never relies on PostgreSQL 13 DROP DATABASE FORCE", () => {
  assert.doesNotMatch(verifyMigrationHistorySource, /WITH\s*\(\s*FORCE\s*\)/iu);
  assert.doesNotMatch(reconciliationIntegrationSource, /WITH\s*\(\s*FORCE\s*\)/iu);
});

test("Prisma child processes use the shared 120 second safety bound", () => {
  assert.equal(migrationAudit.PRISMA_SPAWN_TIMEOUT_MS, 120_000);
  assert.match(
    verifyMigrationHistorySource,
    /timeout:\s*PRISMA_SPAWN_TIMEOUT_MS/u,
  );
});

test("spawn result guard surfaces timeouts and nonzero exits", () => {
  assert.equal(typeof migrationAudit.assertSuccessfulSpawn, "function");
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      { error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }) },
      "Prisma db push",
    ),
    /Prisma db push timed out after 120000ms/iu,
  );
  assert.throws(
    () => migrationAudit.assertSuccessfulSpawn(
      { status: 1, stderr: "schema failure" },
      "Prisma migrate deploy",
    ),
    /Prisma migrate deploy exited with 1: schema failure/iu,
  );
  assert.equal(
    migrationAudit.assertSuccessfulSpawn({ status: 0, stdout: "ok" }, "Prisma"),
    "ok",
  );
});

test("PostgreSQL clients ignore every timeout URL override", () => {
  assert.equal(migrationAudit.PG_CONNECTION_TIMEOUT_MS, 10_000);
  assert.equal(migrationAudit.PG_OPERATION_TIMEOUT_MS, 120_000);
  assert.equal(typeof migrationAudit.buildPgClientConfig, "function");
  assert.deepEqual(
    migrationAudit.buildPgClientConfig("postgresql://localhost/task4"),
    {
      connectionString: "postgresql://localhost/task4",
      connectionTimeoutMillis: 10_000,
      query_timeout: 120_000,
      statement_timeout: 120_000,
    },
  );
  assert.match(verifyMigrationHistorySource, /buildPgClientConfig\(adminUrl\)/u);
  assert.equal(
    (reconciliationIntegrationSource.match(/new Client\(buildPgClientConfig\(/gu) ?? []).length,
    2,
  );

  const hostileUrl = new URL("postgresql://audit:test%40secret@localhost/task4");
  hostileUrl.searchParams.append("connect_timeout", "9999");
  hostileUrl.searchParams.append("connectionTimeoutMillis", "0");
  hostileUrl.searchParams.append("statement_timeout", "999999999");
  hostileUrl.searchParams.append("query_timeout", "999999999");
  hostileUrl.searchParams.append("CoNnEcT_TiMeOuT", "8888");
  hostileUrl.searchParams.append("CONNECTIONTIMEOUTMILLIS", "1");
  hostileUrl.searchParams.append("Statement_Timeout", "888888888");
  hostileUrl.searchParams.append("QUERY_TIMEOUT", "888888888");
  hostileUrl.searchParams.append("password", "query@secret");
  hostileUrl.searchParams.append("application_name", "task4-timeout-test");
  hostileUrl.searchParams.append("sslmode", "disable");

  const effectiveClient = new Client(
    migrationAudit.buildPgClientConfig(hostileUrl.toString()),
  );
  assert.equal(effectiveClient._connectionTimeoutMillis, 10_000);
  assert.equal(effectiveClient.connectionParameters.connect_timeout, 10);
  assert.equal(effectiveClient.connectionParameters.statement_timeout, 120_000);
  assert.equal(effectiveClient.connectionParameters.query_timeout, 120_000);
  assert.equal(effectiveClient.connectionParameters.application_name, "task4-timeout-test");
  assert.equal(effectiveClient.connectionParameters.user, "audit");
  assert.equal(effectiveClient.connectionParameters.password, "query@secret");
  const sanitizedUrl = new URL(
    migrationAudit.buildPgClientConfig(hostileUrl.toString()).connectionString,
  );
  assert.equal(sanitizedUrl.searchParams.get("application_name"), "task4-timeout-test");
  assert.equal(sanitizedUrl.searchParams.get("sslmode"), "disable");
  assert.equal(sanitizedUrl.searchParams.get("password"), "query@secret");
  assert.deepEqual(
    [...sanitizedUrl.searchParams.keys()].filter((name) => [
      "connect_timeout",
      "connectiontimeoutmillis",
      "query_timeout",
      "statement_timeout",
    ].includes(name.toLowerCase())),
    [],
  );
});
