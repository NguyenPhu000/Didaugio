import "dotenv/config";
import { Client } from "pg";

import { buildAdminDatabaseUrl, buildPgClientConfig } from "./lib/migrationAudit.js";

const BOOKING_AUDIT_NAME_PATTERN = "didaugio_codex_migration_%_booking_%";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for booking audit cleanup verification");
  }

  const admin = new Client(buildPgClientConfig(buildAdminDatabaseUrl(process.env.DATABASE_URL)));
  try {
    await admin.connect();
    const result = await admin.query(
      "SELECT datname FROM pg_database WHERE datname LIKE $1 ORDER BY datname",
      [BOOKING_AUDIT_NAME_PATTERN],
    );
    console.log(`owned_booking_audit_databases=${result.rowCount}`);
    if (result.rowCount !== 0) {
      throw new Error("Owned booking audit databases remain; inspect them with PostgreSQL administration records");
    }
  } finally {
    await admin.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
