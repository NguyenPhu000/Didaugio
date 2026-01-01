import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();
const pool = new Pool({
  user: process.env.USER_DB,
  host: process.env.HOST_DB,
  database: process.env.NAME_DB,
  password: process.env.PASSWORD_DB,
  port: process.env.PORT_DB,
});

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log("Connected to the database successfully.");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

export default pool;
