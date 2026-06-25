import cron from "node-cron";
import logger from "../config/logger.js";
import { calculateAndSaveStats } from "../services/subscription/subscription.service.js";

const CRON_EXPRESSION = process.env.SUBSCRIPTION_STATS_CRON || "0 0 * * *"; // Midnight daily

/**
 * MRR/Stats Calculation
 * ────────────────────────────────────────────────────────────────────────────
 * Chạy mỗi ngày lúc midnight.
 * Tính MRR, ARR, churn rate, active/grace/past_due/canceled counts.
 * Lưu snapshot vào bảng subscription_stats.
 *
 * Tắt: SUBSCRIPTION_STATS_CRON=off
 */
export function startSubscriptionStatsScheduler() {
  if (CRON_EXPRESSION === "off" || CRON_EXPRESSION === "false" || CRON_EXPRESSION === "0") {
    logger.info("[scheduler] subscription stats: tắt (SUBSCRIPTION_STATS_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_EXPRESSION)) {
    logger.error(`[scheduler] subscription stats: cron expression không hợp lệ: ${CRON_EXPRESSION}`);
    return () => {};
  }

  const task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const stats = await calculateAndSaveStats();
      logger.info(
        `[scheduler] subscription stats: MRR=${stats.mrr}đ, ARR=${stats.arr}đ, ` +
        `active=${stats.activeCount}, churn=${stats.churnRate}%`,
      );
    } catch (err) {
      logger.error("[scheduler] subscription stats failed", err);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
  });

  logger.info(`[scheduler] subscription stats: ${CRON_EXPRESSION} (${process.env.TZ || "Asia/Ho_Chi_Minh"})`);
  return () => task.stop();
}
