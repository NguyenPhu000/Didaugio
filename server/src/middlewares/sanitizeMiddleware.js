/** Input sanitization middleware for API text fields. */
import sanitizeHtml from "sanitize-html";
import { ERROR_CODES } from "../config/messages.js";

const PLAIN_TEXT_OPTIONS = Object.freeze({
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
});
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const STRICT_TEXT_FIELDS = [
  "businessName",
  "fullName",
  "address",
  "bio",
  "rejectionReason",
  "businessType",
  "bankName",
  "nickname",
];

function normalizeText(value) {
  return value.replace(CONTROL_CHARS_REGEX, "").normalize("NFC").trim();
}

function strictSanitize(value) {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  return normalizeText(sanitizeHtml(value, PLAIN_TEXT_OPTIONS));
}

function validateNoHtml(value, fieldName) {
  if (value == null || typeof value !== "string") return { valid: true };
  if (strictSanitize(value) === normalizeText(value)) return { valid: true };

  return {
    valid: false,
    error: `Trường ${fieldName} không được chứa thẻ HTML`,
  };
}

export const sanitizeBody = (fields = STRICT_TEXT_FIELDS, options = {}) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") return next();

    const { strict = true } = options;
    for (const field of fields) {
      if (req.body[field] === undefined) continue;

      if (strict) {
        const validation = validateNoHtml(req.body[field], field);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            data: null,
            message: validation.error,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }
      req.body[field] = strictSanitize(req.body[field]);
    }

    return next();
  };
};

export const sanitizeQuery = (fields = ["search", "q"]) => {
  return (req, res, next) => {
    if (!req.query || typeof req.query !== "object") return next();
    for (const field of fields) {
      if (req.query[field] !== undefined) {
        req.query[field] = strictSanitize(req.query[field]);
      }
    }
    return next();
  };
};

function sanitizeStringField(obj, key, currentPath, maxLength, allowedFields) {
  const value = obj[key];
  if (value.length > maxLength) return { error: `Trường ${currentPath} vượt quá độ dài tối đa ${maxLength}` };
  if (allowedFields.includes(currentPath)) return { error: null };
  const validation = validateNoHtml(value, currentPath);
  if (!validation.valid) return { error: validation.error };
  obj[key] = strictSanitize(value);
  return { error: null };
}

function sanitizeArray(value, currentPath, maxLength, allowedFields) {
  for (let index = 0; index < value.length; index += 1) {
    if (typeof value[index] === "string") {
      const itemPath = `${currentPath}[${index}]`;
      const validation = validateNoHtml(value[index], itemPath);
      if (!validation.valid) return { error: validation.error };
      value[index] = strictSanitize(value[index]);
    } else if (value[index] && typeof value[index] === "object") {
      const result = sanitizeObject(value[index], `${currentPath}[${index}]`, maxLength, allowedFields);
      if (result.error) return result;
    }
  }
  return { error: null };
}

function sanitizeObject(obj, path, maxLength, allowedFields) {
  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    if (typeof value === "string") {
      const result = sanitizeStringField(obj, key, currentPath, maxLength, allowedFields);
      if (result.error) return result;
      continue;
    }
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) {
      const result = sanitizeArray(value, currentPath, maxLength, allowedFields);
      if (result.error) return result;
      continue;
    }
    const result = sanitizeObject(value, currentPath, maxLength, allowedFields);
    if (result.error) return result;
  }
  return { error: null };
}

export const sanitizeAllStrings = (options = {}) => {
  const { maxLength = 10000, allowedFields = [] } = options;

  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") return next();

    const result = sanitizeObject(req.body, "", maxLength, allowedFields);
    if (result.error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: result.error,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    return next();
  };
};

export default {
  sanitizeBody,
  sanitizeQuery,
  sanitizeAllStrings,
  strictSanitize,
};
