import {
  assertItineraryPlaceIds,
  createAiInvalidOutputError,
} from "./aiOutputGuard.js";
import { itineraryPreviewSchema } from "../../models/schemas/trip/itineraryPreview.schema.js";

function repairTruncatedJson(jsonStr) {
  let str = jsonStr.trim();
  str = str.replace(/^```json\s*/i, "").replace(/```$/, "");

  const stack = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i += 1) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{" || char === "[") stack.push(char);
    if (char === "}" && stack.at(-1) === "{") stack.pop();
    if (char === "]" && stack.at(-1) === "[") stack.pop();
  }

  if (inString) str += '"';
  str = str.replace(/,\s*$/, "");

  while (stack.length > 0) {
    str += stack.pop() === "{" ? "}" : "]";
  }

  return str;
}

function parseItineraryJson(rawText) {
  if (typeof rawText !== "string") {
    throw new TypeError("AI itinerary output must be a JSON string.");
  }

  try {
    return JSON.parse(rawText);
  } catch {
    try {
      return JSON.parse(repairTruncatedJson(rawText));
    } catch {
      const jsonMatch =
        rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
        rawText.match(/(\{[\s\S]*\})/);
      if (!jsonMatch?.[1]) throw new SyntaxError("No JSON object found in AI output.");
      return JSON.parse(repairTruncatedJson(jsonMatch[1].trim()));
    }
  }
}

function validateParsedItineraryOutput(parsed, places) {
  const hasProviderDistance = (parsed?.days || []).some((day) =>
    (day?.destinations || []).some((destination) =>
      Object.hasOwn(destination || {}, "distanceToNext"),
    ),
  );
  if (hasProviderDistance) throw createAiInvalidOutputError();

  const result = itineraryPreviewSchema.safeParse(parsed);
  if (!result.success) throw createAiInvalidOutputError();

  return {
    ...result.data,
    days: assertItineraryPlaceIds(result.data.days, places),
  };
}

/**
 * Parse and validate provider output before any correction, optimization, or
 * cache write. Every malformed provider response maps to one stable error.
 */
export function parseAndValidateItineraryOutput(rawText, places) {
  try {
    return validateParsedItineraryOutput(parseItineraryJson(rawText), places);
  } catch (error) {
    if (error?.code === "AI_INVALID_OUTPUT") throw error;
    throw createAiInvalidOutputError();
  }
}

/**
 * Return a safe cache result only when it still meets the current candidate
 * allow-list. `null` is a cache miss, allowing the caller to regenerate it.
 */
export function buildValidatedCachedItineraryResult(cached, places) {
  if (!cached || !Object.hasOwn(cached, "itineraryData")) return null;

  try {
    const itineraryData = cached.itineraryData;
    const parsed =
      typeof itineraryData === "string"
        ? parseAndValidateItineraryOutput(itineraryData, places)
        : validateParsedItineraryOutput(itineraryData, places);

    return {
      parsed,
      raw: JSON.stringify(itineraryData),
      tokensUsed: 0,
      responseTimeMs: 0,
    };
  } catch (error) {
    if (error?.code === "AI_INVALID_OUTPUT") return null;
    throw error;
  }
}
