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

  const { decryptSensitive = false, includeDocumentUrls = false } = options;
  // Destructure out sensitive fields and documents to prevent them from being leaked in ...rest
  const { bankAccount, bankOwner, taxCode, idCardFront, idCardBack, businessLicense, sensitiveDocuments, ...rest } = business;

  const getDecryptedValue = (encryptedValue) => {
    if (encryptedValue === null || encryptedValue === undefined) return null;
    if (isEncrypted(encryptedValue)) {
      try {
        return decryptField(encryptedValue);
      } catch {
        return null;
      }
    }
    return encryptedValue;
  };

  // Helper to get display value (decrypt if needed, then mask)
  const getDisplayValue = (encryptedValue, maskOptions) => {
    if (encryptedValue === null || encryptedValue === undefined) return null;

    // If encrypted, try to decrypt first
    let plainValue = encryptedValue;
    if (isEncrypted(encryptedValue)) {
      if (decryptSensitive || true) { // Allow internal masking even if decryptSensitive is false by decrypting internally
        try {
          plainValue = decryptField(encryptedValue);
        } catch {
          plainValue = null;
        }
      } else {
        return "***ENCRYPTED***";
      }
    }

    return maskMiddle(plainValue, maskOptions);
  };

  // Derive document presence flags from sensitiveDocuments relation (if included)
  const docTypes = new Set((sensitiveDocuments ?? []).map((d) => d.type));

  const result = {
    ...rest,
    commissionRate:
      business.commissionRate != null ? Number(business.commissionRate) : null,
    // Return raw plain text only if explicitly requested (authorized context)
    bankAccountNumber: decryptSensitive ? getDecryptedValue(bankAccount) : null,
    bankAccountOwner: decryptSensitive ? getDecryptedValue(bankOwner) : null,
    idCardNumber: decryptSensitive ? getDecryptedValue(business.idCardNumber) : null,
    taxCode: decryptSensitive ? getDecryptedValue(taxCode) : null,
    
    // Masked versions for public/standard displays
    idCardNumberMasked: getDisplayValue(business.idCardNumber, { keepStart: 0, keepEnd: 4 }),
    bankAccountNumberMasked: getDisplayValue(bankAccount, { keepStart: 0, keepEnd: 4 }),
    bankAccountOwnerMasked: getDisplayValue(bankOwner, { keepStart: 1, keepEnd: 0 }),
    taxCodeMasked: getDisplayValue(taxCode, { keepStart: 0, keepEnd: 4 }),
    
    // Include bankName (not sensitive)
    bankName: business.bankName || null,
    // Document presence flags — boolean, no URLs exposed
    hasIdCardFront: docTypes.has("id_card_front") || Boolean(idCardFront),
    hasIdCardBack: docTypes.has("id_card_back") || Boolean(idCardBack),
    hasBusinessLicense: docTypes.has("business_license") || Boolean(businessLicense),
  };

  // Include document URLs only for authorized contexts (owner viewing own profile)
  if (includeDocumentUrls) {
    result.idCardFront = idCardFront || null;
    result.idCardBack = idCardBack || null;
    result.businessLicense = businessLicense || null;
  }
  
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
