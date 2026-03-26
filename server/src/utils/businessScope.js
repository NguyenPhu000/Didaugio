import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

/**
 * Admin: bắt buộc `businessId` (query hoặc body). Business owner: lấy theo owner.
 * @returns {Promise<number | null>}
 */
export async function resolveBusinessId(req) {
  if (req.user.roleId <= ROLES.ADMIN) {
    const raw = req.query.businessId ?? req.body?.businessId;
    const id = parseInt(raw, 10);
    return Number.isFinite(id) ? id : null;
  }
  const b = await prisma.business.findUnique({
    where: { ownerId: req.user.userId },
    select: { id: true },
  });
  return b?.id ?? null;
}
