import logger from "../config/logger.js";
import prisma from "../config/prismaClient.js";
import { expirePendingBookings } from "../services/booking/booking.service.js";

/** Mặc định 5 phút — đồng bộ opportunistic expire trong booking.service */
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 30_000;
const PENDING_BOOKING_EXPIRE_LOCK_ID = 1001;

function resolveIntervalMs() {
  const raw = process.env.BOOKING_PENDING_EXPIRE_INTERVAL_MS;
  if (raw === "0" || raw === "false" || raw === "off") return 0;
  if (raw == null || raw === "") return DEFAULT_INTERVAL_MS;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_INTERVAL_MS;
  if (n === 0) return 0;
  return Math.max(n, MIN_INTERVAL_MS);
}

/**
 * Chạy định kỳ expire booking PENDING quá hạn (bổ sung cho expire gắn vào các thao tác đọc/ghi).
 * Tắt: BOOKING_PENDING_EXPIRE_INTERVAL_MS=0
 */
export function startPendingBookingExpireScheduler() {
  const intervalMs = resolveIntervalMs();
  if (intervalMs <= 0) {
    logger.info(
      "[scheduler] pending booking expire: tắt (BOOKING_PENDING_EXPIRE_INTERVAL_MS=0|false|off)",
    );
    return () => {};
  }

  const tick = async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const lockRows = await tx.$queryRaw`
          SELECT pg_try_advisory_xact_lock(${PENDING_BOOKING_EXPIRE_LOCK_ID}) AS locked
        `;
        const locked = Boolean(lockRows?.[0]?.locked);
        if (!locked) {
          return { count: 0, skipped: true };
        }

        return expirePendingBookings({ db: tx });
      });

      if (result.skipped) return;

      const { count } = result;
      if (count > 0) {
        logger.info(`[scheduler] expirePendingBookings: ${count} booking(s)`);
      }
    } catch (err) {
      logger.error("[scheduler] expirePendingBookings failed", err);
    }
  };

  void tick();
  const handle = setInterval(tick, intervalMs);
  logger.info(
    `[scheduler] pending booking expire: mỗi ${intervalMs}ms (BOOKING_PENDING_EXPIRE_INTERVAL_MS)`,
  );
  return () => clearInterval(handle);
}
