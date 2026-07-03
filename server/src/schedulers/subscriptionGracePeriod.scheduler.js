import cron from "node-cron";
import logger from "../config/logger.js";
import { processGracePeriodCheck } from "../services/subscription/subscription.service.js";

const CRON_EXPRESSION = process.env.SUBSCRIPTION_GRACE_CRON || "0 9 * * *"; // 9:00 AM daily

/**
 * Grace Period Check (T+0)
 * ────────────────────────────────────────────────────────────────────────────
 * Chạy mỗi ngày lúc 9:00 AM.
 * Tìm subscriptions đã hết hạn nhưng chưa paid → chuyển status "grace" → gửi email cảnh báo.
 *
 * Tắt: SUBSCRIPTION_GRACE_CRON=off
 */
export function startSubscriptionGracePeriodScheduler() {
  if (CRON_EXPRESSION === "off" || CRON_EXPRESSION === "false" || CRON_EXPRESSION === "0") {
    logger.info("[scheduler] subscription grace period: tắt (SUBSCRIPTION_GRACE_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`[scheduler] subscription grace period: cron expression không hợp lệ: ${CRON_EXPRESSION}`);
    return () => {};
  }

  const task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const { processed, errors } = await processGracePeriodCheck();
      if (processed > 0 || errors > 0) {
        logger.info(
          `[scheduler] subscription grace period: ${processed} processed, ${errors} errors`,
        );
      }
    } catch (err) {
      logger.error("[scheduler] subscription grace period failed", err);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  });

  logger.info(`[scheduler] subscription grace period: ${CRON_EXPRESSION} (${process.env.TZ || "Asia/Ho_Chi_Minh"})`);
  return () => task.stop();
}
