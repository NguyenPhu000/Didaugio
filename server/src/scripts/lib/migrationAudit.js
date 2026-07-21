import crypto from "node:crypto";

export const AUDIT_DB_PREFIX = "didaugio_codex_migration_";
export const POSTGRES_IDENTIFIER_MAX_BYTES = 63;
export const PRISMA_SPAWN_TIMEOUT_MS = 120_000;
export const PG_CONNECTION_TIMEOUT_MS = 10_000;
export const PG_OPERATION_TIMEOUT_MS = 120_000;
const SAFE_AUDIT_DB_RE = /^didaugio_codex_migration_[a-z0-9_]+$/u;
const TIMEOUT_URL_PARAMETERS = new Set([
  "connect_timeout",
  "connectiontimeoutmillis",
  "query_timeout",
  "statement_timeout",
]);

function redactDatabaseUrlInDiagnostic(value, databaseUrl) {
  const diagnostic = String(value ?? "");
  if (!databaseUrl) return diagnostic;
  let redactedUrl;
  try {
    redactedUrl = redactDatabaseUrl(databaseUrl);
  } catch {
    return "Sensitive database diagnostic suppressed";
  }
  return diagnostic.replaceAll(String(databaseUrl), redactedUrl);
}

export function assertSuccessfulSpawn(result, label, { databaseUrl } = {}) {
  if (result.error?.code === "ETIMEDOUT") {
    throw new Error(`${label} timed out after ${PRISMA_SPAWN_TIMEOUT_MS}ms`, {
      cause: result.error,
    });
  }
  if (result.error) {
    const detail = redactDatabaseUrlInDiagnostic(result.error.message, databaseUrl);
    if (databaseUrl) throw new Error(`${label} failed to start: ${detail}`);
    throw new Error(`${label} failed to start: ${detail}`, { cause: result.error });
  }
  if (result.status !== 0) {
    const detail = redactDatabaseUrlInDiagnostic(result.stderr, databaseUrl).trim();
    throw new Error(
      `${label} exited with ${String(result.status)}${detail ? `: ${detail}` : ""}`,
    );
  }
  return String(result.stdout ?? "");
}

export function buildPgClientConfig(connectionString) {
  const sanitizedUrl = parsePostgresDatabaseUrl(connectionString);
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
  const value = String(name);
  if (!SAFE_AUDIT_DB_RE.test(value)
      || Buffer.byteLength(value, "ascii") > POSTGRES_IDENTIFIER_MAX_BYTES) {
    throw new Error(`Unsafe audit database name: ${String(name)}`);
  }
  return value;
}

export function buildAuditDatabaseName(label, {
  entropy = crypto.randomBytes(16).toString("hex"),
} = {}) {
  if (!/^[a-f0-9]{32}$/u.test(entropy)) {
    throw new Error("Audit database entropy must be 128-bit lowercase hexadecimal");
  }
  const base = `${AUDIT_DB_PREFIX}${entropy}_`;
  const availableBytes = POSTGRES_IDENTIFIER_MAX_BYTES - Buffer.byteLength(base, "ascii");
  const suffix = String(label ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, availableBytes) || "audit".slice(0, availableBytes);
  return assertSafeAuditDatabaseName(`${base}${suffix}`);
}

export function quoteIdentifier(identifier) {
  return `"${assertSafeAuditDatabaseName(identifier)}"`;
}

export async function dropOwnedAuditDatabase(client, databaseName) {
  const quotedName = quoteIdentifier(databaseName);
  await client.query(`ALTER DATABASE ${quotedName} ALLOW_CONNECTIONS false`);
  await client.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
    [databaseName],
  );
  await client.query(`DROP DATABASE ${quotedName}`);
}

export function parsePostgresDatabaseUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Migration audit requires a valid PostgreSQL database URL");
  }
  if (!/^postgres(?:ql)?:$/u.test(parsed.protocol)) {
    throw new Error("Migration audit requires a valid PostgreSQL database URL");
  }
  return parsed;
}

export function buildDatabaseUrl(sourceUrl, databaseName) {
  const parsed = parsePostgresDatabaseUrl(sourceUrl);
  parsed.pathname = `/${assertSafeAuditDatabaseName(databaseName)}`;
  return parsed.toString();
}

export function buildAdminDatabaseUrl(sourceUrl) {
  const parsed = parsePostgresDatabaseUrl(sourceUrl);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

export function redactDatabaseUrl(value) {
  const parsed = parsePostgresDatabaseUrl(value);
  if (parsed.password) parsed.password = "***";
  const parameters = [...parsed.searchParams.entries()];
  parsed.search = "";
  for (const [name, parameterValue] of parameters) {
    parsed.searchParams.append(
      name,
      name.toLowerCase() === "password" ? "***" : parameterValue,
    );
  }
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

export async function runMigrationAudit({
  create,
  deploy,
  diff,
  validate = (driftSql) => driftSql,
  cleanup,
}) {
  let driftSql;
  let primaryFailure;
  let ownsDatabase = false;
  try {
    await create();
    ownsDatabase = true;
    await deploy();
    driftSql = await diff();
    driftSql = await validate(driftSql);
  } catch (error) {
    primaryFailure = error;
  }

  let cleanupFailure;
  if (ownsDatabase) {
    try {
      await cleanup();
    } catch (error) {
      cleanupFailure = error;
    }
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
  const normalizedStatements = statements.map((statement) => statement.replace(/\s+/gu, " "));
  for (const [index, normalized] of normalizedStatements.entries()) {
    if (!ALLOWED_RAW_SQL_DRIFT.has(normalized)) {
      throw new Error(`Managed schema drift detected: ${statements[index]}`);
    }
  }
  if (normalizedStatements.length !== ALLOWED_RAW_SQL_DRIFT.size
      || new Set(normalizedStatements).size !== ALLOWED_RAW_SQL_DRIFT.size) {
    throw new Error(
      `Managed schema drift detected: expected exactly ${ALLOWED_RAW_SQL_DRIFT.size} unique preserved raw SQL statements`,
    );
  }
  return statements;
}
