/**
 * Field-level encryption utilities for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Validate encryption key on startup
 */
export function validateEncryptionKey() {
  if (!ENCRYPTION_KEY) {
    console.warn("[SECURITY] FIELD_ENCRYPTION_KEY not set - sensitive fields will not be encrypted");
    return false;
  }

  const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `FIELD_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters), got ${keyBuffer.length} bytes`
    );
  }
  return true;
}

/**
 * Encrypt a sensitive field value
 * @param {string} plaintext - Value to encrypt
 * @returns {string|null} - Encrypted value in format "iv:authTag:ciphertext" or null if input is null/empty
 */
export function encryptField(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return null;
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("FIELD_ENCRYPTION_KEY not configured");
  }

  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(plaintext), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted field value
 * @param {string} encryptedData - Value in format "iv:authTag:ciphertext"
 * @returns {string|null} - Decrypted plaintext or null if input is null
 */
export function decryptField(encryptedData) {
  if (encryptedData === null || encryptedData === undefined || encryptedData === "") {
    return null;
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("FIELD_ENCRYPTION_KEY not configured");
  }

  const parts = String(encryptedData).split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a value is encrypted (for migration/conditional handling)
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function isEncrypted(value) {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(":");
  return parts.length === 3 && 
         parts[0].length === IV_LENGTH * 2 && 
         parts[1].length === AUTH_TAG_LENGTH * 2;
}

/**
 * Encrypt sensitive fields in a business data object
 * @param {Object} data - Business data object
 * @returns {Object} - Data with sensitive fields encrypted
 */
export function encryptBusinessSensitiveFields(data) {
  if (!data || typeof data !== "object") return data;

  const encrypted = { ...data };
  const sensitiveFields = [
    "idCardNumber",
    "bankAccountNumber", 
    "bankAccountOwner",
    "taxCode"
  ];

  sensitiveFields.forEach(field => {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      // Chỉ encrypt nếu chưa encrypted
      if (!isEncrypted(encrypted[field])) {
        encrypted[field] = encryptField(encrypted[field]);
      }
    }
  });

  return encrypted;
}

/**
 * Decrypt sensitive fields in a business data object
 * @param {Object} data - Business data object with encrypted fields
 * @param {Object} options - Options
 * @param {boolean} options.mask - Whether to mask instead of full decrypt for display
 * @returns {Object} - Data with sensitive fields decrypted
 */
export function decryptBusinessSensitiveFields(data, options = {}) {
  if (!data || typeof data !== "object") return data;

  const { mask = false } = options;
  const decrypted = { ...data };
  
  // Map database field names to API field names
  const fieldMapping = {
    idCardNumber: "idCardNumber",
    bankAccount: "bankAccountNumber",
    bankOwner: "bankAccountOwner",
    taxCode: "taxCode"
  };

  Object.entries(fieldMapping).forEach(([dbField, apiField]) => {
    const value = decrypted[dbField];
    if (value !== undefined && value !== null && isEncrypted(value)) {
      const plainValue = decryptField(value);
      
      if (mask) {
        // Thêm field masked, giữ field gốc encrypted
        decrypted[`${apiField}Masked`] = maskSensitiveValue(plainValue, dbField);
      } else {
        // Decrypt vào field gốc cho internal processing
        decrypted[dbField] = plainValue;
      }
    }
  });

  return decrypted;
}

/**
 * Mask sensitive value for display
 * @param {string} value - Plain text value
 * @param {string} fieldType - Type of field for specific masking rules
 * @returns {string}
 */
function maskSensitiveValue(value, fieldType) {
  if (!value) return null;
  const s = String(value);
  
  switch (fieldType) {
    case "idCardNumber":
      // CCCD: ****1234
      return s.length > 4 ? "*".repeat(s.length - 4) + s.slice(-4) : "*".repeat(s.length);
    case "bankAccount":
    case "bankAccountNumber":
      // Bank: ****5678
      return s.length > 4 ? "*".repeat(s.length - 4) + s.slice(-4) : "*".repeat(s.length);
    case "bankOwner":
    case "bankAccountOwner":
      // Owner: N***n
      return s.length > 2 ? s[0] + "*".repeat(s.length - 2) + s[s.length - 1] : "*".repeat(s.length);
    case "taxCode":
      // Tax: ***4567
      return s.length > 4 ? "*".repeat(s.length - 4) + s.slice(-4) : "*".repeat(s.length);
    default:
      return "*".repeat(s.length);
  }
}

/**
 * Generate a new encryption key
 * Run: node -e "require('./src/utils/fieldEncryption.js').generateKey()"
 */
export function generateKey() {
  const key = crypto.randomBytes(KEY_LENGTH).toString("hex");
  // Use stderr to avoid key being captured by log collectors on stdout
  process.stderr.write("\n=== FIELD_ENCRYPTION_KEY ===\n");
  process.stderr.write(key + "\n");
  process.stderr.write("=============================\n");
  process.stderr.write("Add this to your .env file:\n");
  process.stderr.write(`FIELD_ENCRYPTION_KEY=${key}\n\n`);
  return key;
}

export default {
  validateEncryptionKey,
  encryptField,
  decryptField,
  isEncrypted,
  encryptBusinessSensitiveFields,
  decryptBusinessSensitiveFields,
  generateKey,
};
