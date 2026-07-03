/**
 * File Encryption Service — AES-256-GCM cho file binary
 * Sử dụng FIELD_ENCRYPTION_KEY từ .env (shared với fieldEncryption.js)
 */

import crypto from "crypto";
import fs from "fs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Lấy encryption key từ env, validate đúng 32 bytes (64 hex chars)
 */
const getKey = () => {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  }
  return Buffer.from(keyHex, "hex");
};

/**
 * Encrypt a file buffer using AES-256-GCM
 * @param {Buffer} buffer - Raw file buffer
 * @returns {{ encrypted: Buffer, iv: string, authTag: string }}
 */
export const encryptFile = (buffer) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};

/**
 * Decrypt an encrypted file buffer
 * @param {Buffer} encryptedBuffer
 * @param {string} ivHex
 * @param {string} authTagHex
 * @returns {Buffer} Decrypted buffer
 */
export const decryptFile = (encryptedBuffer, ivHex, authTagHex) => {
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

/**
 * Stream-based encryption — ghi IV vào đầu file, encrypt qua Transform stream
 * Dùng cho file lớn để tránh OOM
 * @param {string} inputPath - Đường dẫn file gốc
 * @param {string} outputPath - Đường dẫn file mã hóa
 * @returns {Promise<{ iv: string, authTag: string }>}
 */
export const encryptFileStream = async (inputPath, outputPath) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    // Ghi IV vào đầu file để giải mã sau
    output.write(iv);

    input.pipe(cipher).pipe(output);

    // getAuthTag() phải ở cipher 'end', KHÔNG phải output 'finish'
    let authTag = null;
    cipher.on("end", () => {
      authTag = cipher.getAuthTag().toString("hex");
    });

    output.on("finish", () => {
      resolve({
        iv: iv.toString("hex"),
        authTag,
      });
    });

    output.on("error", (err) => {
      input.destroy();
      reject(err);
    });
    input.on("error", (err) => {
      output.destroy();
      cipher.destroy();
      reject(err);
    });
    cipher.on("error", (err) => {
      input.destroy();
      output.destroy();
      reject(err);
    });
  });
};

/**
 * Compute SHA-256 checksum of a buffer
 * @param {Buffer} buffer
 * @returns {string} Hex-encoded checksum
 */
export const computeChecksum = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");
