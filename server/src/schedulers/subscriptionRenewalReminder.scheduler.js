import cron from "node-cron";
import logger from "../config/logger.js";
import { processRenewalReminders } from "../services/subscription/subscription.service.js";

const CRON_EXPRESSION = process.env.SUBSCRIPTION_RENEWAL_CRON || "0 8 * * *"; // 8:00 AM daily

/**
 * Subscription Renewal Reminder (T-3)
 * ────────────────────────────────────────────────────────────────────────────
 * Chạy mỗi ngày lúc 8:00 AM.
 * Tìm subscriptions sắp hết hạn trong 3 ngày → tạo invoice + QR → gửi email nhắc nhở.
 *
 * Tắt: SUBSCRIPTION_RENEWAL_CRON=off
 */
export function startSubscriptionRenewalReminderScheduler() {
  if (CRON_EXPRESSION === "off" || CRON_EXPRESSION === "false" || CRON_EXPRESSION === "0") {
    logger.info("[scheduler] subscription renewal reminder: tắt (SUBSCRIPTION_RENOWAL_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`[scheduler] subscription renewal reminder: cron expression không hợp lệ: ${CRON_EXPRESSION}`);
    return () => {};
  }

  const task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const { processed, errors } = await processRenewalReminders();
      if (processed > 0 || errors > 0) {
        logger.info(
          `[scheduler] subscription renewal reminder: ${processed} processed, ${errors} errors`,
        );
      }
    } catch (err) {
      logger.error("[scheduler] subscription renewal reminder failed", err);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  });

  logger.info(`[scheduler] subscription renewal reminder: ${CRON_EXPRESSION} (${process.env.TZ || "Asia/Ho_Chi_Minh"})`);
  return () => task.stop();
}
