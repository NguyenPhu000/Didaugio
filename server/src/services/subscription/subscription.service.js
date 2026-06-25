import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";
import { PAGINATION } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { buildQrUrl } from "../payment/sepay.service.js";
import { parseBankWebhook, verifyWebhookSignature } from "../payment/sepayWebhook.service.js";

const GRACE_PERIOD_DAYS = 3;
const RENEWAL_REMINDER_DAYS = 3;
const TX_REF_PREFIX = "DDG-INV";

// ─── Feature Lock Cache ──────────────────────────────────────────────────────
let lockedBusinessIdsCache = null;
let lockedCacheTimestamp = 0;
const LOCK_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTxRef(businessId, period) {
  const yyyymm = period.replace(/-/g, "").slice(0, 6);
  return `${TX_REF_PREFIX}-${businessId}-${yyyymm}`;
}

function buildPeriodDates(billingCycle = "monthly") {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

  if (billingCycle === "yearly") {
    const yearEnd = new Date(now.getFullYear() + 1, now.getMonth(), 0, 23, 59, 59);
    return { periodStart, periodEnd: yearEnd, dueDate: yearEnd };
  }

  return { periodStart, periodEnd, dueDate };
}

async function getNextInvoiceSequence(businessId, yyyymm) {
  const pattern = `${TX_REF_PREFIX}-${businessId}-${yyyymm}-%`;
  const last = await prisma.subscriptionInvoice.findFirst({
    where: { transactionRef: { startsWith: `${TX_REF_PREFIX}-${businessId}-${yyyymm}-` } },
    orderBy: { transactionRef: "desc" },
    select: { transactionRef: true },
  });

  if (!last) return 1;
  const parts = last.transactionRef.split("-");
  return (parseInt(parts[parts.length - 1], 10) || 0) + 1;
}

async function createInvoiceWithQr(subscription, amount, billingCycle, notes) {
  const { periodStart, periodEnd, dueDate } = buildPeriodDates(billingCycle);
  const yyyymm = `${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
  const sequence = await getNextInvoiceSequence(subscription.businessId, yyyymm);
  const transactionRef = `${formatTxRef(subscription.businessId, periodStart.toISOString())}-${String(sequence).padStart(3, "0")}`;

  let qrUrl = null;
  try {
    qrUrl = buildQrUrl({ amount, transactionRef });
  } catch (err) {
    logger.warn(`[subscription] Không tạo được QR cho ${transactionRef}: ${err.message}`);
  }

  return prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: transactionRef,
      amount,
      currency: "VND",
      status: "pending",
      paymentMethod: "sepay_qr",
      transactionRef,
      qrUrl,
      dueDate,
      periodStart,
      periodEnd,
      notes: notes || null,
    },
  });
}

// ─── Scheduler Functions ─────────────────────────────────────────────────────

export async function processRenewalReminders() {
  const now = new Date();
  const reminderDate = new Date(now);
  reminderDate.setDate(reminderDate.getDate() + RENEWAL_REMINDER_DAYS);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
      currentPeriodEnd: {
        gte: now,
        lte: reminderDate,
      },
      metadata: { path: ["reminderSent"], equals: false },
    },
    include: {
      plan: true,
      business: { select: { id: true, businessName: true, owner: { select: { email: true } } } },
    },
  });

  let processed = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    try {
      const amount = sub.billingCycle === "yearly" && sub.plan.priceYearly
        ? sub.plan.priceYearly
        : sub.plan.priceMonthly;

      const existingInvoice = await prisma.subscriptionInvoice.findFirst({
        where: {
          subscriptionId: sub.id,
          status: "pending",
          dueDate: { gte: now },
        },
      });

      if (!existingInvoice) {
        await createInvoiceWithQr(sub, amount, sub.billingCycle, "Gia hạn tự động");
      }

      const metadata = { ...(sub.metadata || {}), reminderSent: true };
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { metadata },
      });

      // TODO: Gửi email nhắc nhở qua notification service
      logger.info(`[subscription] Gửi nhắc gia hạn cho business#${sub.businessId}`);

      processed++;
    } catch (err) {
      errors++;
      logger.error(`[subscription] Lỗi nhắc gia hạn sub#${sub.id}`, err);
    }
  }

  return { processed, errors };
}

