import prisma from "../../config/prismaClient.js";

/**
 * GET /api/business/roles
 * Lấy danh sách business roles (default + custom của business)
 */
export const getDefaultRoles = async (req, res, next) => {
  try {
    const businessId = req.activeBusiness?.id;

    const roles = await prisma.businessRole.findMany({
      where: {
        OR: [
          { isDefault: true, businessId: null },
          ...(businessId ? [{ businessId }] : []),
        ],
      },
      select: { id: true, name: true, description: true, isDefault: true },
      orderBy: { id: "asc" },
    });

    res.json({ success: true, data: roles, message: "OK" });
  } catch (error) {
    next(error);
  }
};

export default { getDefaultRoles };
