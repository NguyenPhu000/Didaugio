import prisma from "../../config/prismaClient.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(params = {}) {
  const page = Math.max(parseInt(params.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(params.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  return { page, limit };
}

function resolveDateRange(params = {}) {
  const createdAt = {};
  if (params.startDate) {
    createdAt.gte = new Date(`${params.startDate}T00:00:00.000Z`);
  }
  if (params.endDate) {
    createdAt.lte = new Date(`${params.endDate}T23:59:59.999Z`);
  }
  return Object.keys(createdAt).length ? createdAt : null;
}

function toDate(value) {
  return value ? new Date(value) : null;
}

function dateMatches(date, range) {
  if (!range || !date) return true;
  const value = toDate(date);
  if (!value || Number.isNaN(value.getTime())) return false;
  if (range.gte && value < range.gte) return false;
  if (range.lte && value > range.lte) return false;
  return true;
}

function getBusinessWhere(businessId) {
  return businessId ? { booking: { businessId } } : {};
}

function normalizePaymentRows(payments, range) {
  const rows = [];

  for (const payment of payments) {
    if (payment.paidAt && payment.status !== "unpaid" && dateMatches(payment.paidAt, range)) {
      rows.push({
        id: `payment-in-${payment.id}`,
        sourceId: payment.id,
        sourceType: "payment",
        direction: "in",
        type: "money_in",
        amount: payment.amount,
        status: payment.status,
        gateway: payment.paymentMethod,
        occurredAt: payment.paidAt || payment.createdAt,
        transactionRef: payment.transactionRef,
        transactionId: payment.transactionId,
        description: `Thanh toan booking ${payment.booking?.bookingCode || payment.bookingId}`,
        booking: payment.booking,
        business: payment.booking?.service?.place?.business || payment.booking?.business,
      });
    }

    if (
      Number(payment.refundAmount || 0) > 0 &&
      dateMatches(payment.refundedAt || payment.updatedAt, range)
    ) {
      rows.push({
        id: `payment-refund-${payment.id}`,
        sourceId: payment.id,
        sourceType: "payment",
        direction: "out",
        type: "refund",
        amount: payment.refundAmount || 0,
        status: payment.status,
        gateway: payment.paymentMethod,
        occurredAt: payment.refundedAt || payment.updatedAt,
        transactionRef: payment.transactionRef,
        transactionId: payment.transactionId,
        description: payment.refundReason || `Hoan tien booking ${payment.booking?.bookingCode || payment.bookingId}`,
        booking: payment.booking,
        business: payment.booking?.service?.place?.business || payment.booking?.business,
      });
    }
  }

  return rows;
}

function normalizePayoutRows(payouts, range) {
  return payouts
    .filter((payout) =>
      dateMatches(payout.transferredAt || payout.requestedAt || payout.createdAt, range),
    )
    .map((payout) => ({
      id: `payout-${payout.id}`,
      sourceId: payout.id,
      sourceType: "payout",
      direction: "out",
      type: "payout",
      amount: payout.amount,
      status: payout.status,
      gateway: payout.bankName || null,
      occurredAt: payout.transferredAt || payout.requestedAt || payout.createdAt,
      transactionRef: `PAYOUT_${payout.id}`,
      transactionId: null,
      description: payout.note || "Rut tien doi tac",
      booking: null,
      business: payout.business,
    }));
}

function normalizeLedgerRows(ledgers) {
  return ledgers.map((ledger) => ({
    id: `ledger-${ledger.id}`,
    sourceId: ledger.id,
    sourceType: "ledger",
    direction: ["REFUND", "WITHDRAW"].includes(ledger.type) ? "out" : "in",
    type: "ledger",
    ledgerType: ledger.type,
    amount: ledger.amount,
    status: "posted",
    gateway: null,
    occurredAt: ledger.createdAt,
    transactionRef: ledger.payoutId ? `PAYOUT_${ledger.payoutId}` : null,
    transactionId: null,
    description: ledger.description,
    booking: ledger.booking,
    business: ledger.booking?.service?.place?.business || ledger.booking?.business || null,
  }));
}

export async function getCashflowSummary({ businessId } = {}) {
  const businessScope = getBusinessWhere(businessId);
  const payoutScope = businessId ? { businessId } : {};
  const walletScope = businessId ? { businessId } : {};

  const [
    paidAgg,
    refundAgg,
    payoutTransferredAgg,
    payoutPendingAgg,
    wallets,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        ...businessScope,
        paidAt: { not: null },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...businessScope,
        refundAmount: { gt: 0 },
      },
      _sum: { refundAmount: true },
      _count: { id: true },
    }),
    prisma.payout.aggregate({
      where: {
        ...payoutScope,
        status: "transferred",
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payout.aggregate({
      where: {
        ...payoutScope,
        status: { in: ["pending", "approved"] },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.partnerWallet.findMany({
      where: walletScope,
      select: { balance: true, frozenBalance: true },
    }),
  ]);

  const walletBalance = wallets.reduce((sum, item) => sum + item.balance, 0);
  const frozenBalance = wallets.reduce((sum, item) => sum + item.frozenBalance, 0);
  const totalIn = paidAgg._sum.amount || 0;
  const totalRefunded = refundAgg._sum.refundAmount || 0;
  const totalPayouts = payoutTransferredAgg._sum.amount || 0;
  const pendingPayouts = payoutPendingAgg._sum.amount || 0;

  return {
    totalIn,
    totalRefunded,
    totalPayouts,
    pendingPayouts,
    walletBalance,
    frozenBalance,
    netCashflow: totalIn - totalRefunded - totalPayouts,
    counts: {
      paidPayments: paidAgg._count.id || 0,
      refunds: refundAgg._count.id || 0,
      transferredPayouts: payoutTransferredAgg._count.id || 0,
      pendingPayouts: payoutPendingAgg._count.id || 0,
    },
  };
}

export async function getCashflow({ businessId, ...params } = {}) {
  const { page, limit } = parsePagination(params);
  const dateRange = resolveDateRange(params);
  const type = params.type && params.type !== "all" ? params.type : null;
  const gateway = params.gateway && params.gateway !== "all"
    ? params.gateway.toUpperCase()
    : null;

  const businessScope = getBusinessWhere(businessId);
  const payoutScope = businessId ? { businessId } : {};
  const payoutIds = businessId
    ? (
        await prisma.payout.findMany({
          where: payoutScope,
          select: { id: true },
        })
      ).map((payout) => payout.id)
    : null;

  const [payments, payouts, ledgers] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ...businessScope,
        ...(gateway ? { paymentMethod: gateway } : {}),
      },
      include: {
        booking: {
          include: {
            business: { select: { id: true, businessName: true } },
            service: {
              include: {
                place: {
                  include: {
                    business: { select: { id: true, businessName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.payout.findMany({
      where: payoutScope,
      include: {
        business: { select: { id: true, businessName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.financialLedger.findMany({
      where: businessId
        ? {
            OR: [
              { booking: { businessId } },
              ...(payoutIds?.length ? [{ payoutId: { in: payoutIds } }] : []),
            ],
          }
        : {},
      include: {
        booking: {
          include: {
            business: { select: { id: true, businessName: true } },
            service: {
              include: {
                place: {
                  include: {
                    business: { select: { id: true, businessName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  let rows = [
    ...normalizePaymentRows(payments, dateRange),
    ...normalizePayoutRows(payouts, dateRange),
    ...normalizeLedgerRows(ledgers).filter((row) => dateMatches(row.occurredAt, dateRange)),
  ];

  if (type) {
    rows = rows.filter((row) => row.type === type || row.direction === type);
  }

  rows.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

  const total = rows.length;
  const start = (page - 1) * limit;

  return {
    rows: rows.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
