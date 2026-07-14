import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const USABLE_SUBSCRIPTION_STATUSES = new Set(["active", "grace"]);

export function normalizePlanFeatures(plan = {}) {
  if (!Array.isArray(plan.features)) return [];
  return [...new Set(plan.features.filter(Boolean).map((feature) => String(feature)))];
}

export function isSubscriptionUsable(subscription, now = new Date()) {
  if (!subscription || !USABLE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return false;
  }

  if (
    subscription.status === "grace" &&
    subscription.gracePeriodEnd &&
    new Date(subscription.gracePeriodEnd) < now
  ) {
    return false;
  }

  return true;
}

export function buildSubscriptionEntitlements(subscription) {
  const plan = subscription?.plan || null;
  const features = normalizePlanFeatures(plan);
  const featureSet = new Set(features);
  const usable = isSubscriptionUsable(subscription);

  return {
    usable,
    locked: !usable,
    status: subscription?.status || "missing",
    plan: plan
      ? {
          id: plan.id,
          slug: plan.slug,
          name: plan.name,
          sortOrder: plan.sortOrder,
        }
      : null,
    features,
    featureMap: features.reduce((acc, feature) => {
      acc[feature] = true;
      return acc;
    }, {}),
    limits: {
      maxPlaces: plan?.maxPlaces ?? 0,
      maxServices: plan?.maxServices ?? 0,
      maxBookings: plan?.maxBookings ?? 0,
      maxStaff: plan?.maxStaff ?? 0,
    },
    canUse: {
      analytics: usable && featureSet.has("analytics"),
      heatmap: usable && featureSet.has("heatmap"),
      apiAccess: usable && featureSet.has("api_access"),
      prioritySupport: usable && featureSet.has("priority_support"),
    },
  };
}

export async function getBusinessEntitlements(businessId) {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  return buildSubscriptionEntitlements(subscription);
}

export async function hasBusinessFeature(businessId, featureKey) {
  const entitlements = await getBusinessEntitlements(businessId);
  return Boolean(entitlements.usable && entitlements.featureMap[featureKey]);
}

export async function assertBusinessFeature(businessId, featureKey) {
  const entitlements = await getBusinessEntitlements(businessId);

  if (!entitlements.usable) {
    throw new ServiceError(
      "Goi business dang bi khoa hoac chua kich hoat",
      403,
      "SUBSCRIPTION_LOCKED",
    );
  }

  if (!entitlements.featureMap[featureKey]) {
    throw new ServiceError(
      "Goi hien tai chua mo tinh nang nay",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return entitlements;
}

export async function assertBusinessLimit(businessId, limitKey, currentCount) {
  const entitlements = await getBusinessEntitlements(businessId);
  const limit = entitlements.limits?.[limitKey];

  if (!entitlements.usable) {
    throw new ServiceError(
      "Goi business dang bi khoa hoac chua kich hoat",
      403,
      "SUBSCRIPTION_LOCKED",
    );
  }

  if (typeof limit !== "number" || limit < 0 || currentCount < limit) {
    return entitlements;
  }

  throw new ServiceError(
    "Goi hien tai da dat gioi han su dung",
    403,
    "SUBSCRIPTION_LIMIT_REACHED",
  );
}
