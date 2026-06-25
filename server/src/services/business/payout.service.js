import prisma from "../../config/prismaClient.js";
import ServiceError from "../../utils/serviceError.js";
import { getAvailableBalance } from "../booking/financialCore.service.js";

/**
 * Get earnings summary for a business
 */
export const getEarningsSummary = async (businessId) => {
  // Get total revenue and commission from completed bookings
  const revenueAgg = await prisma.booking.aggregate({
    where: {
      businessId,
      status: "completed",
    },
    _sum: { finalPrice: true, commissionAmount: true },
    _count: true,
  });

  // Get total refunds from payments of completed bookings
  const refundAgg = await prisma.payment.aggregate({
    where: {
      booking: { businessId, status: "completed" },
      refundAmount: { gt: 0 },
    },
    _sum: { refundAmount: true },
  });

  const grossRevenue = revenueAgg._sum.finalPrice || 0;
  const totalRefunds = refundAgg._sum.refundAmount || 0;
  const totalRevenue = grossRevenue - totalRefunds;
  const totalCommission = revenueAgg._sum.commissionAmount || 0;
  const netEarnings = totalRevenue - totalCommission;

  // Get available balance from PartnerWallet
  const walletBalance = await getAvailableBalance(businessId);

  // Get payout history
  const payouts = await prisma.payout.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalPaidOut = payouts
    .filter((p) => p.status === "transferred")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payouts
    .filter((p) => p.status === "pending" || p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0);

  const availableBalance = walletBalance.balance - totalPaidOut - totalPending;

  // Monthly breakdown (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: "completed",
      completedAt: { gte: sixMonthsAgo },
    },
    select: {
      finalPrice: true,
      commissionAmount: true,
      completedAt: true,
    },
  });

  const monthlyData = {};
  monthlyBookings.forEach((b) => {
    const month = b.completedAt.toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, commission: 0, count: 0 };
    }
    monthlyData[month].revenue += b.finalPrice;
    monthlyData[month].commission += b.commissionAmount;
    monthlyData[month].count += 1;
  });

  const monthlyEarnings = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      commission: data.commission,
      net: data.revenue - data.commission,
      bookings: data.count,
    }));

  return {
    totalRevenue,
    totalCommission,
    netEarnings,
    availableBalance: Math.max(0, availableBalance),
    totalPaidOut,
    totalPending,
    completedBookings: revenueAgg._count,
    monthlyEarnings,
    recentPayouts: payouts.slice(0, 10),
  };
};

/**
 * Business requests a payout
 */
export const requestPayout = async (businessId, data) => {
  const { amount, bankName, bankAccount, bankOwner, note } = data;

  if (!amount || amount <= 0) {
    throw new ServiceError("Số tiền rút phải lớn hơn 0", 400, "INVALID_AMOUNT");
  }

  // Check available balance from PartnerWallet
  const walletBalance = await getAvailableBalance(businessId);
  if (amount > walletBalance.balance) {
    throw new ServiceError(
      `Số dư khả dụng không đủ. Hiện tại: ${walletBalance.balance.toLocaleString("vi-VN")}đ`,
      400,
      "INSUFFICIENT_BALANCE",
    );
  }

  // Check for existing pending payouts
  const existingPending = await prisma.payout.findFirst({
    where: {
      businessId,
      status: { in: ["pending", "approved"] },
    },
  });

  if (existingPending) {
    throw new ServiceError(
      "Bạn đã có yêu cầu rút tiền đang chờ xử lý",
      400,
      "PENDING_PAYOUT_EXISTS",
    );
  }

  const payout = await prisma.payout.create({
    data: {
      businessId,
      amount,
      bankName: bankName || null,
      bankAccount: bankAccount || null,
      bankOwner: bankOwner || null,
      note: note || null,
      status: "pending",
    },
  });

  return payout;
};

/**
 * Get payout history for a business
 */
