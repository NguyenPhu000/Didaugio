import fs from "node:fs/promises";
import path from "node:path";
import { computeChecksum, decryptFile } from "./fileEncryption.service.js";

const resolveEncryptedPath = (storageDirectory, encryptedPath) => {
  if (!encryptedPath || path.basename(encryptedPath) !== encryptedPath) return null;
  return path.join(storageDirectory, encryptedPath);
};

export const verifyEncryptedStorageRecord = async (
  record,
  { storageDirectory } = {},
) => {
  const filePath = resolveEncryptedPath(storageDirectory, record?.encryptedPath);
  if (!filePath) return { ok: false, reason: "invalid_path" };

  let encrypted;
  try {
    encrypted = await fs.readFile(filePath);
  } catch (error) {
    return { ok: false, reason: error.code === "ENOENT" ? "missing_file" : "read_error" };
  }

  let plain;
  try {
    plain = decryptFile(encrypted, record.iv, record.authTag);
  } catch {
    return { ok: false, reason: "decrypt_failed" };
  }

  return computeChecksum(plain) === record.checksum
    ? { ok: true }
    : { ok: false, reason: "checksum_mismatch" };
};
