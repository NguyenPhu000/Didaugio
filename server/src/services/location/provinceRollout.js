const DEFAULT_ENABLED_PROVINCES = ["92"];

export const getEnabledProvinceCodes = (raw = process.env.ENABLED_PROVINCE_CODES) => {
  const codes = String(raw || "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => /^\d+$/.test(code));
  return new Set(codes.length > 0 ? codes : DEFAULT_ENABLED_PROVINCES);
};

export const isProvinceEnabled = (provinceCode, enabled = getEnabledProvinceCodes()) =>
  enabled.has(String(provinceCode || ""));