export const getPayoutHistory = async (businessId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const { status } = query;
  const skip = (page - 1) * limit;

  const where = { businessId };
  if (status) where.status = status;

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.count({ where }),
  ]);

  return {
    payouts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Admin Operations ───────────────────────────────────────────

/**
 * Admin: get all payout requests
 */
export const getAllPayouts = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const { status, businessId } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (businessId) where.businessId = parseInt(businessId);

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            owner: {
              select: { id: true, email: true },
            },
          },
        },
      },
    }),
    prisma.payout.count({ where }),
  ]);

  return {
    payouts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Admin: approve a payout request
 */
export const approvePayout = async (payoutId, reviewerId) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new ServiceError("Yêu cầu rút tiền không tồn tại", 404, "NOT_FOUND");
  }

  if (payout.status !== "pending") {
    throw new ServiceError(
      "Chỉ có thể duyệt yêu cầu đang chờ xử lý",
      400,
      "INVALID_STATUS",
    );
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    },
  });
};

/**
 * Admin: mark payout as transferred (money sent)
 */
export const markTransferred = async (payoutId, reviewerId) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new ServiceError("Yêu cầu rút tiền không tồn tại", 404, "NOT_FOUND");
  }

  if (payout.status !== "approved") {
    throw new ServiceError(
      "Chỉ có thể xác nhận chuyển khoản cho yêu cầu đã duyệt",
      400,
      "INVALID_STATUS",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "transferred",
        transferredAt: new Date(),
      },
    });

    await tx.financialLedger.create({
      data: {
        payoutId: updated.id,
        type: "WITHDRAW",
        amount: updated.amount,
        description: `Manual payout transfer #${updated.id}`,
      },
    });

    return updated;
  });
};

/**
 * Admin: reject a payout request
 */
export const rejectPayout = async (payoutId, reviewerId, rejectReason) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new ServiceError("Yêu cầu rút tiền không tồn tại", 404, "NOT_FOUND");
  }

  if (payout.status !== "pending") {
    throw new ServiceError(
      "Chỉ có thể từ chối yêu cầu đang chờ xử lý",
      400,
      "INVALID_STATUS",
    );
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectReason: rejectReason || null,
    },
  });
};

/**
 * Admin: get payout stats overview
 */
export const getAdminPayoutStats = async () => {
  // 1. Tổng chờ duyệt (pending hoặc approved)
  const pendingAgg = await prisma.payout.aggregate({
    where: {
      status: { in: ["pending", "approved"] },
    },
    _sum: { amount: true },
    _count: true,
  });

  // 2. Đã xử lý hôm nay (transferred hôm nay)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const processedTodayAgg = await prisma.payout.aggregate({
    where: {
      status: "transferred",
      transferredAt: { gte: startOfToday },
    },
    _sum: { amount: true },
    _count: true,
  });

  // 3. Thất bại (rejected)
  const failedCount = await prisma.payout.count({
    where: {
      status: "rejected",
    },
  });

  // 4. Thời gian xử lý trung bình (avgProcessingTime)
  // Lấy các payout đã hoàn thành (transferred)
  const transferredPayouts = await prisma.payout.findMany({
    where: {
      status: "transferred",
      transferredAt: { not: null },
    },
    select: {
      createdAt: true,
      transferredAt: true,
    },
    take: 100, // Lấy mẫu 100 giao dịch gần nhất
    orderBy: { transferredAt: "desc" },
  });

  let avgProcessingTime = "—";
  if (transferredPayouts.length > 0) {
    const totalDiff = transferredPayouts.reduce((sum, p) => {
      const diff = new Date(p.transferredAt) - new Date(p.createdAt);
      return sum + diff;
    }, 0);
    const avgMs = totalDiff / transferredPayouts.length;
    const avgHours = avgMs / (1000 * 60 * 60);

    if (avgHours < 1) {
      avgProcessingTime = `${Math.round(avgHours * 60)} phút`;
    } else if (avgHours < 24) {
      avgProcessingTime = `${avgHours.toFixed(1)} giờ`;
    } else {
      avgProcessingTime = `${(avgHours / 24).toFixed(1)} ngày`;
    }
  }

  return {
    totalPendingAmount: pendingAgg._sum.amount || 0,
    pendingCount: pendingAgg._count || 0,
    processedTodayAmount: processedTodayAgg._sum.amount || 0,
    processedTodayCount: processedTodayAgg._count || 0,
    failedCount,
    avgProcessingTime,
  };
};

export default {
  getEarningsSummary,
  requestPayout,
  getPayoutHistory,
  getAllPayouts,
  approvePayout,
  markTransferred,
  rejectPayout,
  getAdminPayoutStats,
};
