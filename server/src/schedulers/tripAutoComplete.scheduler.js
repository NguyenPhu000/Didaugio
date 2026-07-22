import logger from "../config/logger.js";
import prisma from "../config/prismaClient.js";

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const MIN_INTERVAL_MS = 5 * 60 * 1000;

function resolveIntervalMs() {
  const raw = process.env.TRIP_AUTO_COMPLETE_INTERVAL_MS;
  if (raw === "0" || raw === "false" || raw === "off") return 0;
  if (raw == null || raw === "") return DEFAULT_INTERVAL_MS;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_INTERVAL_MS;
  if (n === 0) return 0;
  return Math.max(n, MIN_INTERVAL_MS);
}

async function completeExpiredTrips() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const result = await prisma.tripPlan.updateMany({
    where: {
      status: { in: ["planned", "active", "paused"] },
      endDate: { lt: now },
    },
    data: { status: "completed" },
  });

  return result.count;
}

export function startTripAutoCompleteScheduler() {
  const intervalMs = resolveIntervalMs();
  if (intervalMs <= 0) {
    logger.info(
      "[scheduler] trip auto-complete: tắt (TRIP_AUTO_COMPLETE_INTERVAL_MS=0|false|off)",
    );
    return () => {};
  }

  const tick = async () => {
    try {
      const count = await completeExpiredTrips();
      if (count > 0) {
        logger.info(`[scheduler] autoCompleteTrips: ${count} trip(s) marked completed`);
      }
    } catch (err) {
      logger.error("[scheduler] autoCompleteTrips failed", err);
    }
  };

  void tick();
  const handle = setInterval(tick, intervalMs);
  logger.info(
    `[scheduler] trip auto-complete: mỗi ${intervalMs}ms (TRIP_AUTO_COMPLETE_INTERVAL_MS)`,
  );
  return () => clearInterval(handle);
}
