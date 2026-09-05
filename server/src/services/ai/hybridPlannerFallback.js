const TIME_SLOTS = ["Sáng", "Trưa", "Chiều"];

function asNonNegativeMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function categoryBucket(place) {
  const category = String(place?.categoryName || place?.category?.name || "").toLowerCase();
  return /food|restaurant|cafe|coffee|ẩm thực|ăn uống|quán/.test(category)
    ? "food"
    : "tickets";
}

/**
 * DB-only fallback for provider availability failures. The caller supplies a
 * deterministic DB-sorted place list; no outside IDs or generated prices enter
 * the response.
 */
export function generateHybridFallback(places) {
  const timeline = [];
  const costBreakdown = {
    food: { from: 0, to: 0 },
    tickets: { from: 0, to: 0 },
    transportEstimated: { from: 0, to: 0 },
  };

  for (const place of Array.isArray(places) ? places : []) {
    if (timeline.length >= TIME_SLOTS.length) break;
    const placeId = Number(place?.id);
    if (!Number.isSafeInteger(placeId) || placeId <= 0) continue;

    const from = asNonNegativeMoney(place?.priceFrom ?? place?.price_from);
    const to = Math.max(from, asNonNegativeMoney(place?.priceTo ?? place?.price_to));
    const bucket = categoryBucket(place);
    costBreakdown[bucket].from += from;
    costBreakdown[bucket].to += to;
    timeline.push({
      timeSlot: TIME_SLOTS[timeline.length],
      placeId,
      reason: "Gợi ý từ dữ liệu địa điểm hiện có.",
    });
  }

  const totalEstimatedPriceFrom = costBreakdown.food.from + costBreakdown.tickets.from;
  const totalEstimatedPriceTo = costBreakdown.food.to + costBreakdown.tickets.to;
  return {
    tripSummary: {
      totalEstimatedPriceFrom,
      totalEstimatedPriceTo,
      currency: "VND",
      costBreakdown,
    },
    timeline,
    fallbackUsed: true,
  };
}
