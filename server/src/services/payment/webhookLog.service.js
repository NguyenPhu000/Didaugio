import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";

/**
 * Log an incoming webhook BEFORE signature verification (paymentId may be null).
 * Returns the webhook log record so callers can update it later via transactionRef.
 */
export async function logWebhook({ gateway, payload, signature }) {
  try {
    const record = await prisma.paymentWebhookLog.create({
      data: {
        gateway,
        payload,
        signature: signature || null,
        verified: false,
        processed: false,
      },
    });
    return record;
  } catch (error) {
    logger.error("Failed to log webhook", { gateway, error: error.message });
    return null;
  }
}

/**
 * Mark a webhook log as processed by its transactionRef.
 * First finds the Payment by transactionRef, then updates the webhook log.
 */
export async function markProcessed({ transactionRef, webhookLogId }) {
  try {
    const payment = transactionRef
      ? await prisma.payment.findUnique({
          where: { transactionRef },
          select: { id: true },
        })
      : null;

    await prisma.paymentWebhookLog.update({
      where: { id: webhookLogId },
      data: {
        processed: true,
        verified: true,
        paymentId: payment ? payment.id : null,
      },
    });
  } catch (error) {
    logger.error("Failed to mark webhook processed", {
      webhookLogId,
      transactionRef,
      error: error.message,
    });
  }
}

/**
 * Mark a webhook log as errored by its transactionRef.
 * Finds the Payment by transactionRef first, then updates the webhook log.
 */
export async function markError({ transactionRef, webhookLogId, errorMsg }) {
  try {
    const payment = transactionRef
      ? await prisma.payment.findUnique({
          where: { transactionRef },
          select: { id: true },
        })
      : null;

    await prisma.paymentWebhookLog.update({
      where: { id: webhookLogId },
      data: {
        processed: false,
        error: errorMsg || null,
        paymentId: payment ? payment.id : null,
      },
    });
  } catch (error) {
    logger.error("Failed to mark webhook error", {
      webhookLogId,
      transactionRef,
      error: error.message,
    });
  }
}

/**
 * Get recent webhook logs for a gateway (for debugging/monitoring).
 */
export async function getRecentLogs({ gateway, limit = 50 }) {
  return prisma.paymentWebhookLog.findMany({
    where: { gateway },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
