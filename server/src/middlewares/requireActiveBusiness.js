import prisma from "../config/prismaClient.js";
import { ROLES, BUSINESS_STATUS } from "../config/constants.js";

/** Current contract version — bump to force re-signing */
const CURRENT_CONTRACT_VERSION = "v1";

/**
 * Gate business-owner operations by profile existence, status, and contract state.
 * Admin roles bypass this check. Staff users resolved via businessId.
 */
export const requireActiveBusiness = (options = {}) => {
  const { requireContractSigned = false } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "Vui lòng đăng nhập để tiếp tục",
          errorCode: "UNAUTHORIZED",
        });
      }

      if (roleId <= ROLES.ADMIN) {
        return next();
      }

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
          select: {
            id: true,
            status: true,
            contractSigned: true,
            contractSignedAt: true,
            contractVersion: true,
          },
        });
      } else {
        business = await prisma.business.findUnique({
          where: { ownerId: userId },
          select: {
            id: true,
            status: true,
            contractSigned: true,
            contractSignedAt: true,
            contractVersion: true,
          },
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

      if (business.status === BUSINESS_STATUS.TERMINATED) {
        return res.status(410).json({
          success: false,
          data: null,
          message: "Hợp đồng doanh nghiệp đã chấm dứt. Tài khoản ở chế độ chỉ đọc.",
          errorCode: "BUSINESS_TERMINATED",
        });
      }

      if (business.status === BUSINESS_STATUS.SUSPICIOUS) {
        // Allow read-only access for GET requests
        if (req.method === "GET") {
          req.activeBusiness = business;
          return next();
        }
        return res.status(423).json({
          success: false,
          data: null,
          message: "Tài khoản doanh nghiệp đang bị khóa do hoạt động đáng ngờ. Vui lòng liên hệ quản trị viên.",
          errorCode: "BUSINESS_SUSPICIOUS",
        });
      }

      if (business.status === BUSINESS_STATUS.SUSPENDED) {
        // Allow read-only access for GET requests
        if (req.method === "GET") {
          req.activeBusiness = business;
          return next();
        }
        return res.status(423).json({
          success: false,
          data: null,
          message: "Doanh nghiệp đang tạm ngưng hoạt động",
          errorCode: "BUSINESS_SUSPENDED",
        });
      }

      if (business.status !== BUSINESS_STATUS.APPROVED) {
        return res.status(422).json({
          success: false,
          data: null,
          message: "Doanh nghiệp chưa được duyệt để vận hành",
          errorCode: "BUSINESS_NOT_APPROVED",
        });
      }

      if (requireContractSigned && !business.contractSigned) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Vui lòng ký hợp đồng trước khi sử dụng tính năng này",
          errorCode: "CONTRACT_REQUIRED",
        });
      }

      // Check if contract needs renewal (version mismatch)
      if (
        requireContractSigned &&
        business.contractSigned &&
        business.contractVersion !== CURRENT_CONTRACT_VERSION
      ) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Hợp đồng đã có phiên bản mới. Vui lòng ký lại để tiếp tục.",
          errorCode: "CONTRACT_RENEWAL_REQUIRED",
        });
      }

      req.activeBusiness = business;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireActiveBusiness;
