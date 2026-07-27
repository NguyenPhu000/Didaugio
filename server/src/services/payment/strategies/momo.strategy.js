import * as momoService from "../momo.service.js";

export const momoStrategy = {
  name: "MOMO",

  /**
   * Create payment URL for MoMo.
   */
  async createPayment({ orderId, amount, orderInfo, extraData, redirectUrl, ipnUrl }) {
    return momoService.createPaymentUrl({
      orderId,
      amount,
      orderInfo,
      extraData,
      redirectUrl,
      ipnUrl,
    });
  },

  /**
   * Verify IPN signature.
   */
  verifyIpn(body) {
    return momoService.verifyIpnSignature(body);
  },
};
