import logger from "../../config/logger.js";

export const BOOKING_ACTION = {
  APPROVE: "approve",
  REJECT: "reject",
  RESCHEDULE: "reschedule",
  QUICK_APPROVE: "quick_approve",
  QUICK_REJECT: "quick_reject",
  AUTO_APPROVE: "auto_approve",
  AUTO_APPROVE_FAILED: "auto_approve_failed",
};

/**
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ bookingId: number; action: import("@prisma/client").BookingAction; actorUserId?: number | null; metadata?: object }} payload
 */
export async function appendBookingActionLog(tx, payload) {
  const {
    bookingId,
    action,
    actorUserId = null,
    metadata = undefined,
  } = payload;
  try {
    return await tx.bookingActionLog.create({
      data: {
        bookingId,
        action,
        actorUserId: actorUserId ?? undefined,
        metadata: metadata ?? undefined,
      },
    });
  } catch (e) {
    logger.error("appendBookingActionLog failed", {
      bookingId,
      action,
      err: e,
    });
    throw e;
  }
}
