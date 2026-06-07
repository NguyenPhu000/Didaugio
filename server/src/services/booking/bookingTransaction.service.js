import prisma from "../../config/prismaClient.js";

/**
 * Create a ledger entry when a booking is completed.
 * This tracks platform commission separately from the booking record
 * so admins can reconcile without relying on payout calculations.
 */
export async function createBookingTransaction(tx, params) {
  const {
    bookingId,
    businessId,
    originalPrice,
    finalPrice,
    discountAmount,
    commissionRate,
    commissionAmount,
    source,
  } = params;

  const netAmount = finalPrice - commissionAmount;

  return tx.bookingTransaction.create({
    data: {
      bookingId,
      businessId,
      originalPrice,
      finalPrice,
      discountAmount: discountAmount || 0,
      commissionRate,
      commissionAmount,
      netAmount,
      source: source || "booking_complete",
    },
  });
}

/**
 * Get platform commission summary for admin dashboard.
 */
export async function getPlatformCommissionSummary(params = {}) {
  const { fromDate, toDate, businessId } = params;

  const where = {};
  if (businessId) where.businessId = parseInt(businessId);
  if (fromDate || toDate) {
    where.completedAt = {};
    if (fromDate) where.completedAt.gte = new Date(fromDate);
    if (toDate) where.completedAt.lte = new Date(toDate);
  }

  const [total, byBusiness] = await Promise.all([
    prisma.bookingTransaction.aggregate({
      where,
      _sum: {
        commissionAmount: true,
        netAmount: true,
        finalPrice: true,
        originalPrice: true,
        discountAmount: true,
      },
      _count: { id: true },
    }),
    prisma.bookingTransaction.groupBy({
      by: ["businessId"],
      where,
      _sum: {
        commissionAmount: true,
        netAmount: true,
      },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: "desc" } },
    }),
  ]);

  return {
    summary: {
      totalTransactions: total._count.id,
      totalRevenue: total._sum.originalPrice || 0,
      totalDiscount: total._sum.discountAmount || 0,
      totalNetRevenue: total._sum.finalPrice || 0,
      totalCommission: total._sum.commissionAmount || 0,
      totalNetToBusiness: total._sum.netAmount || 0,
    },
    byBusiness: byBusiness.map((b) => ({
      businessId: b.businessId,
      transactions: b._count.id,
      commissionAmount: b._sum.commissionAmount || 0,
      netAmount: b._sum.netAmount || 0,
    })),
  };
}
