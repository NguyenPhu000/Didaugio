import cron from "node-cron";
import logger from "../config/logger.js";
import {
  getLockedBusinessIds,
  invalidateFeatureLockCache,
  processScheduledDowngrades,
  processRenewalReminders,
  processGracePeriodCheck,
  processPastDueCheck,
  calculateAndSaveStats,
} from "../services/subscription/subscription.service.js";

const CRON_HOURLY = process.env.SUBSCRIPTION_FEATURE_LOCK_CRON || "0 * * * *"; // Every hour
const CRON_DAILY_STATS = process.env.SUBSCRIPTION_STATS_CRON || "0 1 * * *"; // 01:00 daily
const TZ = process.env.TZ || "Asia/Ho_Chi_Minh";

/**
 * Main Subscription Lifecycle Scheduler
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs every hour:
 *   1. processScheduledDowngrades  — apply pending plan downgrades
 *   2. processRenewalReminders     — create upcoming renewal invoices + flag
 *   3. processGracePeriodCheck     — move active→grace when period ends unpaid
 *   4. processPastDueCheck         — move grace→past_due when grace expires
 *   5. Invalidate + refresh feature-lock cache
 *
 * Disable: SUBSCRIPTION_FEATURE_LOCK_CRON=off
 */
export function startSubscriptionFeatureLockScheduler() {
  if (CRON_HOURLY === "off" || CRON_HOURLY === "false" || CRON_HOURLY === "0") {
    logger.info("[scheduler] subscription lifecycle: disabled (SUBSCRIPTION_FEATURE_LOCK_CRON=off)");
    return () => {};
  }

  if (!cron.validate(CRON_HOURLY)) {
    logger.error(`[scheduler] subscription lifecycle: invalid cron expression: ${CRON_HOURLY}`);
    return () => {};
  }

  // ── Hourly: full lifecycle run ──────────────────────────────────────────────
  const lifecycleTask = cron.schedule(CRON_HOURLY, async () => {
    try {
      // Step 1: Apply scheduled downgrades
      const downgraded = await processScheduledDowngrades();
      if (downgraded.processed > 0 || downgraded.errors > 0) {
        logger.info(`[scheduler] downgrade: processed=${downgraded.processed}, errors=${downgraded.errors}`);
      }

      // Step 2: Create renewal reminders for expiring-soon subscriptions
      const reminders = await processRenewalReminders();
      if (reminders.processed > 0 || reminders.errors > 0) {
        logger.info(`[scheduler] renewal reminders: processed=${reminders.processed}, errors=${reminders.errors}`);
      }

      // Step 3: Move active → grace (period ended, not yet paid)
      const grace = await processGracePeriodCheck();
      if (grace.processed > 0 || grace.errors > 0) {
        logger.info(`[scheduler] grace check: processed=${grace.processed}, errors=${grace.errors}`);
      }

      // Step 4: Move grace → past_due (grace window expired)
      const pastDue = await processPastDueCheck();
      if (pastDue.processed > 0 || pastDue.errors > 0) {
        logger.info(`[scheduler] past_due check: processed=${pastDue.processed}, errors=${pastDue.errors}`);
      }

      // Step 5: Refresh feature-lock cache
      invalidateFeatureLockCache();
      const lockedIds = await getLockedBusinessIds();
      if (lockedIds.length > 0) {
        logger.info(`[scheduler] feature lock: ${lockedIds.length} business(es) locked`);
      }
    } catch (err) {
      logger.error("[scheduler] subscription lifecycle failed", err);
    }
  }, {
    scheduled: true,
    timezone: TZ,
  });

  logger.info(`[scheduler] subscription lifecycle: ${CRON_HOURLY} (${TZ})`);

  // ── Daily stats snapshot ────────────────────────────────────────────────────
  let statsTask = null;
  if (cron.validate(CRON_DAILY_STATS)) {
    statsTask = cron.schedule(CRON_DAILY_STATS, async () => {
      try {
        const stats = await calculateAndSaveStats();
        logger.info(`[scheduler] subscription stats: snapshot saved for ${stats.snapshotDate}`);
      } catch (err) {
        logger.error("[scheduler] subscription stats snapshot failed", err);
      }
    }, {
      scheduled: true,
      timezone: TZ,
    });
    logger.info(`[scheduler] subscription stats: ${CRON_DAILY_STATS} (${TZ})`);
  }

  return () => {
    lifecycleTask.stop();
    statsTask?.stop();
  };
}
