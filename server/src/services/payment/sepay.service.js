import crypto from "node:crypto";

const SEPAY_ENV = process.env.SEPAY_ENV || "sandbox";
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID || "";
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY || "";

const CHECKOUT_URLS = {
  sandbox: "https://pay-sandbox.sepay.vn/v1/checkout/init",
  production: "https://pay.sepay.vn/v1/checkout/init",
};

/** SePay QR động (ảnh tĩnh), không cần API key. Cấu hình qua env nếu muốn. */
const SEPAY_QR_IMAGE_BASE =
  process.env.SEPAY_QR_IMAGE_BASE || "https://qr.sepay.vn/img";
const SEPAY_QR_TEMPLATE = process.env.SEPAY_QR_TEMPLATE || "compact";

/**
 * Đọc thông tin ngân hàng nhận thanh toán từ biến môi trường.
 * @returns {{ bankName: string, bankAccountNumber: string, bankAccountName: string }}
 */
export function getBankInfo() {
  return {
    bankName: process.env.BANK_NAME || "",
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
    bankAccountName: process.env.BANK_ACCOUNT_NAME || "",
  };
}

/**
 * Tạo URL ảnh QR chuyển khoản SePay (VietQR) với số tiền + nội dung cố định.
 * Nội dung chuyển khoản (des) = transactionRef (mã DDG...) — webhook sẽ match theo field này.
 *
 * @param {Object} opts
 * @param {number} opts.amount         - Số tiền (VND)
 * @param {string} opts.transactionRef - Mã đơn (DDG...) dùng làm nội dung CK
 * @returns {string} URL ảnh QR
 */
export function buildQrUrl({ amount, transactionRef }) {
  const { bankName, bankAccountNumber } = getBankInfo();

  if (!bankName || !bankAccountNumber) {
    throw new Error(
      "Thông tin ngân hàng nhận thanh toán chưa được cấu hình. Vui lòng cập nhật BANK_NAME và BANK_ACCOUNT_NUMBER trong .env",
    );
  }

  if (!transactionRef) {
    throw new Error("Thiếu transactionRef để tạo nội dung chuyển khoản");
  }

  const normalizedAmount = Math.round(Number(amount));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Số tiền không hợp lệ để tạo QR");
  }

  const params = new URLSearchParams({
    bank: bankName,
    acc: bankAccountNumber,
    template: SEPAY_QR_TEMPLATE,
    amount: String(normalizedAmount),
    des: transactionRef,
  });

  return `${SEPAY_QR_IMAGE_BASE}?${params.toString()}`;
}

/** Fields that SePay SDK includes in signature (exact order from source) */
const SIGNED_FIELDS = [
  "merchant",
  "env",
  "operation",
  "payment_method",
  "order_amount",
  "currency",
  "order_invoice_number",
  "order_description",
  "customer_id",
  "agreement_id",
  "agreement_name",
  "agreement_type",
  "agreement_payment_frequency",
  "agreement_amount_per_payment",
  "success_url",
  "error_url",
  "cancel_url",
  "order_id",
];

/**
 * Generate HMAC-SHA256 signature matching sepay-pg-node SDK.
 * - Filters to SIGNED_FIELDS only
 * - Format: "field=value" joined by ","
 * - HMAC-SHA256 → base64
 */
function signFields(fields) {
  const parts = [];
  for (const field of SIGNED_FIELDS) {
    if (fields[field] === undefined) continue;
    parts.push(`${field}=${fields[field] ?? ""}`);
  }

  return crypto
    .createHmac("sha256", SEPAY_SECRET_KEY)
    .update(parts.join(","))
    .digest("base64");
}

/**
 * Create SePay checkout form data for a one-time payment.
 * Returns checkout URL and form fields to POST to SePay.
 */
export function createCheckoutForm({
  amount,
  transactionRef,
  orderInfo,
  successUrl,
  errorUrl,
  cancelUrl,
}) {
  if (!SEPAY_MERCHANT_ID || !SEPAY_SECRET_KEY) {
    throw new Error(
      "SePay chưa được cấu hình. Vui lòng cập nhật SEPAY_MERCHANT_ID và SEPAY_SECRET_KEY trong .env",
    );
  }

  const fields = {
    merchant: SEPAY_MERCHANT_ID,
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: transactionRef,
    order_amount: String(amount),
    currency: "VND",
    order_description: orderInfo,
    customer_id: "",
    success_url: successUrl || "",
    error_url: errorUrl || "",
    cancel_url: cancelUrl || "",
  };

  fields.signature = signFields(fields);

  return {
    checkoutUrl: CHECKOUT_URLS[SEPAY_ENV] || CHECKOUT_URLS.sandbox,
    fields,
  };
}

/**
 * Parse SePay IPN body and extract relevant payment data.
 * SePay IPN sends JSON with { notification_type, order, transaction }.
 */
export function parseIPN(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, data: null, error: "Invalid IPN body" };
  }

  const { notification_type, order, transaction } = body;

  if (!notification_type || !order || !transaction) {
    return { valid: false, data: null, error: "Missing required IPN fields" };
  }

  if (notification_type !== "ORDER_PAID") {
    return {
      valid: false,
      data: null,
      error: `Unsupported notification_type: ${notification_type}`,
    };
  }

  if (order.order_status !== "CAPTURED") {
    return {
      valid: false,
      data: null,
      error: `Order not captured. Status: ${order.order_status}`,
    };
  }

  if (transaction.transaction_status !== "APPROVED") {
    return {
      valid: false,
      data: null,
      error: `Transaction not approved. Status: ${transaction.transaction_status}`,
    };
  }

  return {
    valid: true,
    data: {
      transactionRef: order.order_invoice_number,
      orderId: order.order_id,
      amount: parseFloat(order.order_amount),
      orderStatus: order.order_status,
      orderDescription: order.order_description,
      transactionId: transaction.transaction_id,
      transactionStatus: transaction.transaction_status,
      paymentMethod: transaction.payment_method,
      transactionDate: transaction.transaction_date,
    },
    error: null,
  };
}

/**
 * Build the IPN success response for SePay.
 * SePay expects HTTP 200 with { success: true }.
 */
export function buildIpnSuccess() {
  return { success: true };
}

/**
 * Build the IPN error response for SePay.
 */
export function buildIpnError(message) {
  return { success: false, message };
}
