/**
 * Shared serialization utilities for Business entity.
 * Maps API field names <-> Prisma schema (bankAccountNumber <-> bankAccount, etc.)
 */

export const serializeBusiness = (business) => {
  if (!business) return null;
  const { bankAccount, bankOwner, ...rest } = business;
  const result = {
    ...rest,
    commissionRate:
      business.commissionRate != null ? Number(business.commissionRate) : null,
    bankAccountNumber: bankAccount ?? null,
    bankAccountOwner: bankOwner ?? null,
  };
  if (result.owner) {
    result.owner = {
      id: result.owner.id,
      email: result.owner.email,
      fullName: result.owner.profile?.fullName ?? null,
    };
  }
  return result;
};

/** Map API field names to Prisma schema (bankAccountNumber -> bankAccount, etc.) */
export const mapBusinessDataToPrisma = (data) => {
  const {
    bankAccountNumber,
    bankAccountOwner,
    commissionRate,
    contractSigned,
    approvedBy,
    approvedAt,
    rejectionReason,
    status,
    ...rest
  } = data;

  // Ignore admin-only lifecycle fields in owner profile update flows.
  void commissionRate;
  void contractSigned;
  void approvedBy;
  void approvedAt;
  void rejectionReason;
  void status;

  return {
    ...rest,
    ...(bankAccountNumber !== undefined && { bankAccount: bankAccountNumber }),
    ...(bankAccountOwner !== undefined && { bankOwner: bankAccountOwner }),
  };
};
