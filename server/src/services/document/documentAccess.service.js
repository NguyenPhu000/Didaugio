import prisma from "../../config/prismaClient.js";
import { isAdminOrSuperAdminRole } from "../../config/constants.js";

export const canAccessBusinessDocuments = async ({
  businessId,
  userId,
  roleId,
  findBusiness = (query) => prisma.business.findFirst(query),
}) => {
  if (isAdminOrSuperAdminRole(roleId)) return true;

  const numericBusinessId = Number.parseInt(businessId, 10);
  if (!Number.isInteger(numericBusinessId) || numericBusinessId <= 0 || !userId) {
    return false;
  }

  const business = await findBusiness({
    where: { id: numericBusinessId, ownerId: userId },
    select: { id: true },
  });

  return Boolean(business);
};
