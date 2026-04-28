/**
 * Shared serialization utilities for Business entity.
 * Maps API field names <-> Prisma schema (bankAccountNumber <-> bankAccount, etc.)
 */

import { sanitizeOptionalText } from "../../utils/sanitizeText.js";
import { encryptField, decryptField, isEncrypted } from "../../utils/fieldEncryption.js";

const maskMiddle = (value, { keepStart = 0, keepEnd = 4 } = {}) => {
  if (value == null || value === "") return null;

  const s = String(value);
  const visibleStart = Math.max(0, Math.min(keepStart, s.length));
  const visibleEnd = Math.max(0, Math.min(keepEnd, s.length - visibleStart));
  const hiddenCount = s.length - visibleStart - visibleEnd;

  if (hiddenCount <= 0) return s;

  return `${s.slice(0, visibleStart)}${"*".repeat(hiddenCount)}${s.slice(s.length - visibleEnd)}`;
};

const sanitizeOptionalNullable = (value, { collapseWhitespace = true } = {}) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return sanitizeOptionalText(value, { collapseWhitespace });
};

const sanitizeDigits = (value) => {
  const sanitized = sanitizeOptionalNullable(value, { collapseWhitespace: false });
  if (sanitized == null) return sanitized;
  return String(sanitized).replace(/\s+/g, "");
};

const sanitizeBankAccount = (value) => {
  const digits = sanitizeDigits(value);
  if (digits == null) return digits;
  return /^\d{6,30}$/.test(digits) ? digits : null;
};

export const serializeBusiness = (business, options = {}) => {
  if (!business) return null;
  
  const { decryptSensitive = false } = options;
  const { bankAccount, bankOwner, ...rest } = business;
  
  // Helper to get display value (decrypt if needed, then mask)
  const getDisplayValue = (encryptedValue, maskOptions) => {
    if (encryptedValue === null || encryptedValue === undefined) return null;
    
    // If encrypted, try to decrypt first
    let plainValue = encryptedValue;
    if (isEncrypted(encryptedValue)) {
      if (decryptSensitive) {
        try {
          plainValue = decryptField(encryptedValue);
        } catch {
          plainValue = null;
        }
      } else {
        // Can't mask without decrypting, return indicator
        return "***ENCRYPTED***";
      }
    }
    
    return maskMiddle(plainValue, maskOptions);
  };
  
  const result = {
    ...rest,
    commissionRate:
      business.commissionRate != null ? Number(business.commissionRate) : null,
    // Never expose raw encrypted values or full decrypted values
    bankAccountNumber: null,
    bankAccountOwner: null,
    idCardNumber: null,
    // Only expose masked versions
    idCardNumberMasked: getDisplayValue(business.idCardNumber, { keepStart: 0, keepEnd: 4 }),
    bankAccountNumberMasked: getDisplayValue(bankAccount, { keepStart: 0, keepEnd: 4 }),
    bankAccountOwnerMasked: getDisplayValue(bankOwner, { keepStart: 1, keepEnd: 0 }),
    // Include bankName (not sensitive)
    bankName: business.bankName || null,
  };
  
  if (result.owner) {
    result.owner = {
      id: result.owner.id,
      email: result.owner.email,
      fullName: result.owner.profile?.fullName ?? null,
      phone: result.owner.profile?.phone ?? null,
      address: result.owner.profile?.address ?? null,
    };
  }
  return result;
};

/** Map API field names to Prisma schema (bankAccountNumber -> bankAccount, etc.) */
export const mapBusinessDataToPrisma = (data) => {
  const {
    bankAccountNumber,
    bankAccountOwner,
    bankName,
    commissionRate,
    contractSigned,
    approvedBy,
    approvedAt,
    rejectionReason,
    status,
    businessName,
    taxCode,
    idCardNumber,
    idCardFront,
    idCardBack,
    businessLicense,
    fullName,
    phone,
    address,
    ...rest
  } = data;

  // Ignore admin-only lifecycle fields in owner profile update flows.
  void commissionRate;
  void contractSigned;
  void approvedBy;
  void approvedAt;
  void rejectionReason;
  void status;

  // Helper to encrypt if encryption key is configured
  const encryptIfConfigured = (value) => {
    if (value === null || value === undefined) return value;
    // Only encrypt if not already encrypted
    if (isEncrypted(value)) return value;
    try {
      return encryptField(value) ?? value;
    } catch {
      // If encryption fails, return original value (should not happen in production)
      return value;
    }
  };

  return {
    ...rest,
    ...(businessName !== undefined && {
      businessName: sanitizeOptionalNullable(businessName),
    }),
    ...(taxCode !== undefined && {
      taxCode: encryptIfConfigured(
        sanitizeOptionalNullable(taxCode, { collapseWhitespace: false })
      ),
    }),
    ...(idCardNumber !== undefined && {
      idCardNumber: encryptIfConfigured(sanitizeDigits(idCardNumber)),
    }),
    ...(idCardFront !== undefined && {
      idCardFront: sanitizeOptionalNullable(idCardFront, {
        collapseWhitespace: false,
      }),
    }),
    ...(idCardBack !== undefined && {
      idCardBack: sanitizeOptionalNullable(idCardBack, {
        collapseWhitespace: false,
      }),
    }),
    ...(businessLicense !== undefined && {
      businessLicense: sanitizeOptionalNullable(businessLicense, {
        collapseWhitespace: false,
      }),
    }),
    ...(bankAccountNumber !== undefined && {
      bankAccount: encryptIfConfigured(sanitizeBankAccount(bankAccountNumber)),
    }),
    ...(bankAccountOwner !== undefined && {
      bankOwner: encryptIfConfigured(sanitizeOptionalNullable(bankAccountOwner)),
    }),
    ...(bankName !== undefined && {
      bankName: sanitizeOptionalNullable(bankName),
    }),
  };
};
