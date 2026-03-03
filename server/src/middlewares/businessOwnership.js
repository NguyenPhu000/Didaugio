import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";

export const checkBusinessOwnership = (resourceType) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    if (roleId <= ROLES.ADMIN) return next();

    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        message: "Bạn chưa đăng ký doanh nghiệp",
        errorCode: "NO_BUSINESS_PROFILE",
      });
    }

    const resourceChecks = {
      booking: () =>
        prisma.booking.findFirst({
          where: { id: parseInt(id), service: { businessId: business.id } },
        }),
      service: () =>
        prisma.businessService.findFirst({
          where: { id: parseInt(id), businessId: business.id },
        }),
      voucher: () =>
        prisma.voucher.findFirst({
          where: { id: parseInt(id), businessId: business.id },
        }),
    };

    const checker = resourceChecks[resourceType];
    if (!checker) {
      return res.status(500).json({
        success: false,
        message: "Loại tài nguyên không hợp lệ",
      });
    }

    const resource = await checker();
    if (!resource) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này",
        errorCode: "FORBIDDEN_NOT_OWNER",
      });
    }

    req.business = business;
    req.resource = resource;
    next();
  } catch (error) {
    console.error("Business ownership check error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra quyền sở hữu",
    });
  }
};

export const loadBusiness = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    if (roleId <= ROLES.ADMIN) {
      req.business = null;
      return next();
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true, status: true, businessName: true },
    });

    req.business = business;
    next();
  } catch (error) {
    console.error("Load business error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tải thông tin doanh nghiệp",
    });
  }
};

export default { checkBusinessOwnership, loadBusiness };
