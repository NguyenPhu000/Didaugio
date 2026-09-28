/**
 * intentDetector.js — single source of truth for intent detection.
 * Location: src/modules/ai-assistant/lib/ (NOT src/lib/)
 */

const INTENTS = {
  NAVIGATE: /đi đến|chỉ đường|chỉ tôi lộ trình|lộ trình từ|bao xa|mấy phút|cách đây|đường đến|làm sao đến|tìm đường/i,
  BOOK: /đặt|book|mua vé|giá vé|còn chỗ|đặt chỗ|đặt bàn|đặt phòng|reservation/i,
  EAT: /ăn gì|món ngon|quán|nhà hàng|đặc sản|quán ăn|đồ ăn|ăn uống|thức ăn|cơm|phở|bún/i,
  NEARBY: /gần đây|xung quanh|khu vực này|gần tôi|quanh đây|lân cận|trong vòng/i,
  SCHEDULE: /lịch trình|lên lịch|lập lịch|tạo lịch|kế hoạch|tạo kế hoạch|mấy ngày|tour|chuyến đi|trip|itinerary|\bplan\b|tạo plan|lên plan|travel plan/i,
  VOICE: /giới thiệu|kể về|nói về|thông tin về|cho biết|tìm hiểu|khám phá|mô tả/i,
  WEATHER: /thời tiết|trời|mưa|nắng|nhiệt độ|nóng|lạnh|gió|bão/i,
  SAVE: /lưu lại|bookmark|yêu thích|favorite|danh sách|muốn đi|nhớ lại/i,
  REVIEW: /đánh giá|review|nhận xét|sao|rating|có tốt không|đáng đi không/i,
  OPEN_HOURS: /giờ mở cửa|mấy giờ|đóng cửa|còn mở|lúc nào|thứ mấy/i,
};

const TRAVEL_JOURNEY_PATTERN =
  /h\u00e0nh tr\u00ecnh du l\u1ecbch/i;

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

function removeVietnameseAccents(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const INTENTS_UNACCENTED = {
  NAVIGATE: /di den|chi duong|chi toi lo trinh|lo trinh tu|bao xa|may phut|cach day|duong den|lam sao den|tim duong/i,
  BOOK: /dat|book|mua ve|gia ve|con cho|dat cho|dat ban|dat phong|reservation/i,
  EAT: /an gi|mon ngon|quan|nha hang|dac san|quan an|do an|an uong|thuc an|com|pho|bun/i,
  NEARBY: /gan day|xung quanh|khu vuc nay|gan toi|quanh day|lan can|trong vong/i,
  SCHEDULE: /lich trinh|len lich|lap lich|tao lich|ke hoach|tao ke hoach|may ngay|tour|chuyen di|trip|itinerary|\bplan\b|tao plan|len plan|travel plan/i,
  VOICE: /gioi thieu|ke ve|noi ve|thong tin ve|cho biet|tim hieu|kham pha|mo ta/i,
  WEATHER: /thoi tiet|troi|mua|nang|nhiet do|nong|lanh|gio|bao/i,
  SAVE: /luu lai|bookmark|yeu thich|favorite|danh sach|muon di|nho lai/i,
  REVIEW: /danh gia|review|nhan xet|sao|rating|co tot khong|dang di khong/i,
  OPEN_HOURS: /gio mo cua|may gio|dong cua|con mo|luc nao|thu may/i,
};

/**
 * Detect the intent of user input text.
 * @param {string} text
 * @returns {string} INTENT_TYPES value
 */
export function detectIntent(text) {
  if (!text || typeof text !== "string") return INTENT_TYPES.GENERAL;

  const trimmed = text.trim();
  const unaccented = removeVietnameseAccents(trimmed);
  if (TRAVEL_JOURNEY_PATTERN.test(trimmed) || /hanh trinh du lich/i.test(unaccented)) {
    return INTENT_TYPES.SCHEDULE;
  }
  for (const [intent, pattern] of Object.entries(INTENTS)) {
    if (pattern.test(trimmed)) return intent;
  }
  for (const [intent, pattern] of Object.entries(INTENTS_UNACCENTED)) {
    if (pattern.test(unaccented)) return intent;
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
  const unaccented = removeVietnameseAccents(trimmed);
  const matched = new Set();

  for (const [intent, pattern] of Object.entries(INTENTS)) {
    if (pattern.test(trimmed)) matched.add(intent);
  }
  for (const [intent, pattern] of Object.entries(INTENTS_UNACCENTED)) {
    if (pattern.test(unaccented)) matched.add(intent);
  }
  if (
    (TRAVEL_JOURNEY_PATTERN.test(trimmed) || /hanh trinh du lich/i.test(unaccented)) &&
    !matched.has(INTENT_TYPES.SCHEDULE)
  ) {
    matched.add(INTENT_TYPES.SCHEDULE);
  }

  return matched.size > 0 ? Array.from(matched) : [INTENT_TYPES.GENERAL];
}
