import prisma from "../config/prismaClient.js";
import { ROLES, BUSINESS_STATUS } from "../config/constants.js";

/**
 * Gate business-owner operations by profile existence, status, and contract state.
 * Admin roles bypass this check.
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

      const business = await prisma.business.findUnique({
        where: { ownerId: userId },
        select: {
          id: true,
          status: true,
          contractSigned: true,
          contractSignedAt: true,
        },
      });

      if (!business) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Bạn chưa đăng ký doanh nghiệp",
          errorCode: "NO_BUSINESS_PROFILE",
        });
      }

      if (business.status === BUSINESS_STATUS.SUSPENDED) {
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

      req.activeBusiness = business;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireActiveBusiness;
