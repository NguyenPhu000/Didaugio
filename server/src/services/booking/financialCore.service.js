import prisma from "../../config/prismaClient.js";

/**
 * Process payment ledger: split commission, freeze business earnings.
 * Called INSIDE an existing Prisma $transaction (tx is passed in).
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} bookingId
 * @param {number} totalAmount
 * @param {number} commissionRate
 * @param {number} businessId
 * @returns {Promise<{ commissionAmount: number, netAmount: number }>}
 */
export async function processPaymentLedger(tx, bookingId, totalAmount, commissionRate, businessId) {
  const commissionAmount = Math.floor((totalAmount * commissionRate) / 100);
  const netAmount = totalAmount - commissionAmount;

  await tx.booking.update({
    where: { id: bookingId },
    data: {
      adminEarned: commissionAmount,
      businessEarned: netAmount,
      commissionRate,
    },
  });

  await tx.partnerWallet.upsert({
    where: { businessId },
    update: { frozenBalance: { increment: netAmount } },
    create: { businessId, balance: 0, frozenBalance: netAmount },
  });

  await tx.financialLedger.create({
    data: {
      bookingId,
      type: "COMMISSION",
      amount: commissionAmount,
      description: `Hoa hep platform cho booking #${bookingId}`,
    },
  });

  await tx.financialLedger.create({
    data: {
      bookingId,
      type: "EARNING",
      amount: netAmount,
      description: `Doanh thu doi tac cho booking #${bookingId}`,
    },
  });

  return { commissionAmount, netAmount };
}

/**
 * Settle completed booking: move funds from frozen to available balance.
 * Called INSIDE an existing Prisma $transaction (tx is passed in).
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} bookingId
 * @param {number} businessId
 * @param {number} businessEarned
 */
export async function settleCompletedLedger(tx, bookingId, businessId, businessEarned) {
  await tx.partnerWallet.update({
    where: { businessId },
    data: {
      frozenBalance: { decrement: businessEarned },
      balance: { increment: businessEarned },
    },
  });

  await tx.financialLedger.create({
    data: {
      bookingId,
      type: "SETTLE",
      amount: businessEarned,
      description: `Chuyen tu dong sang kha dung cho booking #${bookingId}`,
    },
  });
}

/**
 * Refund ledger: decrement frozen balance for cancelled/rejected paid bookings.
 * Called INSIDE an existing Prisma $transaction (tx is passed in).
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} bookingId
 * @param {number} businessId
 * @param {number} businessEarned
 */
export async function refundLedger(tx, bookingId, businessId, businessEarned) {
  await tx.partnerWallet.update({
    where: { businessId },
    data: {
      frozenBalance: { decrement: businessEarned },
    },
  });

  await tx.financialLedger.create({
    data: {
      bookingId,
      type: "REFUND",
      amount: businessEarned,
      description: `Hoan tra cho booking #${bookingId}`,
    },
  });
}

/**
 * Get available balance for a business partner wallet.
 *
 * @param {number} businessId
 * @returns {Promise<{ balance: number, frozenBalance: number, total: number }>}
 */
export async function getAvailableBalance(businessId) {
  const wallet = await prisma.partnerWallet.findUnique({
    where: { businessId },
    select: { balance: true, frozenBalance: true },
  });

  if (!wallet) {
    return { balance: 0, frozenBalance: 0, total: 0 };
  }

  return {
    balance: wallet.balance,
    frozenBalance: wallet.frozenBalance,
    total: wallet.balance + wallet.frozenBalance,
  };
}
