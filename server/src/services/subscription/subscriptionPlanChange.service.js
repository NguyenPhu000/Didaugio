export function getSubscriptionPrice(plan, billingCycle = "monthly") {
  if (!plan) return 0;
  if (billingCycle === "yearly" && Number(plan.priceYearly) > 0) {
    return Number(plan.priceYearly);
  }
  return Number(plan.priceMonthly || 0);
}

export function getPlanChangeDirection(currentPlan, targetPlan) {
  if (!currentPlan || !targetPlan) return "unknown";
  if (Number(currentPlan.id) === Number(targetPlan.id)) return "same";

  const currentOrder = Number(currentPlan.sortOrder || 0);
  const targetOrder = Number(targetPlan.sortOrder || 0);
  if (targetOrder > currentOrder) return "upgrade";
  if (targetOrder < currentOrder) return "downgrade";
  return "same";
}

export function getScheduledDowngrade(metadata = {}) {
  const scheduled = metadata?.scheduledDowngrade;
  if (!scheduled?.targetPlanId || !scheduled?.effectiveAt) {
    return null;
  }
  return scheduled;
}

export function buildScheduledDowngradeMetadata(
  metadata = {},
  { currentPlanId, targetPlan, effectiveAt, requestedAt = new Date() },
) {
  return {
    ...(metadata || {}),
    scheduledDowngrade: {
      currentPlanId,
      targetPlanId: targetPlan.id,
      targetPlanName: targetPlan.name,
      targetPlanSlug: targetPlan.slug,
      effectiveAt: new Date(effectiveAt).toISOString(),
      requestedAt: new Date(requestedAt).toISOString(),
    },
  };
}

export function clearScheduledDowngrade(metadata = {}) {
  const next = { ...(metadata || {}) };
  delete next.scheduledDowngrade;
  return next;
}
