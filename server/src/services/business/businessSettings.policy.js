const TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const DAY_INDEX_BY_KEY = Object.fromEntries(
  DAY_KEYS.map((day, index) => [day, index]),
);

const DEFAULT_HOURS = { open: "08:00", close: "22:00", closed: false };
const DEFAULT_BOOKING_RULES = {
  maxAdvanceDays: 30,
  minLeadMinutes: 0,
  allowOverbooking: false,
  autoApprove: false,
  cancellationWindowHours: 24,
  noShowPolicy: "charge_50",
};

export function getEffectiveBusinessBookingRules(settings) {
  const configuredRules = settings?.bookingRules;
  if (!configuredRules || Object.keys(configuredRules).length === 0) {
    return {
      maxAdvanceDays: 0,
      minLeadMinutes: 0,
      allowOverbooking: undefined,
      autoApprove: false,
      cancellationWindowHours: 0,
      noShowPolicy: "none",
    };
  }

  return {
    ...DEFAULT_BOOKING_RULES,
    ...configuredRules,
  };
}

const parseTime = (value) => {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

const getLocalParts = (date) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(date)).map(({ type, value }) => [type, value]),
  );
  return {
    day: parts.weekday.toLowerCase(),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

export function getOperatingHoursForDate(settings, date, placeOpeningHours = []) {
  const day = getLocalParts(date).day;
  const businessHours = settings?.general?.operatingHours?.[day];
  if (businessHours && typeof businessHours === "object") return businessHours;

  const placeHours = Array.isArray(placeOpeningHours)
    ? placeOpeningHours.find((hours) => Number(hours?.dayOfWeek) === DAY_INDEX_BY_KEY[day])
    : null;
  if (placeHours) {
    return {
      open: placeHours.openTime,
      close: placeHours.closeTime,
      closed: placeHours.isClosed === true,
    };
  }

  return DEFAULT_HOURS;
}

export function isWithinOperatingHours(settings, date, placeOpeningHours = []) {
  const hours = getOperatingHoursForDate(settings, date, placeOpeningHours);
  if (hours.closed === true) return false;

  const open = parseTime(hours.open);
  const close = parseTime(hours.close);
  if (open === null || close === null) return false;
  if (open === close) return true;

  const current = getLocalParts(date).minutes;
  return open < close
    ? current >= open && current <= close
    : current >= open || current <= close;
}

export function evaluateBusinessBookingPolicy({ settings, placeOpeningHours = [], bookingAt, now = new Date() }) {
  const target = new Date(bookingAt);
  const current = new Date(now);
  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) {
    return { ok: false, reason: "INVALID_TIME" };
  }

  const rules = getEffectiveBusinessBookingRules(settings);
  const minLeadMinutes = Number(rules.minLeadMinutes || 0);
  if (minLeadMinutes > 0 && target.getTime() - current.getTime() < minLeadMinutes * 60_000) {
    return { ok: false, reason: "MIN_LEAD_TIME" };
  }

  const maxAdvanceDays = Number(rules.maxAdvanceDays || 0);
  if (maxAdvanceDays > 0 && target.getTime() - current.getTime() > maxAdvanceDays * 86_400_000) {
    return { ok: false, reason: "MAX_ADVANCE_DAYS" };
  }

  if (!isWithinOperatingHours(settings, target, placeOpeningHours)) {
    return { ok: false, reason: "OUTSIDE_OPERATING_HOURS" };
  }

  return { ok: true, reason: null };
}

export function getBusinessBookingPolicyMessage(reason) {
  return {
    INVALID_TIME: "Thời gian đặt cho không hợp lệ",
    MIN_LEAD_TIME: "Thời gian đặt cho chưa đặt mức tối thiểu",
    MAX_ADVANCE_DAYS: "Thời điểm đặt cho vượt qua giới hạn cho phép",
    OUTSIDE_OPERATING_HOURS: "Thời điểm đặt cho nằm ngoài giờ hoạt động",
  }[reason] || "Thời gian đặt cho không được phép";
}

export function getUserCancellationRefundPercent(rules, bookingAt, now = new Date()) {
  const hasConfiguredRules = rules && Object.keys(rules).length > 0;
  const windowHours = hasConfiguredRules
    ? Number(rules.cancellationWindowHours ?? 24)
    : 0;
  if (windowHours <= 0) return 100;

  const target = new Date(bookingAt);
  const current = new Date(now);
  if (Number.isNaN(target.getTime()) || Number.isNaN(current.getTime())) return 0;

  return target.getTime() - current.getTime() >= windowHours * 3_600_000 ? 100 : 0;
}

export function getNoShowRefundPercent(policy) {
  const effectivePolicy = policy || "none";
  return {
    none: 100,
    charge_25: 75,
    charge_50: 50,
    charge_100: 0,
    ban_user: 0,
  }[effectivePolicy] ?? 50;
}

export function isBusinessNotificationEnabled(settings, key) {
  const notifications = settings?.notifications || {};
  const aliases = {
    bookingCancelledEmail: ["cancellationEmail", "bookingCancelledEmail"],
    bookingCancelledPush: ["cancellationPush", "bookingCancelledPush"],
  };
  const candidates = aliases[key] || [key];
  const configured = candidates.find((candidate) => candidate in notifications);
  return configured ? notifications[configured] === true : true;
}

export function getDayKeys() {
  return DAY_KEYS.slice();
}
