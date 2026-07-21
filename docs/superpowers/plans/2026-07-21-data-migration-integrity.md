# Data and Migration Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the committed Prisma migration history capable of building the current schema on a clean PostgreSQL/PostGIS database without manual edits, while remaining safe for databases that already contain manually-pushed objects.

**Architecture:** Add an idempotent prerequisite migration before the first migration that references missing subscription tables, then add a forward reconciliation migration after the current history for all remaining schema drift. A Node verification harness creates an isolated, prefix-validated audit database, deploys migrations, runs Prisma drift comparison, and always drops only that exact audit database.

**Tech Stack:** Node.js 24, Node test runner, Prisma 5.22, PostgreSQL 13+, PostGIS, `pg`, PowerShell/npm scripts.

## Global Constraints

- Never edit a migration that is already committed/deployed.
- Never run reset/drop against the application database.
- Temporary database names must match `^didaugio_codex_migration_[a-z0-9_]+$`.
- Production migration command remains `prisma migrate deploy`.
- Raw PostGIS-managed objects must be explicit; accidental Prisma-model drift must fail verification.
- Preserve all existing user changes outside files listed by each task.

---

### Task 1: Safe audit-database helpers

**Files:**
- Create: `server/src/scripts/lib/migrationAudit.js`
- Test: `server/test/migrationAudit.test.js`

**Interfaces:**
- Consumes: a source PostgreSQL URL, an audit database name, and Prisma drift SQL.
- Produces: `AUDIT_DB_PREFIX`, `assertSafeAuditDatabaseName(name)`, `buildDatabaseUrl(sourceUrl, databaseName)`, `quoteIdentifier(identifier)`, and `assertOnlyAllowedRawSqlDrift(sql)`.

- [ ] **Step 1: Write the failing unit tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildDatabaseUrl,
  quoteIdentifier,
  assertOnlyAllowedRawSqlDrift,
} from "../src/scripts/lib/migrationAudit.js";

