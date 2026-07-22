import prisma from "../../config/prismaClient.js";
import { createRefundTransition } from "../payment/refundTransition.service.js";

const transition = createRefundTransition({ prisma });

export async function createCancelledRefundIntentInTransaction(tx, booking, { actorUserId, reason, idempotencyKey }) {
  const payment = await tx.payment.findUnique({ where: { bookingId: booking.id } });
  if (!payment) return null;
  const [receipts, refunds] = await Promise.all([
    tx.paymentReceipt.aggregate({ where: { paymentId: payment.id, status: "succeeded" }, _sum: { amount: true } }),
    tx.refundAttempt.aggregate({ where: { paymentId: payment.id, status: "succeeded" }, _sum: { amount: true } }),
  ]);
  const amount = Number(receipts._sum.amount || 0) - Number(refunds._sum.amount || 0);
  if (amount <= 0) return null;
  return transition.createRefundIntentInTransaction(tx, {
    paymentId: payment.id, amount, currency: payment.currency, source: "manual", actorUserId, reason, idempotencyKey,
    metadata: { channel: "booking_outcome", bookingId: booking.id },
  });
}

export const finalizeCancelledRefund = (attempt) => attempt ? transition.succeedRefundAttempt({ refundAttemptId: attempt.id }) : null;
