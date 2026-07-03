import prisma from "../../config/prismaClient.js";

/**
 * Resolve date range from query params.
 * Returns { start, end } Date objects.
 */
const resolveDateRange = (params = {}) => {
  const now = new Date();
  const end = params.endDate ? new Date(`${params.endDate}T23:59:59.999Z`) : now;
  const start = params.startDate
    ? new Date(`${params.startDate}T00:00:00.000Z`)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
};

/**
 * Calculate the previous period of the same length for change % comparison.
 */
const resolvePreviousRange = (start, end) => {
  const duration = end.getTime() - start.getTime();
  return {
    prevStart: new Date(start.getTime() - duration),
    prevEnd: new Date(start.getTime() - 1),
  };
};

/**
 * Build base where clause scoped to a business and date range.
 */
const baseWhere = (businessId, start, end) => ({
  businessId,
  completedAt: { gte: start, lte: end },
});

/**
 * Overview stats: GMV, net revenue, platform fees, refunds + change %.
 */
export const getOverview = async (businessId, params) => {
  const { start, end } = resolveDateRange(params);
  const { prevStart, prevEnd } = resolvePreviousRange(start, end);

  const [current, previous, refundAgg] = await Promise.all([
    prisma.bookingTransaction.aggregate({
      where: baseWhere(businessId, start, end),
      _sum: { finalPrice: true, commissionAmount: true, netAmount: true },
    }),
    prisma.bookingTransaction.aggregate({
      where: baseWhere(businessId, prevStart, prevEnd),
      _sum: { finalPrice: true, commissionAmount: true, netAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { businessId },
        refundAmount: { gt: 0 },
        refundedAt: { gte: start, lte: end },
      },
      _sum: { refundAmount: true },
    }),
  ]);

  const currentRefund = refundAgg._sum.refundAmount || 0;

  const prevRefundAgg = await prisma.payment.aggregate({
    where: {
      booking: { businessId },
      refundAmount: { gt: 0 },
      refundedAt: { gte: prevStart, lte: prevEnd },
    },
    _sum: { refundAmount: true },
  });
  const previousRefund = prevRefundAgg._sum.refundAmount || 0;

  const calcChange = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
  };

  const gmv = current._sum.finalPrice || 0;
  const netRevenue = current._sum.netAmount || 0;
  const platformFees = current._sum.commissionAmount || 0;

  return {
    gmv,
    netRevenue,
    platformFees,
    refundAmount: currentRefund,
    gmvChange: calcChange(gmv, previous._sum.finalPrice || 0),
    netRevenueChange: calcChange(netRevenue, previous._sum.netAmount || 0),
    platformFeesChange: calcChange(platformFees, previous._sum.commissionAmount || 0),
    refundAmountChange: calcChange(currentRefund, previousRefund),
  };
};

/**
 * Timeline data for charts (daily/weekly/monthly).
 */
export const getTimeline = async (businessId, params) => {
  const { start, end } = resolveDateRange(params);
  const groupBy = params.groupBy || "day";

  const transactions = await prisma.bookingTransaction.findMany({
    where: baseWhere(businessId, start, end),
    select: {
      finalPrice: true,
      netAmount: true,
      commissionAmount: true,
      completedAt: true,
    },
    orderBy: { completedAt: "asc" },
  });

  // Group by the requested interval
  const grouped = {};
  for (const tx of transactions) {
    const d = new Date(tx.completedAt);
    let key;
    if (groupBy === "week") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else if (groupBy === "month") {
      key = d.toISOString().slice(0, 7);
    } else {
      key = d.toISOString().slice(0, 10);
    }

    if (!grouped[key]) {
      grouped[key] = { grossRevenue: 0, netRevenue: 0 };
    }
    grouped[key].grossRevenue += tx.finalPrice;
    grouped[key].netRevenue += tx.netAmount;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      grossRevenue: data.grossRevenue,
      netRevenue: data.netRevenue,
    }));
};

/**
 * Revenue breakdown by place.
 */
export const getByPlace = async (businessId, params) => {
  const { start, end } = resolveDateRange(params);

  const transactions = await prisma.bookingTransaction.findMany({
    where: baseWhere(businessId, start, end),
    select: {
      finalPrice: true,
      booking: {
        select: {
          service: {
            select: {
              place: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  const placeMap = {};
  for (const tx of transactions) {
    const place = tx.booking?.service?.place;
    if (!place) continue;
    const pid = place.id;
    if (!placeMap[pid]) {
      placeMap[pid] = { placeId: pid, placeName: place.name, totalRevenue: 0, bookingCount: 0 };
    }
    placeMap[pid].totalRevenue += tx.finalPrice;
    placeMap[pid].bookingCount += 1;
  }

  return Object.values(placeMap)
    .map((item) => ({
      ...item,
      avgOrderValue: item.bookingCount > 0 ? Math.round(item.totalRevenue / item.bookingCount) : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Paginated transaction list.
 */
export const getTransactions = async (businessId, params) => {
  const { start, end } = resolveDateRange(params);
  const page = parseInt(params.page) || 1;
  const limit = Math.min(parseInt(params.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const where = baseWhere(businessId, start, end);

  const [transactions, total] = await Promise.all([
    prisma.bookingTransaction.findMany({
      where,
      select: {
        id: true,
        finalPrice: true,
        netAmount: true,
        commissionAmount: true,
        completedAt: true,
        booking: {
          select: {
            bookingCode: true,
            status: true,
            service: {
              select: {
                place: { select: { name: true } },
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { completedAt: "desc" },
    }),
    prisma.bookingTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((tx) => ({
      id: tx.id,
      createdAt: tx.completedAt,
      placeName: tx.booking?.service?.place?.name || "N/A",
      amount: tx.finalPrice,
      netAmount: tx.netAmount,
      commission: tx.commissionAmount,
      status: tx.booking?.status || "unknown",
      bookingCode: tx.booking?.bookingCode,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
