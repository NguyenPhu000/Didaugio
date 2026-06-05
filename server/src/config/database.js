import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config({ override: true });

// These env vars are used by raw pg.Pool for direct SQL queries.
// Most of the app uses Prisma, which reads DATABASE_URL separately.
const requiredVars = ["USER_DB", "HOST_DB", "NAME_DB", "PASSWORD_DB", "PORT_DB"];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  logger.warn(
    `[Database] Missing raw-pg env vars: ${missing.join(", ")}. ` +
    `Raw pg.Pool will not work. Use Prisma client instead.`
  );
}

const pool = new Pool({
  user: process.env.USER_DB,
  host: process.env.HOST_DB,
  database: process.env.NAME_DB,
  password: process.env.PASSWORD_DB,
  port: process.env.PORT_DB ? Number(process.env.PORT_DB) : 5432,
});

export default pool;
