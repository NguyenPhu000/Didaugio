function stripMarkdownFence(text) {
  const trimmed = String(text || "").trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenceMatch?.[1] || trimmed).trim();
}

function findBalancedJsonSlice(text) {
  const source = stripMarkdownFence(text);
  const start = source.search(/[\[{]/);
  if (start < 0) return source;

  const open = source[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = inString;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === open) depth += 1;
    if (char === close) depth -= 1;

    if (depth === 0) {
      return source.slice(start, i + 1);
    }
  }

  return source.slice(start);
}

function sanitizeJson(text) {
  return findBalancedJsonSlice(text).replace(/,\s*([}\]])/g, "$1").trim();
}

export function parseAiJson(text) {
  const cleanJson = sanitizeJson(text);
  return JSON.parse(cleanJson);
}

export function parseAiJsonObject(text) {
  const parsed = parseAiJson(text);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("AI JSON payload must be an object.");
  }
  return parsed;
}
