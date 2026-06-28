import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";
import { PAGINATION } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { buildQrUrl } from "../payment/sepay.service.js";
import { parseBankWebhook, verifyWebhookSignature } from "../payment/sepayWebhook.service.js";
import {
  buildScheduledDowngradeMetadata,
  clearScheduledDowngrade,
  getPlanChangeDirection,
  getScheduledDowngrade,
  getSubscriptionPrice,
} from "./subscriptionPlanChange.service.js";
import { recordSubscriptionRevenue } from "./subscriptionRevenue.service.js";

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

function buildPeriodDates(billingCycle = "monthly", referenceDate = null) {
  const base = referenceDate || new Date();
  const periodStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const periodEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);
  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

  if (billingCycle === "yearly") {
    const yearEnd = new Date(base.getFullYear() + 1, base.getMonth(), 0, 23, 59, 59);
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

async function createInvoiceWithQr(subscription, amount, billingCycle, notes, referenceDate = null) {
  const { periodStart, periodEnd, dueDate } = buildPeriodDates(billingCycle, referenceDate);
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
          status: { in: ["pending", "paid"] },
          periodStart: { gte: sub.currentPeriodEnd },
        },
      });

      if (!existingInvoice) {
        // Dùng periodEnd hiện tại làm reference để tạo invoice cho kỳ tiếp theo
        await createInvoiceWithQr(sub, amount, sub.billingCycle, "Gia hạn tự động", sub.currentPeriodEnd);
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

  const lockedStatuses = ["past_due", "canceled", "paused"];
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
  // Dùng cache để tránh query DB mỗi request
  const lockedIds = await getLockedBusinessIds();
  if (lockedIds.includes(businessId)) {
    // Query chi tiết để trả reason
    const sub = await prisma.subscription.findUnique({
      where: { businessId },
      select: { status: true, gracePeriodEnd: true },
    });
    if (!sub) return { locked: false, reason: null };
    if (["past_due", "canceled", "paused"].includes(sub.status)) {
      return { locked: true, reason: sub.status };
    }
    if (sub.status === "grace" && sub.gracePeriodEnd && sub.gracePeriodEnd < new Date()) {
      return { locked: true, reason: "grace_expired" };
    }
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

  const direction = getPlanChangeDirection(subscription.plan, targetPlan);
  if (direction === "same") {
    throw new ServiceError("Chỉ được nâng cấp lên plan cao hơn", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const totalDays = Math.max(
    1,
    Math.ceil((periodEnd - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24)),
  );
  const remainingDays = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

  const currentPrice = getSubscriptionPrice(subscription.plan, subscription.billingCycle);
  const targetPrice = getSubscriptionPrice(targetPlan, subscription.billingCycle);

  const unusedCredit = Math.round((currentPrice / totalDays) * remainingDays);
  const prorationAmount = Math.round((targetPrice / totalDays) * remainingDays);
  const chargeAmount = Math.max(0, prorationAmount - unusedCredit);

  return {
    currentPlan: { id: subscription.plan.id, name: subscription.plan.name, price: currentPrice },
    targetPlan: { id: targetPlan.id, name: targetPlan.name, price: targetPrice },
    direction,
    effectiveAt: direction === "downgrade" ? subscription.currentPeriodEnd : now,
    remainingDays,
    totalDays,
    unusedCredit,
    prorationAmount: direction === "downgrade" ? 0 : prorationAmount,
    chargeAmount: direction === "downgrade" ? 0 : chargeAmount,
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

  if (getPlanChangeDirection(subscription.plan, targetPlan) !== "upgrade") {
    throw new ServiceError("Chỉ được nâng cấp lên plan cao hơn", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Kiểm tra invoice upgrade pending trùng lặp (chống race condition khi user click nhiều lần)
  const existingUpgradeInvoice = await prisma.subscriptionInvoice.findFirst({
    where: {
      subscriptionId: subscription.id,
      status: "pending",
      metadata: { path: ["type"], equals: "upgrade" },
    },
  });
  if (existingUpgradeInvoice) {
    return {
      invoice: {
        id: existingUpgradeInvoice.id,
        transactionRef: existingUpgradeInvoice.transactionRef,
        qrUrl: existingUpgradeInvoice.qrUrl,
        amount: existingUpgradeInvoice.amount,
      },
    };
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const totalDays = Math.max(
    1,
    Math.ceil((periodEnd - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24)),
  );
  const remainingDays = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));

  const currentPrice = getSubscriptionPrice(subscription.plan, subscription.billingCycle);
  const targetPrice = getSubscriptionPrice(targetPlan, subscription.billingCycle);

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

export async function scheduleDowngrade(businessId, targetPlanId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiá»‡p chÆ°a cÃ³ subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  if (["past_due", "canceled", "paused"].includes(subscription.status)) {
    throw new ServiceError(
      "Subscription Ä‘ang bá»‹ khÃ³a. Vui lÃ²ng kÃ­ch hoáº¡t láº¡i trÆ°á»›c khi Ä‘á»•i gÃ³i",
      400,
      "SUBSCRIPTION_LOCKED",
    );
  }

  const targetPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: targetPlanId },
  });

  if (!targetPlan || !targetPlan.isActive) {
    throw new ServiceError("Plan Ä‘Ã­ch khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ ngá»«ng hoáº¡t Ä‘á»™ng", 404, ERROR_CODES.NOT_FOUND);
  }

  if (getPlanChangeDirection(subscription.plan, targetPlan) !== "downgrade") {
    throw new ServiceError("Háº¡ gÃ³i chá»‰ Ã¡p dá»¥ng cho plan tháº¥p hÆ¡n gÃ³i hiá»‡n táº¡i", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const metadata = buildScheduledDowngradeMetadata(subscription.metadata || {}, {
    currentPlanId: subscription.planId,
    targetPlan,
    effectiveAt: subscription.currentPeriodEnd,
  });

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { metadata },
    include: { plan: true },
  });

  return {
    subscription: updated,
    scheduledDowngrade: getScheduledDowngrade(updated.metadata),
  };
}

export async function cancelScheduledDowngrade(businessId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
  });

  if (!subscription) {
    throw new ServiceError("Doanh nghiá»‡p chÆ°a cÃ³ subscription", 404, ERROR_CODES.NOT_FOUND);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { metadata: clearScheduledDowngrade(subscription.metadata || {}) },
    include: { plan: true },
  });

  return { subscription: updated, scheduledDowngrade: null };
}

