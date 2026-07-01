import prisma from "../config/prismaClient.js";
import { ROLES, isAdminOrSuperAdminRole } from "../config/constants.js";

/**
 * Admin: bắt buộc `businessId` (query hoặc body).
 * Business owner: lấy theo owner.
 * Staff: lấy theo user.businessId.
 * @returns {Promise<number | null>}
 */
export async function resolveBusinessId(req) {
  if (isAdminOrSuperAdminRole(req.user.roleId)) {
    const raw = req.query.businessId ?? req.body?.businessId;
    const id = parseInt(raw, 10);
    return Number.isFinite(id) ? id : null;
  }

  // Staff: resolve via businessId on user record
  if (req.user.roleId === ROLES.STAFF) {
    const staffUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { businessId: true },
    });
    return staffUser?.businessId ?? null;
  }

  const b = await prisma.business.findUnique({
    where: { ownerId: req.user.userId },
    select: { id: true },
  });
  return b?.id ?? null;
}
