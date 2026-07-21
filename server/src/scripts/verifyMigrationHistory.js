import "dotenv/config";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";
import {
  AUDIT_DB_PREFIX,
  assertOnlyAllowedRawSqlDrift,
  assertSafeAuditDatabaseName,
  buildDatabaseUrl,
  buildPrismaCommands,
  quoteIdentifier,
  runMigrationAudit,
} from "./lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL is required");

const databaseName = assertSafeAuditDatabaseName(
  `${AUDIT_DB_PREFIX}clean_${crypto.randomBytes(6).toString("hex")}`,
);
const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/postgres";
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
const commands = buildPrismaCommands({ schemaPath: "prisma/schema.prisma" });

function runPrisma(args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [prismaCli, ...args.slice(1)], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: auditUrl },
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    shell: false,
  });
  if (result.status !== 0) throw new Error(`Prisma CLI exited with ${result.status}`);
  return capture ? result.stdout : "";
}

const withAdminClient = async (operation) => {
  const client = new Client({ connectionString: adminUrl.toString() });
  try {
    await client.connect();
    return await operation(client);
  } finally {
    await client.end().catch(() => undefined);
  }
};

await runMigrationAudit({
  create: () =>
    withAdminClient((client) =>
      client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`),
    ),
  deploy: () => runPrisma(commands.deploy),
  diff: () => runPrisma(commands.diff, { capture: true }),
  cleanup: () =>
    withAdminClient((client) =>
      client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`),
    ),
}).then(assertOnlyAllowedRawSqlDrift);
