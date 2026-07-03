import cron from "node-cron";
import logger from "../config/logger.js";
import {
  getLockedBusinessIds,
  invalidateFeatureLockCache,
  processScheduledDowngrades,
} from "../services/subscription/subscription.service.js";

const CRON_EXPRESSION = process.env.SUBSCRIPTION_FEATURE_LOCK_CRON || "0 * * * *"; // Every hour

/**
 * Feature Lock Check
 * ────────────────────────────────────────────────────────────────────────────
 * Chạy mỗi giờ.
 * Làm mới cache danh sách businessIds bị khóa features (past_due, canceled, grace expired).
 * Middleware sẽ đọc cache này để chặn truy cập.
 *
 * Tắt: SUBSCRIPTION_FEATURE_LOCK_CRON=off
 */
export function startSubscriptionFeatureLockScheduler() {
  if (CRON_EXPRESSION === "off" || CRON_EXPRESSION === "false" || CRON_EXPRESSION === "0") {
    logger.info("[scheduler] subscription feature lock: tắt (SUBSCRIPTION_FEATURE_LOCK_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`[scheduler] subscription feature lock: cron expression không hợp lệ: ${CRON_EXPRESSION}`);
    return () => {};
  }

  const task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const downgraded = await processScheduledDowngrades();
      if (downgraded.processed > 0 || downgraded.errors > 0) {
        logger.info(
          `[scheduler] subscription downgrade: processed=${downgraded.processed}, errors=${downgraded.errors}`,
        );
      }

      invalidateFeatureLockCache();
      const lockedIds = await getLockedBusinessIds();
      if (lockedIds.length > 0) {
        logger.info(`[scheduler] subscription feature lock: ${lockedIds.length} business(es) bị khóa`);
      }
    } catch (err) {
      logger.error("[scheduler] subscription feature lock failed", err);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  });

  logger.info(`[scheduler] subscription feature lock: ${CRON_EXPRESSION} (${process.env.TZ || "Asia/Ho_Chi_Minh"})`);
  return () => task.stop();
}
