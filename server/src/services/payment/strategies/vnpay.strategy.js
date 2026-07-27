import * as vnpayService from "../vnpay.service.js";

export const vnpayStrategy = {
  name: "VNPAY",

  /**
   * Create payment URL for VNPay.
   */
  async createPayment({ ip, amount, orderInfo, txnRef, returnUrl }) {
    return vnpayService.createPaymentUrl({
      ip,
      amount,
      orderInfo,
      txnRef,
      returnUrl,
    });
  },

  /**
   * Verify return URL signature.
   */
  verifyReturnUrl(vnpParams) {
    return vnpayService.verifyReturnUrl(vnpParams);
  },

  /**
   * Verify IPN request query.
   */
  verifyIpn(vnpParams) {
    return vnpayService.verifyIpn(vnpParams);
  },
};
