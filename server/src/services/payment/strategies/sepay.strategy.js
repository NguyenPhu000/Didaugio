import * as sepayService from "../sepay.service.js";

export const sepayStrategy = {
  name: "SEPAY",

  /**
   * Generate QR Code URL for SePay Bank Transfer.
   */
  createPayment({ paymentCode, amount, accountNo, bankName }) {
    return sepayService.generateQrUrl({
      paymentCode,
      amount,
      accountNo,
      bankName,
    });
  },

  /**
   * Verify SePay bank webhook signature.
   */
  verifyWebhook(headers, rawBody) {
    return sepayService.verifyWebhookSignature(headers, rawBody);
  },
};
