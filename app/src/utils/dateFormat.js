import i18n from "@/i18n";

const VI_LOCALE = "vi-VN";
const EN_LOCALE = "en-US";

export function getI18nLocale() {
  return i18n.language === "vi" ? VI_LOCALE : EN_LOCALE;
}

export function formatDateLocale(date, options) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(getI18nLocale(), options);
}

export function formatDateTimeLocale(date, options) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(getI18nLocale(), options);
}

export function formatNumberLocale(value, options) {
  return new Intl.NumberFormat(getI18nLocale(), options).format(value);
}

export function formatPriceLocale(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat(getI18nLocale(), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBookingDate(dateStr) {
  return formatDateLocale(dateStr, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShortDate(dateStr) {
  return formatDateLocale(dateStr, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDayMonth(dateStr) {
  return formatDateLocale(dateStr, {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatDayMonthNumeric(dateStr) {
  return formatDateLocale(dateStr, {
    day: "numeric",
    month: "numeric",
  });
}

export function formatMonthYear(dateStr) {
  return formatDateLocale(dateStr, {
    month: "long",
    year: "numeric",
  });
}

export function formatLongDate(dateStr) {
  return formatDateLocale(dateStr, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatFullDate(dateStr) {
  return formatDateLocale(dateStr, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatFullDateNoWeekday(dateStr) {
  return formatDateLocale(dateStr, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
