/**
 * intentDetector.js — single source of truth for intent detection.
 * Location: src/modules/ai-assistant/lib/ (NOT src/lib/)
 */

const INTENTS = {
  NAVIGATE: /đi đến|chỉ đường|bao xa|mấy phút|cách đây|đường đến|làm sao đến|tìm đường/i,
  BOOK: /đặt|book|mua vé|giá vé|còn chỗ|đặt chỗ|đặt bàn|đặt phòng|reservation/i,
  EAT: /ăn gì|món ngon|quán|nhà hàng|đặc sản|quán ăn|đồ ăn|ăn uống|thức ăn|cơm|phở|bún/i,
  NEARBY: /gần đây|xung quanh|khu vực này|gần tôi|quanh đây|lân cận|trong vòng/i,
  SCHEDULE: /lịch trình|hành trình|kế hoạch|mấy ngày|tour|chuyến đi|trip|itinerary/i,
  VOICE: /giới thiệu|kể về|nói về|thông tin về|cho biết|tìm hiểu|khám phá|mô tả/i,
  WEATHER: /thời tiết|trời|mưa|nắng|nhiệt độ|nóng|lạnh|gió|bão/i,
  SAVE: /lưu lại|bookmark|yêu thích|favorite|danh sách|muốn đi|nhớ lại/i,
  REVIEW: /đánh giá|review|nhận xét|sao|rating|có tốt không|đáng đi không/i,
  OPEN_HOURS: /giờ mở cửa|mấy giờ|đóng cửa|còn mở|lúc nào|thứ mấy/i,
};

export const INTENT_TYPES = Object.freeze({
  NAVIGATE: "NAVIGATE",
  BOOK: "BOOK",
  EAT: "EAT",
  NEARBY: "NEARBY",
  SCHEDULE: "SCHEDULE",
  VOICE: "VOICE",
  WEATHER: "WEATHER",
  SAVE: "SAVE",
  REVIEW: "REVIEW",
  OPEN_HOURS: "OPEN_HOURS",
  GENERAL: "GENERAL",
});

/**
 * Detect the intent of user input text.
 * @param {string} text
 * @returns {string} INTENT_TYPES value
 */
export function detectIntent(text) {
  if (!text || typeof text !== "string") return INTENT_TYPES.GENERAL;

  const trimmed = text.trim();
  for (const [intent, pattern] of Object.entries(INTENTS)) {
    if (pattern.test(trimmed)) return intent;
  }
  return INTENT_TYPES.GENERAL;
}

/**
 * Detect all matching intents (for compound queries).
 * @param {string} text
 * @returns {string[]}
 */
export function detectAllIntents(text) {
  if (!text || typeof text !== "string") return [INTENT_TYPES.GENERAL];

  const trimmed = text.trim();
  const matched = Object.entries(INTENTS)
    .filter(([, pattern]) => pattern.test(trimmed))
    .map(([intent]) => intent);

  return matched.length > 0 ? matched : [INTENT_TYPES.GENERAL];
}
