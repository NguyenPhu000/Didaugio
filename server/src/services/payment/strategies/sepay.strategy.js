import * as sepayService from "../sepay.service.js";
import * as sepayWebhookService from "../sepayWebhook.service.js";

export const sepayStrategy = {
  name: "SEPAY",

  /**
   * Generate QR Code URL for SePay Bank Transfer.
   */
  createPayment({ amount, transactionRef, paymentCode }) {
    return sepayService.buildQrUrl({
      amount,
      transactionRef: transactionRef || paymentCode,
    });
  },

  /**
   * Verify SePay bank webhook signature.
   */
  verifyWebhook(rawBody, signature, timestamp, headers) {
    return sepayWebhookService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp,
      headers,
    );
  },
};

