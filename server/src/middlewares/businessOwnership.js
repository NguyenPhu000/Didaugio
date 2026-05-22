import prisma from "../config/prismaClient.js";
import { ROLES } from "../config/constants.js";
import { ERROR_CODES } from "../config/messages.js";

export const checkBusinessOwnership =
  (resourceType) => async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const roleId = req.user.roleId;

      if (roleId <= ROLES.ADMIN) return next();

      // Staff: look up business via user.businessId
      let business;
      if (roleId === ROLES.STAFF) {
        const staffUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { businessId: true },
        });
        if (!staffUser?.businessId) {
          return res.status(403).json({
            success: false,
            data: null,
            message: "Bạn chưa được gán cho doanh nghiệp nào",
            errorCode: "NO_BUSINESS_PROFILE",
          });
        }
        business = await prisma.business.findUnique({
          where: { id: staffUser.businessId },
          select: { id: true },
        });
      } else {
        business = await prisma.business.findUnique({
          where: { ownerId: userId },
          select: { id: true },
        });
      }

      if (!business) {
        return res.status(403).json({
          success: false,
          data: null,
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
          data: null,
          message: "Loại tài nguyên không hợp lệ",
          errorCode: ERROR_CODES.SERVER_ERROR,
        });
      }

      const resource = await checker();
      if (!resource) {
        return res.status(403).json({
          success: false,
          data: null,
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
        data: null,
        message: "Lỗi kiểm tra quyền sở hữu",
        errorCode: ERROR_CODES.SERVER_ERROR,
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

    let business;
    if (roleId === ROLES.STAFF) {
      const staffUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { businessId: true },
      });
      if (staffUser?.businessId) {
        business = await prisma.business.findUnique({
          where: { id: staffUser.businessId },
          select: { id: true, status: true, businessName: true },
        });
      }
    } else {
      business = await prisma.business.findUnique({
        where: { ownerId: userId },
        select: { id: true, status: true, businessName: true },
      });
    }

    req.business = business;
    next();
  } catch (error) {
    console.error("Load business error:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Lỗi tải thông tin doanh nghiệp",
      errorCode: ERROR_CODES.SERVER_ERROR,
    });
  }
};

export const checkBusinessOwnershipByBookingCode = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const roleId = req.user.roleId;

    if (roleId <= ROLES.ADMIN) return next();

    let business;
    if (roleId === ROLES.STAFF) {
      const staffUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { businessId: true },
      });
      if (!staffUser?.businessId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn chưa được gán cho doanh nghiệp nào",
          errorCode: "NO_BUSINESS_PROFILE",
        });
      }
      business = await prisma.business.findUnique({
        where: { id: staffUser.businessId },
        select: { id: true },
      });
    } else {
      business = await prisma.business.findUnique({
        where: { ownerId: userId },
        select: { id: true },
      });
    }

    if (!business) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Bạn chưa đăng ký doanh nghiệp",
        errorCode: "NO_BUSINESS_PROFILE",
      });
    }

    const bookingCode = String(req.body?.bookingCode || "")
      .trim()
      .toUpperCase();

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Thiếu mã booking",
        errorCode: ERROR_CODES.MISSING_PARAMS,
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      select: { id: true, businessId: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Booking không tồn tại",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (booking.businessId !== business.id) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không phải business của booking này",
        errorCode: "FORBIDDEN_NOT_OWNER",
      });
    }

    req.business = business;
    req.resource = booking;
    next();
  } catch (error) {
    console.error("Business ownership by bookingCode error:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Lỗi kiểm tra quyền sở hữu",
      errorCode: ERROR_CODES.SERVER_ERROR,
    });
  }
};

export default {
  checkBusinessOwnership,
  checkBusinessOwnershipByBookingCode,
  loadBusiness,
};
