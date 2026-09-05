const toVndInteger = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.trunc(amount) : 0;
};

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatMoney = (value) =>
  vndFormatter.format(toVndInteger(value)).replace(/\u00a0/g, " ");

export const formatMoneyCompact = (value) => {
  const amount = toVndInteger(value);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);

  if (absolute < 1_000) return `${amount}`;

  const units = [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  const [divisor, suffix] = units.find(([threshold]) => absolute >= threshold);
  const compact = (absolute / divisor).toFixed(1).replace(/\.0$/, "");

  return `${sign}${compact}${suffix}`;
};

export const formatMoneySigned = (value, direction) => {
  const formatted = formatMoney(Math.abs(toVndInteger(value)));
  if (direction === "in") return `+${formatted}`;
  if (direction === "out") return `-${formatted}`;
  return formatted;
};

// Locale-aware formatter (vi/en) — dùng cho các màn cần đổi locale theo i18n
export const formatMoneyI18n = (value, language = "vi") => {
  const amount = toVndInteger(value);
  const locale = language === "vi" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};