export async function processScheduledDowngrades(now = new Date()) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "grace"] },
    },
    select: { id: true, metadata: true },
  });
  const due = subscriptions.filter((sub) => {
    const scheduled = getScheduledDowngrade(sub.metadata);
    if (!scheduled?.effectiveAt) return false;
    return new Date(scheduled.effectiveAt) <= now;
  });

  let processed = 0;
  let errors = 0;

  for (const sub of due) {
    try {
      const scheduled = getScheduledDowngrade(sub.metadata);
      if (!scheduled?.targetPlanId) continue;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: Number(scheduled.targetPlanId),
          metadata: clearScheduledDowngrade(sub.metadata || {}),
        },
      });
      processed += 1;
    } catch (err) {
      errors += 1;
      logger.error(`[subscription] Lá»—i Ã¡p dá»¥ng downgrade sub#${sub.id}`, err);
    }
  }

  if (processed > 0) {
    invalidateFeatureLockCache();
  }

  return { processed, errors };
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

export async function processSubscriptionWebhook(body, headers = {}, rawBody = null) {
  // Verify HMAC-SHA256 signature
  const signature = headers["x-sepay-signature"] || "";
  const timestamp = headers["x-sepay-timestamp"] || "";
  const bodyForSignature = rawBody || (typeof body === "string" ? body : JSON.stringify(body));

  const sigResult = verifyWebhookSignature(bodyForSignature, signature, timestamp);
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
    return {
      success: false,
      message: `Số tiền không khớp. Hóa đơn: ${invoice.amount.toLocaleString("vi-VN")}đ, nhận: ${transferAmount.toLocaleString("vi-VN")}đ`,
    };
  }

  const now = new Date();
  const sub = invoice.subscription;
  const invoiceMeta = invoice.metadata || {};
  const isUpgrade = invoiceMeta.type === "upgrade" && invoiceMeta.targetPlanId;

  await prisma.$transaction(async (tx) => {
    // Kiểm tra lại status trong transaction để tránh xử lý trùng (race condition)
    const [freshInvoice] = await tx.$queryRaw`
      SELECT id, status FROM subscription_invoices WHERE id = ${invoice.id} FOR UPDATE
    `;
    if (!freshInvoice || freshInvoice.status === "paid") {
      return; // Đã được xử lý bởi request khác
    }

    await tx.subscriptionInvoice.update({
      where: { id: invoice.id, status: "pending" },
      data: { status: "paid", paidAt: now, notes: `SePay TX: ${sepayTransactionId}` },
    });
    await recordSubscriptionRevenue(tx, invoice, "sepay");

    let updateData;

    if (isUpgrade) {
      // Upgrade: tính period mới từ bây giờ (không kéo dài period cũ)
      const newPeriodEnd = new Date(now);
      if (sub.billingCycle === "yearly") {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }
      updateData = {
        status: "active",
        planId: invoiceMeta.targetPlanId,
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        gracePeriodEnd: null,
        metadata: {
          ...clearScheduledDowngrade(sub.metadata || {}),
          reminderSent: false,
          previousPlanId: invoiceMeta.previousPlanId,
        },
      };
    } else {
      // Renewal: kéo dài từ periodEnd hiện tại
      const newPeriodEnd = new Date(sub.currentPeriodEnd);
      if (sub.billingCycle === "yearly") {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }
      updateData = {
        status: "active",
        currentPeriodStart: sub.currentPeriodEnd,
        currentPeriodEnd: newPeriodEnd,
        gracePeriodEnd: null,
        metadata: { ...(sub.metadata || {}), reminderSent: false },
      };
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
  // Hỗ trợ filter theo plan slug (frontend gửi plan: "basic", "plus", "pro")
  if (adminQuery.plan && adminQuery.plan !== "all" && !adminQuery.planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug: adminQuery.plan },
      select: { id: true },
    });
    if (plan) {
      where.planId = plan.id;
    }
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
  if (data.status === "paused") {
    updateData.canceledAt = null;
    updateData.cancelReason = data.cancelReason || "Admin tạm ngưng";
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

  const [updated] = await prisma.$transaction([
    // Cancel the subscription
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelReason: reason || "User hủy",
        metadata: { ...(subscription.metadata || {}), canceledByUser: true },
      },
      include: { plan: true },
    }),
    // Cancel all pending invoices for this subscription
    prisma.subscriptionInvoice.updateMany({
      where: {
        subscriptionId: subscription.id,
        status: "pending",
      },
      data: {
        status: "canceled",
        notes: "Hủy do subscription bị hủy",
      },
    }),
  ]);

  logger.info(`[subscription] Business ${businessId} canceled subscription: ${reason || "User hủy"}`);

  return updated;
}

