/**
 * Input sanitization middleware to prevent XSS and injection attacks
 * Uses DOMPurify philosophy without HTML parsing overhead for API endpoints
 */

import { ERROR_CODES } from "../config/messages.js";

// Character blacklist for strict sanitization
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Object tags
  /<embed\b[^>]*>/gi, // Embed tags
  /javascript:/gi, // javascript: protocol
  /data:text\/html/gi, // data:text/html
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /<\s*\/?\s*[a-z][^>]*>/gi, // Any HTML tags (cautious approach)
];

// Fields that should never contain HTML
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

// Fields that allow limited safe HTML (if needed in future)
// const ALLOWED_HTML_FIELDS = ["description", "content"];

/**
 * Strict sanitization - removes all HTML/script content
 * @param {string} value - Input value
 * @returns {string|null} - Sanitized value
 */
function strictSanitize(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;

  let sanitized = value;

  // Remove all HTML tags
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Remove null bytes and control characters (except normal whitespace)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize unicode to prevent spoofing
  sanitized = sanitized.normalize("NFC");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate that field contains no HTML/script content
 * @param {string} value - Input value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateNoHtml(value, fieldName) {
  if (value === null || value === undefined) return { valid: true };
  if (typeof value !== "string") return { valid: true };

  // Check for HTML/script patterns
  const hasHtml = /<\s*\/?\s*[a-z][^>]*>/i.test(value);
  const hasScript = /<script\b/i.test(value);
  const hasEventHandler = /on\w+\s*=/i.test(value);
  const hasJsProtocol = /javascript:/i.test(value);

  if (hasScript || hasEventHandler || hasJsProtocol) {
    return {
      valid: false,
      error: `Trường ${fieldName} chứa nội dung không được phép (script/event handler)`,
    };
  }

  if (hasHtml) {
    return {
      valid: false,
      error: `Trường ${fieldName} không được chứa thẻ HTML`,
    };
  }

  return { valid: true };
}

/**
 * Middleware to sanitize request body fields
 * @param {string[]} fields - Fields to sanitize
 * @param {Object} options - Options
 * @param {boolean} options.strict - If true, reject HTML instead of removing
 */
export const sanitizeBody = (fields = STRICT_TEXT_FIELDS, options = {}) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next();
    }

    const { strict = true } = options;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (strict) {
          // Validate and reject if contains HTML
          const validation = validateNoHtml(req.body[field], field);
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              data: null,
              message: validation.error,
              errorCode: ERROR_CODES.VALIDATION_ERROR,
            });
          }
          // Also apply basic sanitization
          req.body[field] = strictSanitize(req.body[field]);
        } else {
          // Just sanitize without rejecting
          req.body[field] = strictSanitize(req.body[field]);
        }
      }
    }

    next();
  };
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (fields = ["search", "q"]) => {
  return (req, res, next) => {
    if (!req.query || typeof req.query !== "object") {
      return next();
    }

    for (const field of fields) {
      if (req.query[field] !== undefined) {
        req.query[field] = strictSanitize(req.query[field]);
      }
    }

    next();
  };
};

/**
 * Comprehensive sanitization for all string fields in body
 * Use with caution - may affect legitimate content
 */
export const sanitizeAllStrings = (options = {}) => {
  const { maxLength = 10000, allowedFields = [] } = options;

  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return next();
    }

    function sanitizeObject(obj, path = "") {
      for (const key of Object.keys(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (typeof value === "string") {
          // Check max length
          if (value.length > maxLength) {
            return {
              error: `Trường ${currentPath} vượt quá độ dài tối đa ${maxLength}`,
            };
          }

          // Only sanitize if not in allowed list
          if (!allowedFields.includes(currentPath)) {
            // Check for dangerous content
            const validation = validateNoHtml(value, currentPath);
            if (!validation.valid) {
              return { error: validation.error };
            }
            obj[key] = strictSanitize(value);
          }
        } else if (typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
              if (typeof value[i] === "string") {
                const itemValidation = validateNoHtml(value[i], `${currentPath}[${i}]`);
                if (!itemValidation.valid) {
                  return { error: itemValidation.error };
                }
                value[i] = strictSanitize(value[i]);
              } else if (typeof value[i] === "object") {
                const result = sanitizeObject(value[i], `${currentPath}[${i}]`);
                if (result.error) return result;
              }
            }
          } else {
            const result = sanitizeObject(value, currentPath);
            if (result.error) return result;
          }
        }
      }
      return { error: null };
    }

    const result = sanitizeObject(req.body);
    if (result.error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: result.error,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    next();
  };
};

export default {
  sanitizeBody,
  sanitizeQuery,
  sanitizeAllStrings,
  strictSanitize,
};
