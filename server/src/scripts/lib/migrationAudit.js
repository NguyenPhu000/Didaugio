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

export function buildPrismaCommands({ schemaPath, auditUrl }) {
  return {
    deploy: ["prisma", "migrate", "deploy", `--schema=${schemaPath}`],
    diff: [
      "prisma",
      "migrate",
      "diff",
      "--script",
      "--from-url",
      auditUrl,
      "--to-schema-datamodel",
      schemaPath,
    ],
  };
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
    .replace(/^\s*--.*$/gmu, "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const statement of statements) {
    const match = statement.match(
      /^DROP TABLE (?:(?:"([a-z0-9_]+)")\.)?"([a-z0-9_]+)"$/u,
    );
    const relation = match ? [match[1], match[2]].filter(Boolean).join(".") : null;
    if (!relation || !ALLOWED_RAW_DROP_TABLES.has(relation)) {
      throw new Error(`Managed schema drift detected: ${statement}`);
    }
  }
  return statements;
}
