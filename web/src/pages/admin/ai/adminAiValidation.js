const CONTEXT_SOURCES = new Set([
  "coarseLocation",
  "travelPreferences",
  "budget",
  "partySize",
  "tripDuration",
  "transportPreference",
  "places",
  "events",
  "sessionMessages",
  "time",
  "weather",
  "openingStatus",
]);

const CONTEXT_FIELDS = new Set([
  "currentCity",
  "travelPreferences",
  "budget",
  "partySize",
  "tripDuration",
  "transportPreference",
  "places",
  "events",
  "messages",
  "timeOfDay",
  "weather",
  "openingStatus",
]);

const exactKeys = (value, expectedKeys) => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
};

const numberInRange = (value, minimum, maximum, integer = false) =>
  Number.isFinite(value) &&
  value >= minimum &&
  value <= maximum &&
  (!integer || Number.isInteger(value));

const trimmedStringInRange = (value, maximum) =>
  typeof value === "string" &&
  value.trim().length >= 1 &&
  value.trim().length <= maximum;

const isApprovedGroqUrl = (value) => {
  if (typeof value !== "string" || value.length > 300) return false;
  try {
    return new URL(value).origin === "https://api.groq.com";
  } catch {
    return false;
  }
};

const isEnumArray = (value, allowed, maximum) =>
  Array.isArray(value) &&
  value.length <= maximum &&
  value.every((entry) => allowed.has(entry));

export function isValidAiConfigSnapshot(config) {
  if (
    !exactKeys(config, [
      "provider",
      "modelParameters",
      "prompts",
      "context",
      "safety",
      "quotas",
      "fallback",
    ])
  ) {
    return false;
  }

  const { provider } = config;
  if (
    !exactKeys(provider, [
      "adapter",
      "baseUrl",
      "model",
      "secretReference",
    ]) ||
    provider.adapter !== "groq" ||
    !isApprovedGroqUrl(provider.baseUrl) ||
    !trimmedStringInRange(provider.model, 160) ||
    !trimmedStringInRange(provider.secretReference, 100)
  ) {
    return false;
  }

  const parameters = config.modelParameters;
  if (
    !exactKeys(parameters, [
      "temperature",
      "topP",
      "maxTokens",
      "timeoutMs",
    ]) ||
    !numberInRange(parameters.temperature, 0, 1) ||
    !numberInRange(parameters.topP, 0, 1) ||
    !numberInRange(parameters.maxTokens, 256, 4096, true) ||
    !numberInRange(parameters.timeoutMs, 3000, 30000, true)
  ) {
    return false;
  }

  const { prompts } = config;
  if (
    !exactKeys(prompts, ["chat", "planner", "voice"]) ||
    !trimmedStringInRange(prompts.chat, 12000) ||
    !trimmedStringInRange(prompts.planner, 12000) ||
    !trimmedStringInRange(prompts.voice, 12000)
  ) {
    return false;
  }

  const { context } = config;
  if (
    !exactKeys(context, [
      "enabledSources",
      "fieldAllowlist",
      "maxTokens",
      "freshnessTtl",
    ]) ||
    !isEnumArray(
      context.enabledSources,
      CONTEXT_SOURCES,
      CONTEXT_SOURCES.size,
    ) ||
    !isEnumArray(
      context.fieldAllowlist,
      CONTEXT_FIELDS,
      CONTEXT_FIELDS.size,
    ) ||
    !numberInRange(context.maxTokens, 256, 4000, true) ||
    !numberInRange(context.freshnessTtl, 0, 86400, true)
  ) {
    return false;
  }

  const { safety } = config;
  if (
    !exactKeys(safety, [
      "blockedKeywords",
      "matchMode",
      "diacriticInsensitive",
      "safeResponse",
    ]) ||
    !Array.isArray(safety.blockedKeywords) ||
    safety.blockedKeywords.length > 500 ||
    safety.blockedKeywords.some(
      (keyword) => !trimmedStringInRange(keyword, 120),
    ) ||
    safety.matchMode !== "substring" ||
    typeof safety.diacriticInsensitive !== "boolean" ||
    !trimmedStringInRange(safety.safeResponse, 1000)
  ) {
    return false;
  }

  const { quotas } = config;
  if (
    !exactKeys(quotas, ["freeDailyRequests", "premiumDailyRequests"]) ||
    !numberInRange(quotas.freeDailyRequests, 0, 10000, true) ||
    !numberInRange(quotas.premiumDailyRequests, 0, 10000, true)
  ) {
    return false;
  }

  const { fallback } = config;
  return (
    exactKeys(fallback, [
      "maintenanceMessage",
      "staticPlannerEnabled",
    ]) &&
    trimmedStringInRange(fallback.maintenanceMessage, 1000) &&
    typeof fallback.staticPlannerEnabled === "boolean"
  );
}
