export const PAYMENT_OBLIGATION_ERROR_CODES = Object.freeze({
  AMOUNT_MISMATCH: "PAYMENT_AMOUNT_MISMATCH",
  CURRENCY_MISMATCH: "PAYMENT_CURRENCY_MISMATCH",
  REFERENCE_MISMATCH: "PAYMENT_REFERENCE_MISMATCH",
  ALREADY_FINAL: "PAYMENT_ALREADY_FINAL",
});

export function buildSafeWebhookLogEntry({
  gateway,
  reference,
  outcome,
  hasSignature = false,
}) {
  return {
    gateway,
    payload: {
      gateway,
      reference: typeof reference === "string" && reference.length > 0 ? reference : null,
      outcome: typeof outcome === "string" && outcome.length > 0 ? outcome : null,
      hasSignature: Boolean(hasSignature),
    },
    signature: null,
  };
}

function normalizeVNPayAmount(amount) {
  if (typeof amount !== "string" || !/^\d+$/.test(amount)) {
    return null;
  }

  const signedAmount = BigInt(amount);
  if (signedAmount <= 0n || signedAmount % 100n !== 0n) {
    return null;
  }

  const normalized = signedAmount / 100n;
  if (normalized > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(normalized);
}

function normalizeMoMoAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

function normalizeCurrency(currency) {
  return typeof currency === "string" && currency.length > 0
    ? currency.toUpperCase()
    : null;
}

export function validateCallbackObligation({ gateway, payment, callback }) {
  const paymentReference = payment?.transactionRef ?? payment?.transaction_ref;
  if (
    typeof callback?.reference !== "string" ||
    callback.reference.length === 0 ||
    callback.reference !== paymentReference
  ) {
    return {
      valid: false,
      code: PAYMENT_OBLIGATION_ERROR_CODES.REFERENCE_MISMATCH,
    };
  }

  const normalizedAmount =
    gateway === "VNPAY"
      ? normalizeVNPayAmount(callback.amount)
      : gateway === "MOMO"
        ? normalizeMoMoAmount(callback.amount)
        : null;

  if (normalizedAmount === null || normalizedAmount !== payment?.amount) {
    return {
      valid: false,
      code: PAYMENT_OBLIGATION_ERROR_CODES.AMOUNT_MISMATCH,
    };
  }

  const callbackCurrency =
    gateway === "MOMO" ? "VND" : normalizeCurrency(callback.currency);
  const paymentCurrency = normalizeCurrency(payment?.currency);
  if (!paymentCurrency || callbackCurrency !== paymentCurrency) {
    return {
      valid: false,
      code: PAYMENT_OBLIGATION_ERROR_CODES.CURRENCY_MISMATCH,
    };
  }

  return { valid: true, code: null };
}
