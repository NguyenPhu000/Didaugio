import "dotenv/config";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";
import {
  PRISMA_SPAWN_TIMEOUT_MS,
  assertOnlyAllowedRawSqlDrift,
  assertSuccessfulSpawn,
  buildAdminDatabaseUrl,
  buildAuditDatabaseName,
  buildDatabaseUrl,
  buildPgClientConfig,
  buildPrismaCommands,
  dropOwnedAuditDatabase,
  quoteIdentifier,
  runMigrationAudit,
} from "./lib/migrationAudit.js";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL is required");

const databaseName = buildAuditDatabaseName("clean");
const auditUrl = buildDatabaseUrl(sourceUrl, databaseName);
const adminUrl = buildAdminDatabaseUrl(sourceUrl);
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
const commands = buildPrismaCommands({ schemaPath: "prisma/schema.prisma" });

function runPrisma(args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [prismaCli, ...args.slice(1)], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: auditUrl },
    encoding: "utf8",
    stdio: ["ignore", capture ? "pipe" : "inherit", "pipe"],
    shell: false,
    timeout: PRISMA_SPAWN_TIMEOUT_MS,
  });
  const stdout = assertSuccessfulSpawn(result, `Prisma ${args.join(" ")}`, {
    databaseUrl: auditUrl,
  });
  return capture ? stdout : "";
}

const withAdminClient = async (operation) => {
  const client = new Client(buildPgClientConfig(adminUrl));
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
      dropOwnedAuditDatabase(client, databaseName),
    ),
}).then(assertOnlyAllowedRawSqlDrift);
