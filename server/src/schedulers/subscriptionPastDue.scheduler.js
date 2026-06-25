import cron from "node-cron";
import logger from "../config/logger.js";
import { processPastDueCheck } from "../services/subscription/subscription.service.js";

const CRON_EXPRESSION = process.env.SUBSCRIPTION_PAST_DUE_CRON || "0 10 * * *"; // 10:00 AM daily

/**
 * Past Due Check (T+3)
 * ────────────────────────────────────────────────────────────────────────────
 * Chạy mỗi ngày lúc 10:00 AM.
 * Tìm subscriptions trong grace > 3 ngày chưa paid → chuyển "past_due" → gửi email khóa dịch vụ.
 *
 * Tắt: SUBSCRIPTION_PAST_DUE_CRON=off
 */
export function startSubscriptionPastDueScheduler() {
  if (CRON_EXPRESSION === "off" || CRON_EXPRESSION === "false" || CRON_EXPRESSION === "0") {
    logger.info("[scheduler] subscription past due: tắt (SUBSCRIPTION_PAST_DUE_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`[scheduler] subscription past due: cron expression không hợp lệ: ${CRON_EXPRESSION}`);
    return () => {};
  }

  const task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const { processed, errors } = await processPastDueCheck();
      if (processed > 0 || errors > 0) {
        logger.info(
          `[scheduler] subscription past due: ${processed} processed, ${errors} errors`,
        );
      }
    } catch (err) {
      logger.error("[scheduler] subscription past due failed", err);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  });

  logger.info(`[scheduler] subscription past due: ${CRON_EXPRESSION} (${process.env.TZ || "Asia/Ho_Chi_Minh"})`);
  return () => task.stop();
}
