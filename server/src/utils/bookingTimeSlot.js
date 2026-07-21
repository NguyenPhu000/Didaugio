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
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function assertValidDate(date, name) {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`${name} must be a valid date`);
  }
  return date;
}

function getUseDateParts(useDate) {
  if (typeof useDate === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(useDate);
    if (!match) throw new RangeError("useDate must be a valid date");
    const [year, month, day] = match.slice(1).map(Number);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() !== month - 1 ||
      candidate.getUTCDate() !== day
    ) {
      throw new RangeError("useDate must be a valid date");
    }
    return { year, month, day };
  }

  const date = assertValidDate(new Date(useDate), "useDate");
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getUseTimeParts(useTime) {
  if (useTime === null || useTime === undefined || String(useTime).trim() === "") {
    return { hour: 0, minute: 0 };
  }
  const match = /^(\d{2}):(\d{2})$/.exec(String(useTime).trim());
  if (!match) throw new RangeError("useTime must use HH:mm format");
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new RangeError("useTime must use HH:mm format");
  return { hour, minute };
}

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
  const { year, month, day } = getUseDateParts(useDate);
  const { hour, minute } = getUseTimeParts(useTime);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - VIETNAM_OFFSET_MS);
}

/**
 * @param {Date} bookingAt
 */
export function toUseTimeString(bookingAt) {
  const d = assertValidDate(bookingAt instanceof Date ? bookingAt : new Date(bookingAt), "bookingAt");
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
  const d = assertValidDate(bookingAt instanceof Date ? bookingAt : new Date(bookingAt), "bookingAt");
  const ymd = d.toLocaleDateString("en-CA", { timeZone: TZ });
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0, 0));
}
