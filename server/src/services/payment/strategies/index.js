import { vnpayStrategy } from "./vnpay.strategy.js";
import { momoStrategy } from "./momo.strategy.js";
import { sepayStrategy } from "./sepay.strategy.js";

const strategies = {
  vnpay: vnpayStrategy,
  momo: momoStrategy,
  sepay: sepayStrategy,
  sepay_bank: sepayStrategy,
};

/**
 * Get payment strategy implementation by payment method/gateway name.
 * @param {string} gatewayName
 */
export function getPaymentStrategy(gatewayName) {
  const normalized = String(gatewayName || "").toLowerCase().trim();
  return strategies[normalized] || null;
}

export {
  vnpayStrategy,
  momoStrategy,
  sepayStrategy,
};
