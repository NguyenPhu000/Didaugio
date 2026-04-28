const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT_STYLE_BLOCK_REGEX =
  /<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;
const MULTI_WHITESPACE_REGEX = /\s{2,}/g;

const toStringSafe = (value) => (typeof value === "string" ? value : "");

/**
 * Remove control chars and common HTML/script payloads from untrusted text input.
 */
export const sanitizeText = (
  value,
  { trim = true, collapseWhitespace = true } = {},
) => {
  if (value == null) return "";

  let next = toStringSafe(value)
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(SCRIPT_STYLE_BLOCK_REGEX, "")
    .replace(HTML_TAG_REGEX, "");

  if (collapseWhitespace) {
    next = next.replace(MULTI_WHITESPACE_REGEX, " ");
  }

  return trim ? next.trim() : next;
};

/**
 * Sanitize nullable text values while preserving null/undefined semantics.
 */
export const sanitizeNullableText = (
  value,
  { collapseWhitespace = true } = {},
) => {
  if (value == null) return null;

  const sanitized = sanitizeText(value, {
    trim: true,
    collapseWhitespace,
  });

  return sanitized || null;
};

/**
 * Sanitize optional text values while preserving undefined semantics.
 */
export const sanitizeOptionalText = (
  value,
  { collapseWhitespace = true } = {},
) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return sanitizeText(value, {
    trim: true,
    collapseWhitespace,
  });
};
