const clamp = (value, max) =>
  Number.isFinite(value) && value > 0 ? Math.min(value, max) : undefined;

function parseBudget(text) {
  const match = text.match(
    /(?:dưới|khoảng|tầm|budget|ngân sách|giá)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)/i,
  );
  if (!match) return undefined;

  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return undefined;

  return Math.round(amount * (/triệu|tr/i.test(match[2]) ? 1_000_000 : 1_000));
}

export function inferPlannerPreferences(text = "") {
  const value = String(text);
  const dayMatch = value.match(/(\d{1,2})\s*(?:ngày|day)/i);
  const groupMatch = value.match(/(\d{1,2})\s*(?:người|person|people)/i);
  const result = {
    totalDays: clamp(Number(dayMatch?.[1]), 14),
    groupSize: clamp(Number(groupMatch?.[1]), 12),
    budget: parseBudget(value),
    travelStyle: /giá rẻ|tiết kiệm|du lịch bụi|budget/i.test(value)
      ? "budget"
      : undefined,
  };

  return Object.fromEntries(
    Object.entries(result).filter(([, item]) => item !== undefined),
  );
}
