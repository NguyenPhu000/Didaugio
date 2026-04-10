import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config({ override: true });

const pool = new Pool({
  user: process.env.USER_DB,
  host: process.env.HOST_DB,
  database: process.env.NAME_DB,
  password: process.env.PASSWORD_DB,
  port: process.env.PORT_DB,
});

export default pool;
