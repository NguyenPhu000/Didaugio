/**
 * CURRENCY UTILITIES
 * Centralized currency formatting functions for VND
 */

/**
 * Format price to short Vietnamese currency
 * @param {number} price - Price in VND
 * @returns {string} Formatted price (e.g., "1.5tr", "200k", "50đ")
 */
export const formatPrice = (price) => {
  if (!price || price === 0) return "0đ";
  
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}tr`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k`;
  }
  return `${price}đ`;
};

/**
 * Format price to full Vietnamese currency
 * @param {number} price - Price in VND
 * @returns {string} Formatted price with full VND symbol
 */
export const formatPriceFull = (price) => {
  if (!price) return "0₫";
  
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${price}₫`;
  }
};
