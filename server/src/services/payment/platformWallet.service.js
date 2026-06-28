import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get or create the platform wallet (singleton)
 */
export async function getPlatformWallet() {
  let wallet = await prisma.platformWallet.findFirst();
  if (!wallet) {
    wallet = await prisma.platformWallet.create({ data: { balance: 0 } });
  }
  return wallet;
}

/**
 * Get platform wallet summary with breakdown
 */
export async function getPlatformWalletSummary() {
  const wallet = await getPlatformWallet();

  // Total commission from ledger
  const commissionAgg = await prisma.financialLedger.aggregate({
    where: { type: "COMMISSION" },
    _sum: { amount: true },
  });

  // Total payouts to businesses
  const payoutAgg = await prisma.payout.aggregate({
    where: { status: "transferred" },
    _sum: { amount: true },
  });

  // Total refunds processed
  const refundAgg = await prisma.financialLedger.aggregate({
    where: { type: "REFUND" },
    _sum: { amount: true },
  });

  return {
    balance: wallet.balance,
    totalEarned: wallet.totalEarned,
    totalPaidOut: wallet.totalPaidOut,
    commissionTotal: commissionAgg._sum.amount || 0,
    payoutTotal: payoutAgg._sum.amount || 0,
    refundTotal: refundAgg._sum.amount || 0,
  };
}
