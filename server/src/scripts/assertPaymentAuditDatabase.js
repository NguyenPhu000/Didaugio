import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("quality:payments requires DATABASE_URL for disposable PostgreSQL audit databases; it never runs against the application database.");
}

let parsed;
try { parsed = new URL(databaseUrl); } catch {
  throw new Error("quality:payments requires DATABASE_URL to be a valid PostgreSQL connection URL.");
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
  throw new Error("quality:payments requires DATABASE_URL with a PostgreSQL host and database name.");
}

const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5_000 });
try {
  await client.connect();
} catch (error) {
  throw new Error(
    `quality:payments cannot connect to DATABASE_URL for disposable audit databases (${error.code || "connection error"}). Start or authorize PostgreSQL, then retry.`,
  );
} finally {
  await client.end().catch(() => undefined);
}
