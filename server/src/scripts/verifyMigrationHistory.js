import "dotenv/config";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import {
  AUDIT_DB_PREFIX,
  assertOnlyAllowedRawSqlDrift,
  assertSafeAuditDatabaseName,
  buildDatabaseUrl,
  buildPrismaCommands,
  quoteIdentifier,
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
const commands = buildPrismaCommands({
  schemaPath: "prisma/schema.prisma",
  auditUrl,
});
let connected = false;

function run(command, args, env, { capture = false } = {}) {
  let spawnCommand = command;
  let spawnArgs = args;
  if (process.platform === "win32") {
    const commandLine = [command, ...args]
      .map((arg) => (arg === auditUrl ? "%DATABASE_URL%" : arg))
      .map((arg) => {
        if (!/^[%A-Za-z0-9_./:=+-]+$/u.test(arg)) {
          throw new Error("Unsafe Prisma command argument");
        }
        return arg;
      })
      .join(" ");
    spawnCommand = process.env.ComSpec || "cmd.exe";
    spawnArgs = ["/d", "/s", "/c", commandLine];
  }
  const result = spawnSync(spawnCommand, spawnArgs, {
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
  run(npx, commands.deploy, { ...process.env, DATABASE_URL: auditUrl });
  const driftSql = run(
    npx,
    commands.diff,
    { ...process.env, DATABASE_URL: auditUrl },
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