test("migration audit accepts only its dedicated database prefix", () => {
  assert.equal(
    assertSafeAuditDatabaseName(`${AUDIT_DB_PREFIX}clean_123`),
    `${AUDIT_DB_PREFIX}clean_123`,
  );
  for (const unsafe of ["didaugio", "postgres", "template1", "../didaugio", "audit-db"]) {
    assert.throws(() => assertSafeAuditDatabaseName(unsafe), /unsafe audit database name/i);
  }
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

test("identifier quoting rejects values outside the safe database grammar", () => {
  assert.equal(quoteIdentifier(`${AUDIT_DB_PREFIX}clean_123`), `"${AUDIT_DB_PREFIX}clean_123"`);
  assert.throws(() => quoteIdentifier(`x"; DROP DATABASE didaugio; --`), /unsafe audit database name/i);
});

test("drift guard permits only explicitly raw PostGIS boundary tables", () => {
  assert.doesNotThrow(() => assertOnlyAllowedRawSqlDrift(`
    -- DropTable
    DROP TABLE "administrative_province_boundaries";
    -- DropTable
    DROP TABLE "administrative_ward_boundaries";
  `));
  assert.throws(
    () => assertOnlyAllowedRawSqlDrift('ALTER TABLE "bookings" DROP COLUMN "resource_id";'),
    /managed schema drift/i,
  );
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test test/migrationAudit.test.js`

Expected: FAIL because `server/src/scripts/lib/migrationAudit.js` does not exist.

- [ ] **Step 3: Implement the minimal helpers**

```js
export const AUDIT_DB_PREFIX = "didaugio_codex_migration_";
const SAFE_AUDIT_DB_RE = /^didaugio_codex_migration_[a-z0-9_]+$/u;

export function assertSafeAuditDatabaseName(name) {
  if (!SAFE_AUDIT_DB_RE.test(String(name))) {
    throw new Error(`Unsafe audit database name: ${String(name)}`);
  }
  return String(name);
}

export function quoteIdentifier(identifier) {
  return `"${assertSafeAuditDatabaseName(identifier)}"`;
}

export function buildDatabaseUrl(sourceUrl, databaseName) {
  const parsed = new URL(sourceUrl);
  if (!/^postgres(?:ql)?:$/u.test(parsed.protocol)) {
    throw new Error("Migration audit requires a PostgreSQL URL");
  }
  parsed.pathname = `/${assertSafeAuditDatabaseName(databaseName)}`;
  return parsed.toString();
}

const ALLOWED_RAW_DROP_TABLES = new Set([
  "administrative_province_boundaries",
  "administrative_ward_boundaries",
  "vn_admin_source.provinces",
  "vn_admin_source.wards",
  "vn_admin_source.province_boundaries",
  "vn_admin_source.ward_boundaries",
]);

export function assertOnlyAllowedRawSqlDrift(sql) {
  const statements = String(sql)
    .replace(/^--.*$/gmu, "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const statement of statements) {
    const match = statement.match(
      /^DROP TABLE (?:(?:"([a-z0-9_]+)"\.)?"([a-z0-9_]+)")$/u,
    );
    const relation = match ? [match[1], match[2]].filter(Boolean).join(".") : null;
    if (!relation || !ALLOWED_RAW_DROP_TABLES.has(relation)) {
      throw new Error(`Managed schema drift detected: ${statement}`);
    }
  }
  return statements;
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test test/migrationAudit.test.js`

Expected: 3 tests pass, exit 0, process exits immediately.

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/lib/migrationAudit.js server/test/migrationAudit.test.js
git commit -m "test: add safe migration audit database helpers"
```

### Task 2: Reproducible clean-database verifier

**Files:**
- Create: `server/src/scripts/verifyMigrationHistory.js`
- Modify: `server/package.json`
- Test: `server/test/migrationAudit.test.js`

**Interfaces:**
- Consumes: `DATABASE_URL`, the committed `server/prisma/migrations`, and `server/prisma/schema.prisma`.
- Produces: command `npm run migrate:verify`; exit 0 only when deploy and drift checks both pass.

- [ ] **Step 1: Add failing tests for command construction and cleanup safety**

Extend `migrationAudit.js` with a pure `buildPrismaCommands({ schemaPath, auditUrl })` API and first add:

```js
test("migration audit uses deploy and emits a reviewable drift script", () => {
  const commands = buildPrismaCommands({
    schemaPath: "prisma/schema.prisma",
    auditUrl: "postgresql://user:secret@localhost:5432/didaugio_codex_migration_clean",
  });
  assert.deepEqual(commands.deploy, ["prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"]);
  assert.deepEqual(commands.diff.slice(0, 4), ["prisma", "migrate", "diff", "--script"]);
  assert.ok(commands.diff.includes("--from-url"));
  assert.ok(commands.diff.includes("--to-schema-datamodel"));
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/migrationAudit.test.js`

Expected: FAIL because `buildPrismaCommands` is not exported.

- [ ] **Step 3: Implement the verifier**

The script must:

```js
import "dotenv/config";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import {
  AUDIT_DB_PREFIX,
  assertSafeAuditDatabaseName,
  buildDatabaseUrl,
  quoteIdentifier,
  assertOnlyAllowedRawSqlDrift,
} from "./lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL is required");

const databaseName = assertSafeAuditDatabaseName(
  `${AUDIT_DB_PREFIX}clean_${crypto.randomBytes(6).toString("hex")}`,
);
const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/postgres";
const admin = new Client({ connectionString: adminUrl.toString() });
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
let connected = false;

function run(command, args, env, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    shell: false,
  });
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
  return capture ? result.stdout : "";
}

try {
  await admin.connect();
  connected = true;
  await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  run(npx, ["prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"], {
    ...process.env,
    DATABASE_URL: auditUrl,
  });
  const driftSql = run(
    npx,
    [
      "prisma", "migrate", "diff", "--script",
      "--from-url", auditUrl,
      "--to-schema-datamodel", "prisma/schema.prisma",
    ],
    process.env,
    { capture: true },
  );
  assertOnlyAllowedRawSqlDrift(driftSql);
} finally {
  if (!connected) {
    await admin.connect();
    connected = true;
  }
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`);
  await admin.end();
}
```

Do not log either database URL. An empty drift script is valid; otherwise every statement must pass the explicit raw-table allowlist.

Add the package script:

```json
"migrate:verify": "node src/scripts/verifyMigrationHistory.js"
```

- [ ] **Step 4: Run unit tests, then execute the verifier and capture the expected baseline failure**

Run: `node --test test/migrationAudit.test.js`

Expected: all helper tests pass.

Run: `npm run migrate:verify`

Expected before Task 3: FAIL at migration `20260714000000_add_subscription_limits_and_place_telemetry` because `subscription_plans` does not exist. The temporary audit database must still be removed.

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/verifyMigrationHistory.js server/src/scripts/lib/migrationAudit.js server/test/migrationAudit.test.js server/package.json
git commit -m "build: add clean migration history verifier"
```

### Task 3: Subscription prerequisite migration

**Files:**
- Create: `server/prisma/migrations/20260713000000_create_subscription_baseline/migration.sql`
- Create: `server/test/migrationHistory.contract.test.js`

**Interfaces:**
- Consumes: pre-20260714 migration schema containing `businesses`.
- Produces: `subscription_plans`, `subscriptions`, `subscription_invoices`, and `subscription_stats` before `20260714000000` runs.

- [ ] **Step 1: Write a failing migration-order contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationsRoot = path.resolve("prisma/migrations");

test("subscription baseline exists before subscription telemetry alters it", () => {
  const names = fs.readdirSync(migrationsRoot).sort();
  const createIndex = names.indexOf("20260713000000_create_subscription_baseline");
  const alterIndex = names.indexOf("20260714000000_add_subscription_limits_and_place_telemetry");
  assert.ok(createIndex >= 0, "subscription baseline migration is missing");
  assert.ok(createIndex < alterIndex, "subscription baseline must run before telemetry migration");
  const sql = fs.readFileSync(path.join(migrationsRoot, names[createIndex], "migration.sql"), "utf8");
  for (const table of ["subscription_plans", "subscriptions", "subscription_invoices", "subscription_stats"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`, "u"));
  }
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/migrationHistory.contract.test.js`

Expected: FAIL because the prerequisite migration is missing.

- [ ] **Step 3: Add the idempotent prerequisite SQL**

The migration mirrors the four Prisma models exactly. It uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and guarded foreign-key blocks such as:

```sql
CREATE TABLE IF NOT EXISTS "subscription_plans" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price_monthly" INTEGER NOT NULL,
  "price_yearly" INTEGER,
  "max_places" INTEGER NOT NULL DEFAULT 5,
  "max_services" INTEGER NOT NULL DEFAULT 5,
  "max_bookings_per_month" INTEGER NOT NULL DEFAULT 100,
  "max_staff" INTEGER NOT NULL DEFAULT 2,
  "features" JSONB NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_name_key" ON "subscription_plans"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_plans_slug_key" ON "subscription_plans"("slug");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL NOT NULL,
  "business_id" INTEGER NOT NULL,
  "plan_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "billing_cycle" TEXT NOT NULL DEFAULT 'monthly',
  "current_period_start" TIMESTAMP(3) NOT NULL,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "grace_period_end" TIMESTAMP(3),
  "canceled_at" TIMESTAMP(3),
  "cancel_reason" TEXT,
  "trial_ends_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_business_id_key" ON "subscriptions"("business_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

CREATE TABLE IF NOT EXISTS "subscription_invoices" (
  "id" SERIAL NOT NULL,
  "subscription_id" INTEGER NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_method" TEXT,
  "transaction_ref" TEXT,
  "qr_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "due_date" TIMESTAMP(3) NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_invoice_number_key" ON "subscription_invoices"("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_transaction_ref_key" ON "subscription_invoices"("transaction_ref");
CREATE INDEX IF NOT EXISTS "subscription_invoices_subscription_id_idx" ON "subscription_invoices"("subscription_id");
CREATE INDEX IF NOT EXISTS "subscription_invoices_status_idx" ON "subscription_invoices"("status");
CREATE INDEX IF NOT EXISTS "subscription_invoices_due_date_idx" ON "subscription_invoices"("due_date");

CREATE TABLE IF NOT EXISTS "subscription_stats" (
  "id" SERIAL NOT NULL,
  "snapshot_date" DATE NOT NULL,
  "mrr" INTEGER NOT NULL DEFAULT 0,
  "arr" INTEGER NOT NULL DEFAULT 0,
  "active_count" INTEGER NOT NULL DEFAULT 0,
  "trial_count" INTEGER NOT NULL DEFAULT 0,
  "grace_count" INTEGER NOT NULL DEFAULT 0,
  "past_due_count" INTEGER NOT NULL DEFAULT 0,
  "canceled_count" INTEGER NOT NULL DEFAULT 0,
  "churn_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "new_count" INTEGER NOT NULL DEFAULT 0,
  "revenue_total" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_stats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_stats_snapshot_date_key" ON "subscription_stats"("snapshot_date");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_business_id_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_fkey"
      FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey') THEN
    ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey"
      FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_invoices_subscription_id_fkey') THEN
    ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_fkey"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
```

- [ ] **Step 4: Verify contract and advance the integration failure**

Run: `node --test test/migrationHistory.contract.test.js`

Expected: PASS.

Run: `npm run migrate:verify`

Expected: migration deploy advances past `20260714000000`; drift comparison still fails because the migration history lacks current Booking/business/payment objects. This is the correct RED for Task 4.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/migrations/20260713000000_create_subscription_baseline/migration.sql server/test/migrationHistory.contract.test.js
git commit -m "fix: add subscription migration prerequisite"
```

### Task 4: Forward-only full-schema reconciliation

**Files:**
- Create: `server/prisma/migrations/20260721010000_reconcile_prisma_schema/migration.sql`
- Modify: `server/test/migrationHistory.contract.test.js`

**Interfaces:**
- Consumes: schema produced by all migrations through `20260720151000`.
- Produces: exact managed schema represented by `server/prisma/schema.prisma` without dropping user data or raw PostGIS tables.

- [ ] **Step 1: Extend the contract test for critical current objects**

Add an assertion that the reconciliation SQL contains all critical managed objects:

```js
test("reconciliation migration covers critical booking and financial schema", () => {
  const sql = fs.readFileSync(
    path.join(migrationsRoot, "20260721010000_reconcile_prisma_schema", "migration.sql"),
    "utf8",
  );
  for (const token of [
    'CREATE TYPE "BookingStatus"',
    'CREATE TYPE "BookingAction"',
    '"booking_model"',
    '"slot_duration_minutes"',
    'CREATE TABLE "place_resources"',
    'CREATE TABLE "business_blocked_dates"',
    'CREATE TABLE "booking_action_logs"',
    'CREATE TABLE "booking_transactions"',
    'CREATE TABLE "payment_webhook_logs"',
    'CREATE TABLE "financial_ledgers"',
    '"resource_id"',
    '"start_time"',
    '"end_time"',
    '"business_id"',
    '"idempotency_key"',
  ]) assert.ok(sql.includes(token), `missing migration token: ${token}`);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/migrationHistory.contract.test.js`

Expected: FAIL because the reconciliation migration does not exist.

- [ ] **Step 3: Generate the raw delta from a database built through Task 3**

Use a dedicated audit database and Prisma's output option, never shell redirection:

```powershell
npx.cmd prisma migrate diff --from-url $auditUrl --to-schema-datamodel prisma/schema.prisma --script --output prisma/migrations/20260721010000_reconcile_prisma_schema/migration.sql
```

Review the generated SQL line-by-line and change destructive generated operations as follows:

- Do not drop `vn_admin_source`, PostGIS geometry tables, functions, or indexes.
- Convert existing text `bookings.status` values to `BookingStatus` with an explicit `USING` mapping and reject unknown values in a preflight `DO` block.
- Add required columns nullable or with safe defaults first, backfill deterministically, then apply `NOT NULL`.
- Create missing tables before adding their foreign keys.
- Create indexes with stable Prisma names.
- Add unique constraints only after a duplicate preflight query raises a descriptive exception.
- Make object creation safe when the current database already contains manually-pushed equivalents by checking `pg_class`, `information_schema.columns`, `pg_type`, and `pg_constraint` where PostgreSQL lacks `IF NOT EXISTS`.

- [ ] **Step 4: Verify the clean migration and zero managed drift**

Run: `node --test test/migrationHistory.contract.test.js`

Expected: all contract tests pass.

Run: `npm run migrate:verify`

Expected: all migrations deploy, Prisma diff exits 0, temporary database is removed, overall exit 0.

- [ ] **Step 5: Verify current-database preflight without applying**

Run: `npx.cmd prisma migrate status --schema=prisma/schema.prisma`

Expected: reports the two new migrations as pending and no failed migration. Do not deploy to the application database in this task.

- [ ] **Step 6: Commit**

```bash
git add server/prisma/migrations/20260721010000_reconcile_prisma_schema/migration.sql server/test/migrationHistory.contract.test.js
git commit -m "fix: reconcile migration history with Prisma schema"
```

### Task 5: CI-quality integration gate and documentation

**Files:**
- Modify: `server/src/scripts/verifyMigrationHistory.js`
- Modify: `server/package.json`
- Create: `server/docs/migration-integrity-runbook.md`
- Test: `server/test/migrationAudit.test.js`

**Interfaces:**
- Consumes: working PostgreSQL admin credentials with `CREATE DATABASE` and PostGIS extension privileges.
- Produces: a documented local/CI gate and explicit failure diagnostics.

- [ ] **Step 1: Add failing tests for guaranteed cleanup and secret redaction**

Extract `redactDatabaseUrl(value)` and test:

```js
test("migration audit redacts database credentials", () => {
  assert.equal(
    redactDatabaseUrl("postgresql://alice:secret@localhost:5432/db?schema=public"),
    "postgresql://alice:***@localhost:5432/db?schema=public",
  );
});
```

- [ ] **Step 2: Verify RED, implement, then verify GREEN**

Run: `node --test test/migrationAudit.test.js`

Expected RED: export missing. Implement URL password replacement without logging the raw input. Re-run and expect all tests pass.

- [ ] **Step 3: Add the aggregate package gate**

Add:

```json
"quality:migrations": "npm run migrate:verify && node --test test/migrationAudit.test.js test/migrationHistory.contract.test.js"
```

On Windows package scripts, use `&&` only inside npm's script because npm provides the same command-shell semantics in local/CI execution.

- [ ] **Step 4: Write the runbook**

Document prerequisites, exact commands, the safe database prefix, expected cleanup, how to inspect a retained failure only by an explicit debug flag, how to run `migrate status`, and the rule that production deployment requires a backup and approval. Do not include credentials or environment values.

- [ ] **Step 5: Run the complete phase verification**

Run: `npm run quality:migrations`

Expected: exit 0, no remaining `didaugio_codex_migration_*` database, all focused tests pass.

Run: `npx.cmd prisma validate --schema=prisma/schema.prisma`

Expected: schema valid, exit 0.

- [ ] **Step 6: Commit**

```bash
git add server/src/scripts/verifyMigrationHistory.js server/src/scripts/lib/migrationAudit.js server/package.json server/test/migrationAudit.test.js server/docs/migration-integrity-runbook.md
git commit -m "build: enforce migration integrity quality gate"
```

## Phase completion gate

- `npm run quality:migrations` exits 0 from `server`.
- `npx prisma validate` exits 0.
- Clean migration deploy reaches the current Prisma schema with zero managed drift.
- Current application database is not modified by the verifier.
- No audit database remains after success or failure.
- Git diff contains no edits to the user's in-progress web/app/multi-province files.
