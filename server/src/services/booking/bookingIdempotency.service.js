const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export function normalizeBookingIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > MAX_IDEMPOTENCY_KEY_LENGTH) return null;
  return key;
}

export function isUniqueConstraintOnIdempotencyKey(error) {
  if (error?.code !== "P2002") return false;

  const target = error?.meta?.target;
  if (target === "bookings_user_id_idempotency_key_key") return true;
  const fields = Array.isArray(target) ? target : [target];
  const normalized = new Set(fields.filter(Boolean).map(String));
  const hasUser = normalized.has("userId") || normalized.has("user_id");
  const hasIdempotencyKey = normalized.has("idempotencyKey")
    || normalized.has("idempotency_key");
  return normalized.size === 2 && hasUser && hasIdempotencyKey;
}

export async function lockBookingIdempotencyKey(tx, userId, idempotencyKey) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${String(userId)}), hashtext(${idempotencyKey}))
  `;
}