export async function processGracePeriodCheck() {
  const now = new Date();

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
      currentPeriodEnd: { lt: now },
      OR: [
        { gracePeriodEnd: null },
        { gracePeriodEnd: { gt: now } },
      ],
    },
    include: {
      business: { select: { id: true, businessName: true } },
    },
  });

  let processed = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    try {
      const hasPaidInvoice = await prisma.subscriptionInvoice.findFirst({
        where: {
          subscriptionId: sub.id,
          status: "paid",
          periodEnd: { gte: sub.currentPeriodEnd },
        },
      });

      if (hasPaidInvoice) continue;

      const graceEnd = new Date(now);
      graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "grace",
          gracePeriodEnd: graceEnd,
        },
      });

      // TODO: Gửi email cảnh báo grace period
      logger.info(`[subscription] business#${sub.businessId} chuyển sang grace`);

      processed++;
    } catch (err) {
      errors++;
      logger.error(`[subscription] Lỗi grace check sub#${sub.id}`, err);
    }
  }

  return { processed, errors };
}

export async function processPastDueCheck() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - GRACE_PERIOD_DAYS);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "grace",
      gracePeriodEnd: { lt: now },
    },
    include: {
      business: { select: { id: true, businessName: true } },
    },
  });

  let processed = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "past_due" },
      });

      invalidateFeatureLockCache();

      // TODO: Gửi email khóa dịch vụ
      logger.info(`[subscription] business#${sub.businessId} chuyển sang past_due`);

      processed++;
    } catch (err) {
      errors++;
      logger.error(`[subscription] Lỗi past_due check sub#${sub.id}`, err);
    }
  }

  return { processed, errors };
}

export async function getLockedBusinessIds() {
  const now = Date.now();
  if (lockedBusinessIdsCache && now - lockedCacheTimestamp < LOCK_CACHE_TTL_MS) {
    return lockedBusinessIdsCache;
  }

  const lockedStatuses = ["past_due", "canceled"];
  const graceExpired = await prisma.subscription.findMany({
    where: {
      status: "grace",
      gracePeriodEnd: { lt: new Date() },
    },
    select: { businessId: true },
  });

  const pastDueOrCanceled = await prisma.subscription.findMany({
    where: {
      status: { in: lockedStatuses },
    },
    select: { businessId: true },
  });

  const allLocked = new Set([
    ...graceExpired.map((s) => s.businessId),
    ...pastDueOrCanceled.map((s) => s.businessId),
  ]);

  lockedBusinessIdsCache = [...allLocked];
  lockedCacheTimestamp = now;
  return lockedBusinessIdsCache;
}

export function invalidateFeatureLockCache() {
  lockedBusinessIdsCache = null;
  lockedCacheTimestamp = 0;
}

export async function calculateAndSaveStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [active, grace, pastDue, canceled, allSubs] = await Promise.all([
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: "grace" } }),
    prisma.subscription.count({ where: { status: "past_due" } }),
    prisma.subscription.count({ where: { status: "canceled" } }),
    prisma.subscription.findMany({
      where: { status: { in: ["active", "grace"] } },
      include: { plan: { select: { priceMonthly: true, priceYearly: true } } },
    }),
  ]);

  const mrr = allSubs.reduce((sum, sub) => {
    if (sub.billingCycle === "yearly" && sub.plan.priceYearly) {
      return sum + Math.round(sub.plan.priceYearly / 12);
    }
    return sum + sub.plan.priceMonthly;
  }, 0);

  const arr = mrr * 12;

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCount = await prisma.subscription.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  const totalForChurn = active + grace + pastDue + canceled;
  const churnRate = totalForChurn > 0
    ? ((canceled / totalForChurn) * 100).toFixed(2)
    : 0;

  const paidInvoices = await prisma.subscriptionInvoice.aggregate({
    where: { status: "paid" },
    _sum: { amount: true },
  });
  const revenueTotal = paidInvoices._sum.amount || 0;

  const stats = await prisma.subscriptionStats.upsert({
    where: { snapshotDate: today },
    update: {
      mrr, arr, activeCount: active, trialCount: 0, graceCount: grace,
      pastDueCount: pastDue, canceledCount: canceled, churnRate, newCount, revenueTotal,
    },
    create: {
      snapshotDate: today, mrr, arr, activeCount: active, trialCount: 0, graceCount: grace,
      pastDueCount: pastDue, canceledCount: canceled, churnRate, newCount, revenueTotal,
    },
  });

  return stats;
}

