import "dotenv/config";
import { createClient } from "redis";
import logger from "./logger.js";

let client = null;

export function buildRedisClientOptions(url, tls = false) {
  return tls ? { url, socket: { tls: true } } : { url };
}

export function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  if (client) return client;

  client = createClient(
    buildRedisClientOptions(redisUrl, process.env.REDIS_TLS === "true"),
  );
  client.on("error", (error) => logger.error("[Redis] Client error", { error: error.message }));
  client.connect().catch((error) => {
    logger.error("[Redis] Initial connection failed", { error: error.message });
  });
  return client;
}

export async function closeRedisClient() {
  if (client?.isOpen) await client.quit();
  client = null;
}
