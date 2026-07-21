export const AUDIT_DB_PREFIX = "didaugio_codex_migration_";
export const PRISMA_SPAWN_TIMEOUT_MS = 120_000;
export const PG_CONNECTION_TIMEOUT_MS = 10_000;
export const PG_OPERATION_TIMEOUT_MS = 120_000;
const SAFE_AUDIT_DB_RE = /^didaugio_codex_migration_[a-z0-9_]+$/u;
const TIMEOUT_URL_PARAMETERS = new Set([
  "connect_timeout",
  "query_timeout",
  "statement_timeout",
]);

export function assertSuccessfulSpawn(result, label) {
  if (result.error?.code === "ETIMEDOUT") {
    throw new Error(`${label} timed out after ${PRISMA_SPAWN_TIMEOUT_MS}ms`, {
      cause: result.error,
    });
  }
  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`, {
      cause: result.error,
    });
  }
  if (result.status !== 0) {
    const detail = String(result.stderr ?? "").trim();
    throw new Error(
      `${label} exited with ${String(result.status)}${detail ? `: ${detail}` : ""}`,
    );
  }
  return String(result.stdout ?? "");
}

export function buildPgClientConfig(connectionString) {
  const sanitizedUrl = new URL(connectionString);
  for (const parameter of [...sanitizedUrl.searchParams.keys()]) {
    if (TIMEOUT_URL_PARAMETERS.has(parameter.toLowerCase())) {
      sanitizedUrl.searchParams.delete(parameter);
    }
  }
  return {
    connectionString: sanitizedUrl.toString(),
    connectionTimeoutMillis: PG_CONNECTION_TIMEOUT_MS,
    query_timeout: PG_OPERATION_TIMEOUT_MS,
    statement_timeout: PG_OPERATION_TIMEOUT_MS,
  };
}

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

export function buildPrismaCommands({ schemaPath }) {
  return {
    deploy: ["prisma", "migrate", "deploy", `--schema=${schemaPath}`],
    diff: [
      "prisma",
      "migrate",
      "diff",
      "--script",
      "--from-schema-datasource",
      schemaPath,
      "--to-schema-datamodel",
      schemaPath,
    ],
  };
}

export async function runMigrationAudit({ create, deploy, diff, cleanup }) {
  let driftSql;
  let primaryFailure;
  try {
    await create();
    await deploy();
    driftSql = await diff();
  } catch (error) {
    primaryFailure = error;
  }

  let cleanupFailure;
  try {
    await cleanup();
  } catch (error) {
    cleanupFailure = error;
  }

  if (primaryFailure && cleanupFailure) {
    throw new AggregateError(
      [primaryFailure, cleanupFailure],
      "Migration audit failed and cleanup also failed",
    );
  }
  if (primaryFailure) throw primaryFailure;
  if (cleanupFailure) throw cleanupFailure;
  return driftSql;
}

const ALLOWED_RAW_SQL_DRIFT = new Set([
  'ALTER TABLE "administrative_ward_boundaries" DROP CONSTRAINT "administrative_ward_boundarie_dataset_release_id_ward_code_fkey"',
  'ALTER TABLE "province_boundaries" DROP CONSTRAINT "province_boundaries_dataset_release_id_province_code_fkey"',
  'DROP INDEX "ward_records_search_trgm_idx"',
  'DROP INDEX "province_records_search_trgm_idx"',
  'DROP TABLE "administrative_ward_boundaries"',
  'DROP TABLE "province_boundaries"',
]);

export function assertOnlyAllowedRawSqlDrift(sql) {
  const statements = String(sql)
    .replace(/^\s*--.*$/gmu, "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const statement of statements) {
    const normalized = statement.replace(/\s+/gu, " ");
    if (!ALLOWED_RAW_SQL_DRIFT.has(normalized)) {
      throw new Error(`Managed schema drift detected: ${statement}`);
    }
  }
  return statements;
}
