const FIELD_SOURCES = Object.freeze({
  currentCity: "coarseLocation",
  travelPreferences: "travelPreferences",
  budget: "budget",
  partySize: "partySize",
  tripDuration: "tripDuration",
  transportPreference: "transportPreference",
  places: "places",
  events: "events",
  messages: "sessionMessages",
  timeOfDay: "time",
  weather: "weather",
  openingStatus: "openingStatus",
});

const SENSITIVE_KEYS = new Set([
  "email",
  "phone",
  "phonenumber",
  "userid",
  "currentcoords",
  "coords",
  "coordinates",
  "latitude",
  "longitude",
  "lat",
  "lng",
]);

function maskSensitiveValues(value, seen = new WeakSet()) {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveValues(item, seen));
  }
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return undefined;

  seen.add(value);
  const result = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.replaceAll("_", "").toLocaleLowerCase("en-US");
    if (SENSITIVE_KEYS.has(normalizedKey) || nestedValue == null) continue;
    const masked = maskSensitiveValues(nestedValue, seen);
    if (masked !== undefined) result[key] = masked;
  }
  seen.delete(value);
  return result;
}

export function buildAllowedContext(input, policy = {}) {
  const sourceAllowlist = new Set(policy.enabledSources ?? []);
  const fieldAllowlist = new Set(policy.fieldAllowlist ?? []);
  const maxChars = Math.max(0, Number(policy.maxTokens) || 0) * 4;
  const result = {};

  for (const [field, value] of Object.entries(input ?? {})) {
    const source = FIELD_SOURCES[field];
    if (
      value == null ||
      !source ||
      !fieldAllowlist.has(field) ||
      !sourceAllowlist.has(source)
    ) {
      continue;
    }

    const masked = maskSensitiveValues(value);
    const candidate = { ...result, [field]: masked };
    if (JSON.stringify(candidate).length <= maxChars) {
      result[field] = masked;
    }
  }

  return result;
}

export function isFreshContextSource(
  fetchedAt,
  freshnessTtl,
  now = Date.now(),
) {
  const timestamp = new Date(fetchedAt).getTime();
  const ttlMs = Number(freshnessTtl) * 1000;
  return (
    Number.isFinite(timestamp) &&
    Number.isFinite(ttlMs) &&
    ttlMs >= 0 &&
    timestamp <= now &&
    now - timestamp <= ttlMs
  );
}
