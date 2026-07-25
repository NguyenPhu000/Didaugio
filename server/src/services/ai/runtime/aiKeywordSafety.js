import {
  normalizeKeyword,
} from "../../../models/schemas/adminAi/adminAi.schema.js";

export function evaluateKeywordSafety(text, safety = {}) {
  const normalizedText = normalizeKeyword(
    text,
    safety.diacriticInsensitive,
  );
  const keyword = (safety.blockedKeywords ?? [])
    .map((value) =>
      normalizeKeyword(value, safety.diacriticInsensitive),
    )
    .find((value) => value.length > 0 && normalizedText.includes(value));

  return {
    blocked: Boolean(keyword),
    keyword: keyword ?? null,
  };
}