// ─── Business Functions ──────────────────────────────────────────────────────

export async function checkFeatureLock(businessId) {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: { status: true, gracePeriodEnd: true },
  });

  if (!sub) {
    return { locked: false, reason: null };
  }

  if (sub.status === "past_due" || sub.status === "canceled") {
    return { locked: true, reason: sub.status };
  }

  if (sub.status === "grace" && sub.gracePeriodEnd && sub.gracePeriodEnd < new Date()) {
    return { locked: true, reason: "grace_expired" };
  }

  return { locked: false, reason: null };
}

export async function getCurrentSubscription(businessId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: {
      plan: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, invoiceNumber: true, amount: true, status: true,
          dueDate: true, paidAt: true, createdAt: true, qrUrl: true,
        },
      },
    },
  });

  if (!subscription) {
    // Business chưa có subscription → tạo mặc định với plan Basic
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { slug: "basic", isActive: true },
    });

    if (!basicPlan) {
      throw new ServiceError("Không tìm thấy plan cơ bản", 404, ERROR_CODES.NOT_FOUND);
    }

    const { periodStart, periodEnd, dueDate } = buildPeriodDates("monthly");
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const created = await prisma.subscription.create({
      data: {
        businessId,
        planId: basicPlan.id,
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEndsAt: trialEnd,
        metadata: { autoRenew: true, reminderSent: false },
      },
      include: { plan: true, invoices: true },
    });

    return created;
  }

  return subscription;
}

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function calculateProration(businessId, targetPlanId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiệp chưa có subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  const targetPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: targetPlanId },
  });

  if (!targetPlan || !targetPlan.isActive) {
    throw new ServiceError("Plan đích không tồn tại hoặc đã ngừng hoạt động", 404, ERROR_CODES.NOT_FOUND);
  }

  if (subscription.planId === targetPlanId) {
    throw new ServiceError("Bạn đang sử dụng plan này rồi", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (targetPlan.sortOrder <= subscription.plan.sortOrder) {
    throw new ServiceError("Chỉ được nâng cấp lên plan cao hơn", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const totalDays = Math.max(
    1,
    Math.ceil((periodEnd - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24)),
  );
  const remainingDays = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

  const currentPrice = subscription.billingCycle === "yearly" && subscription.plan.priceYearly
    ? subscription.plan.priceYearly
    : subscription.plan.priceMonthly;
  const targetPrice = subscription.billingCycle === "yearly" && targetPlan.priceYearly
    ? targetPlan.priceYearly
    : targetPlan.priceMonthly;

  const unusedCredit = Math.round((currentPrice / totalDays) * remainingDays);
  const prorationAmount = Math.round((targetPrice / totalDays) * remainingDays);
  const chargeAmount = Math.max(0, prorationAmount - unusedCredit);

  return {
    currentPlan: { id: subscription.plan.id, name: subscription.plan.name, price: currentPrice },
    targetPlan: { id: targetPlan.id, name: targetPlan.name, price: targetPrice },
    remainingDays,
    totalDays,
    unusedCredit,
    prorationAmount,
    chargeAmount,
  };
}

export async function upgrade(businessId, targetPlanId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiệp chưa có subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  if (["past_due", "canceled"].includes(subscription.status)) {
    throw new ServiceError(
      "Subscription đang bị khóa. Vui lòng thanh toán trước khi nâng cấp",
      400,
      "SUBSCRIPTION_LOCKED",
    );
  }

  const targetPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: targetPlanId },
  });

  if (!targetPlan || !targetPlan.isActive) {
    throw new ServiceError("Plan đích không tồn tại hoặc đã ngừng hoạt động", 404, ERROR_CODES.NOT_FOUND);
  }

  if (subscription.planId === targetPlanId) {
    throw new ServiceError("Bạn đang sử dụng plan này rồi", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (targetPlan.sortOrder <= subscription.plan.sortOrder) {
    throw new ServiceError("Chỉ được nâng cấp lên plan cao hơn", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const totalDays = Math.max(
    1,
    Math.ceil((periodEnd - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24)),
  );
  const remainingDays = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

  const currentPrice = subscription.billingCycle === "yearly" && subscription.plan.priceYearly
    ? subscription.plan.priceYearly
    : subscription.plan.priceMonthly;
  const targetPrice = subscription.billingCycle === "yearly" && targetPlan.priceYearly
    ? targetPlan.priceYearly
    : targetPlan.priceMonthly;

  const unusedCredit = Math.round((currentPrice / totalDays) * remainingDays);
  const prorationAmount = Math.round((targetPrice / totalDays) * remainingDays);
  const chargeAmount = Math.max(0, prorationAmount - unusedCredit);

  const { periodStart, periodEnd: pe, dueDate } = buildPeriodDates(subscription.billingCycle);
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sequence = await getNextInvoiceSequence(businessId, yyyymm);
  const transactionRef = `${TX_REF_PREFIX}-${businessId}-${yyyymm}-${String(sequence).padStart(3, "0")}`;

  let qrUrl = null;
  try {
    qrUrl = buildQrUrl({ amount: chargeAmount, transactionRef });
  } catch (err) {
    logger.warn(`[subscription] Không tạo được QR cho upgrade: ${err.message}`);
  }

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: transactionRef,
      amount: chargeAmount,
      currency: "VND",
      status: "pending",
      paymentMethod: "sepay_qr",
      transactionRef,
      qrUrl,
      dueDate,
      periodStart: now,
      periodEnd: pe,
      notes: `Nâng cấp từ ${subscription.plan.name} → ${targetPlan.name}`,
      metadata: {
        type: "upgrade",
        previousPlanId: subscription.planId,
        targetPlanId,
      },
    },
  });

  return { invoice: { id: invoice.id, transactionRef, qrUrl, amount: chargeAmount } };
}

export async function getInvoices(businessId, query = {}) {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    select: { id: true },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiệp chưa có subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  const where = { subscriptionId: subscription.id };
  if (query.status && query.status !== "all") {
    where.status = query.status;
  }

  const [data, total] = await Promise.all([
    prisma.subscriptionInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionInvoice.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Webhook Processing ──────────────────────────────────────────────────────

export async function processSubscriptionWebhook(body, headers = {}) {
  // Verify HMAC-SHA256 signature
  const signature = headers["x-sepay-signature"] || "";
  const timestamp = headers["x-sepay-timestamp"] || "";
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);

  const sigResult = verifyWebhookSignature(rawBody, signature, timestamp);
  if (!sigResult.valid) {
    logger.warn(`[subscription-webhook] Signature verification failed: ${sigResult.error}`);
    return { success: false, message: "Chữ ký không hợp lệ" };
  }

  const parsed = parseBankWebhook(body);

  if (!parsed.valid) {
    return { success: false, message: parsed.error };
  }

  const { code, sepayTransactionId, transferAmount, content } = parsed.data;

  if (!code.startsWith(TX_REF_PREFIX)) {
    return { success: false, message: "Không phải mã subscription" };
  }

  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { transactionRef: code },
    include: { subscription: true },
  });

  if (!invoice) {
    return { success: false, message: `Không tìm thấy hóa đơn ${code}` };
  }

  if (invoice.status === "paid") {
    return { success: true, message: "Hóa đơn đã được xử lý trước đó" };
  }

  if (invoice.amount !== transferAmount) {
    logger.warn(
      `[subscription-webhook] Số tiền không khớp: invoice=${invoice.amount}, received=${transferAmount}, ref=${code}`,
    );
  }

  const now = new Date();
  const sub = invoice.subscription;
  const invoiceMeta = invoice.metadata || {};
  const isUpgrade = invoiceMeta.type === "upgrade" && invoiceMeta.targetPlanId;

  await prisma.$transaction(async (tx) => {
    await tx.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: { status: "paid", paidAt: now, notes: `SePay TX: ${sepayTransactionId}` },
    });

    const newPeriodEnd = new Date(sub.currentPeriodEnd);
    if (sub.billingCycle === "yearly") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    const updateData = {
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
      gracePeriodEnd: null,
      metadata: { ...(sub.metadata || {}), reminderSent: false },
    };

    // Upgrade: change planId after payment confirmed
    if (isUpgrade) {
      updateData.planId = invoiceMeta.targetPlanId;
      updateData.metadata.previousPlanId = invoiceMeta.previousPlanId;
    }

    await tx.subscription.update({
      where: { id: sub.id },
      data: updateData,
    });
  });

  invalidateFeatureLockCache();
  logger.info(`[subscription-webhook] Hóa đơn ${code} đã thanh toán thành công${isUpgrade ? " (upgrade)" : ""}`);

  return { success: true, message: "Thanh toán thành công" };
}

