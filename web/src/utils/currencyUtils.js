const MILLION = 1_000_000;
const THOUSAND = 1_000;

export const formatPrice = (price) => {
  if (!price || price === 0) return "0đ";

  if (price >= MILLION) {
    return `${(price / MILLION).toFixed(1)}tr`;
  }
  if (price >= THOUSAND) {
    return `${(price / THOUSAND).toFixed(0)}k`;
  }
  return `${price}đ`;
};

export const formatPriceFull = (price) => {
  if (!price) return "0₫";

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  } catch {
    return `${price}₫`;
  }
};
