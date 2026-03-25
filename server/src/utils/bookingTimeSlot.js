/**
 * Khung giờ theo múi giờ Việt Nam (sáng / trưa / chiều / tối).
 */
export const TIME_SLOT_KEYS = {
  MORNING: "morning",
  NOON: "noon",
  AFTERNOON: "afternoon",
  EVENING: "evening",
};

const TZ = "Asia/Ho_Chi_Minh";

/**
 * @param {Date | string | null | undefined} bookingAt
 * @returns {keyof typeof TIME_SLOT_KEYS | "morning"}
 */
export function deriveTimeSlot(bookingAt) {
  if (!bookingAt) return TIME_SLOT_KEYS.MORNING;
  const d = bookingAt instanceof Date ? bookingAt : new Date(bookingAt);
  if (Number.isNaN(d.getTime())) return TIME_SLOT_KEYS.MORNING;

  const hourStr = d.toLocaleString("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone: TZ,
  });
  const h = parseInt(hourStr, 10);
  if (h >= 6 && h < 12) return TIME_SLOT_KEYS.MORNING;
  if (h >= 12 && h < 14) return TIME_SLOT_KEYS.NOON;
  if (h >= 14 && h < 18) return TIME_SLOT_KEYS.AFTERNOON;
  return TIME_SLOT_KEYS.EVENING;
}

export const TIME_SLOT_LABELS = {
  [TIME_SLOT_KEYS.MORNING]: "Sáng (6h–12h)",
  [TIME_SLOT_KEYS.NOON]: "Trưa (12h–14h)",
  [TIME_SLOT_KEYS.AFTERNOON]: "Chiều (14h–18h)",
  [TIME_SLOT_KEYS.EVENING]: "Tối (sau 18h)",
};

/**
 * Cắt về đầu phút (UTC) để so khớp slot.
 * @param {Date} d
 */
export function startOfMinuteUtc(d) {
  const x = new Date(d);
  x.setUTCSeconds(0, 0);
  x.setUTCMilliseconds(0);
  return x;
}

/**
 * @param {Date} d
 */
export function endOfMinuteUtc(d) {
  return new Date(startOfMinuteUtc(d).getTime() + 60_000);
}

/**
 * useDate (Date-only) + useTime "HH:mm" → Date (UTC-based instant).
 * @param {Date} useDate
 * @param {string | null | undefined} useTime
 */
export function combineUseDateAndTime(useDate, useTime) {
  const base = new Date(useDate);
  const y = base.getUTCFullYear();
  const mo = base.getUTCMonth();
  const da = base.getUTCDate();
  let hh = 0;
  let mm = 0;
  if (useTime && String(useTime).trim()) {
    const parts = String(useTime).trim().split(":");
    hh = parseInt(parts[0], 10) || 0;
    mm = parseInt(parts[1], 10) || 0;
  }
  return new Date(Date.UTC(y, mo, da, hh, mm, 0, 0));
}

/**
 * @param {Date} bookingAt
 */
export function toUseTimeString(bookingAt) {
  const d = bookingAt instanceof Date ? bookingAt : new Date(bookingAt);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

/**
 * Ngày sử dụng (Date @db.Date) từ instant theo calendar VN.
 * @param {Date} bookingAt
 */
export function toUseDateOnly(bookingAt) {
  const d = bookingAt instanceof Date ? bookingAt : new Date(bookingAt);
  const ymd = d.toLocaleDateString("en-CA", { timeZone: TZ });
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0, 0));
}
