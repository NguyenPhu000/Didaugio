const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export function normalizeBookingIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (!key || key.length > MAX_IDEMPOTENCY_KEY_LENGTH) return null;
  return key;
}

export function isUniqueConstraintOnIdempotencyKey(error) {
  if (error?.code !== "P2002") return false;

  const target = error?.meta?.target;
  const fields = Array.isArray(target) ? target : [target];

  return fields
    .filter(Boolean)
    .some((field) =>
      ["idempotencyKey", "idempotency_key"].includes(String(field)),
    );
}

export async function lockBookingIdempotencyKey(tx, userId, idempotencyKey) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${String(userId)}), hashtext(${idempotencyKey}))
  `;
}
