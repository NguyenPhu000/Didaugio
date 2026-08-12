import sanitizeHtml from "sanitize-html";

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MULTI_WHITESPACE_REGEX = /\s{2,}/g;
const PLAIN_TEXT_OPTIONS = Object.freeze({
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
});

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
    .normalize("NFC");

  next = sanitizeHtml(next, PLAIN_TEXT_OPTIONS);

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