/**
 * Pay a subscription invoice from the business's PartnerWallet balance
 */
export async function payInvoiceFromWallet(businessId, invoiceId) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: { subscription: true },
  });

  if (!invoice) {
    throw new ServiceError("Hóa đơn không tồn tại", 404, "INVOICE_NOT_FOUND");
  }

  if (invoice.subscription.businessId !== businessId) {
    throw new ServiceError("Hóa đơn không thuộc doanh nghiệp này", 403, "FORBIDDEN");
  }

  if (invoice.status === "paid") {
    throw new ServiceError("Hóa đơn đã được thanh toán", 400, "ALREADY_PAID");
  }

  if (invoice.status === "canceled") {
    throw new ServiceError("Hóa đơn đã bị hủy", 400, "INVOICE_CANCELED");
  }

  return prisma.$transaction(async (tx) => {
    // Lock the wallet row
    const [wallet] = await tx.$queryRaw`
      SELECT * FROM partner_wallets WHERE business_id = ${businessId} FOR UPDATE
    `;

    if (!wallet) {
      throw new ServiceError("Ví đối tác không tồn tại", 404, "WALLET_NOT_FOUND");
    }

    const balance = Number(wallet.balance);
    if (balance < invoice.amount) {
      throw new ServiceError(
        `Số dư ví không đủ. Cần: ${invoice.amount.toLocaleString("vi-VN")}đ, Hiện có: ${balance.toLocaleString("vi-VN")}đ`,
        400,
        "INSUFFICIENT_WALLET_BALANCE",
      );
    }

    // Deduct from wallet
    await tx.partnerWallet.update({
      where: { businessId },
      data: { balance: { decrement: invoice.amount } },
    });

    // Mark invoice as paid
    const now = new Date();
    const sub = invoice.subscription;
    const invoiceMeta = invoice.metadata || {};
    const isUpgrade = invoiceMeta.type === "upgrade" && invoiceMeta.targetPlanId;
    const newPeriodEnd = new Date(isUpgrade ? now : sub.currentPeriodEnd);
    if (sub.billingCycle === "yearly") {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    await tx.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: { status: "paid", paidAt: now, notes: "Thanh toán từ ví đối tác" },
    });

    await recordSubscriptionRevenue(tx, invoice, "partner_wallet");

    // Extend subscription
    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status: "active",
        ...(isUpgrade ? { planId: invoiceMeta.targetPlanId } : {}),
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        gracePeriodEnd: null,
        metadata: isUpgrade
          ? {
              ...clearScheduledDowngrade(sub.metadata || {}),
              reminderSent: false,
              previousPlanId: invoiceMeta.previousPlanId,
            }
          : { ...(sub.metadata || {}), reminderSent: false },
      },
    });

    // Create ledger entry
    await tx.financialLedger.create({
      data: {
        type: "SUBSCRIPTION_PAYMENT",
        amount: invoice.amount,
        description: `Thanh toán subscription từ ví: ${invoice.invoiceNumber}`,
      },
    });

    invalidateFeatureLockCache();
    logger.info(`[subscription] Business ${businessId} paid invoice ${invoice.invoiceNumber} from wallet`);

    return { success: true, deducted: invoice.amount };
  });
}