// ─── Admin Functions ─────────────────────────────────────────────────────────

export async function getAllSubscriptions(adminQuery = {}) {
  const page = parseInt(adminQuery.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(adminQuery.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const where = {};
  if (adminQuery.status && adminQuery.status !== "all") {
    where.status = adminQuery.status;
  }
  if (adminQuery.planId) {
    where.planId = parseInt(adminQuery.planId);
  }
  if (adminQuery.search) {
    where.business = {
      OR: [
        { businessName: { contains: adminQuery.search, mode: "insensitive" } },
        { owner: { email: { contains: adminQuery.search, mode: "insensitive" } } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, slug: true, priceMonthly: true } },
        business: {
          select: {
            id: true, businessName: true, status: true,
            owner: { select: { id: true, email: true, username: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSubStats() {
  const latest = await prisma.subscriptionStats.findFirst({
    orderBy: { snapshotDate: "desc" },
  });

  const plansWithCount = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, slug: true, priceMonthly: true, sortOrder: true,
      _count: { select: { subscriptions: { where: { status: { in: ["active", "grace"] } } } } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return {
    snapshot: latest || null,
    plans: plansWithCount.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMonthly: p.priceMonthly,
      activeSubscriptions: p._count.subscriptions,
    })),
  };
}

export async function adminUpdateStatus(subscriptionId, data) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new ServiceError("Subscription không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const updateData = { status: data.status };
  if (data.status === "canceled") {
    updateData.canceledAt = new Date();
    updateData.cancelReason = data.cancelReason || "Admin hủy";
  }
  if (data.status === "active") {
    updateData.gracePeriodEnd = null;
    updateData.canceledAt = null;
    updateData.cancelReason = null;
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
    include: { plan: true, business: { select: { id: true, businessName: true } } },
  });

  if (data.status === "canceled") {
    try {
      const reason = data.cancelReason || "Admin hủy";
      const business = await prisma.business.findUnique({
        where: { id: updated.businessId },
        select: { ownerId: true },
      });
      if (business?.ownerId) {
        await prisma.notificationGlobal.create({
          data: {
            title: "Subscription đã bị hủy",
            body: `Gói ${updated.plan.name} của doanh nghiệp "${updated.business.businessName}" đã bị hủy. Lý do: ${reason}`,
            data: { type: "subscription_canceled", subscriptionId: updated.id, reason },
            status: "published",
            recipients: {
              create: { userId: business.ownerId, businessId: updated.businessId },
            },
          },
        });
      }
    } catch (err) {
      logger.error(`[subscription] Lỗi gửi thông báo hủy sub#${updated.id}`, err);
    }
  }

  invalidateFeatureLockCache();
  return updated;
}

export async function adminCreatePlan(data) {
  const existing = await prisma.subscriptionPlan.findFirst({
    where: { OR: [{ name: data.name }, { slug: data.slug }] },
  });

  if (existing) {
    throw new ServiceError("Plan với tên hoặc slug này đã tồn tại", 400, ERROR_CODES.EXISTED);
  }

  return prisma.subscriptionPlan.create({ data });
}

export async function adminUpdatePlan(planId, data) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!plan) {
    throw new ServiceError("Plan không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  if (data.name || data.slug) {
    const conflict = await prisma.subscriptionPlan.findFirst({
      where: {
        id: { not: planId },
        OR: [
          ...(data.name ? [{ name: data.name }] : []),
          ...(data.slug ? [{ slug: data.slug }] : []),
        ],
      },
    });
    if (conflict) {
      throw new ServiceError("Plan với tên hoặc slug này đã tồn tại", 400, ERROR_CODES.EXISTED);
    }
  }

  return prisma.subscriptionPlan.update({ where: { id: planId }, data });
}

export async function getAdminPlans() {
  return prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });
}

export async function cancelSubscription(businessId, reason) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiệp chưa có subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  if (subscription.status === "canceled") {
    throw new ServiceError("Subscription đã bị hủy trước đó", 400, "ALREADY_CANCELED");
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
      cancelReason: reason || "User hủy",
      metadata: { ...(subscription.metadata || {}), canceledByUser: true },
    },
    include: { plan: true },
  });

  logger.info(`[subscription] Business ${businessId} canceled subscription: ${reason || "User hủy"}`);

  return updated;
}
