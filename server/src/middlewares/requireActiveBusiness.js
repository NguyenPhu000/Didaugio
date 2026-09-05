import prisma from "../config/prismaClient.js";
import {
  ROLES,
  BUSINESS_STATUS,
  CURRENT_CONTRACT_VERSION,
} from "../config/constants.js";

const BUSINESS_SELECT = {
  id: true,
  status: true,
  contractSigned: true,
  contractSignedAt: true,
  contractVersion: true,
};

const sendError = (res, status, message, errorCode) =>
  res.status(status).json({ success: false, data: null, message, errorCode });

const getBusinessForUser = async (userId, roleId) => {
  if (roleId !== ROLES.STAFF) {
    return {
      business: await prisma.business.findUnique({
        where: { ownerId: userId },
        select: BUSINESS_SELECT,
      }),
      isStaff: false,
      hasBusinessAssignment: true,
    };
  }

  const staffUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true },
  });

  if (!staffUser?.businessId) {
    return { business: null, isStaff: true, hasBusinessAssignment: false };
  }

  return {
    business: await prisma.business.findUnique({
      where: { id: staffUser.businessId },
      select: BUSINESS_SELECT,
    }),
    isStaff: true,
    hasBusinessAssignment: true,
  };
};

const getAccessError = ({ business, isStaff, method, requireContractSigned }) => {
  if (
    isStaff &&
    [BUSINESS_STATUS.SUSPENDED, BUSINESS_STATUS.TERMINATED].includes(
      business.status,
    )
  ) {
    return [
      403,
      "Doanh nghiệp đã bị tạm ngừng hoặc chấm dứt. Vui lòng liên hệ quản trị viên.",
      "BUSINESS_SUSPENDED",
    ];
  }

  if (business.status === BUSINESS_STATUS.TERMINATED) {
    return [
      410,
      "Hợp đồng doanh nghiệp đã chấm dứt. Tài khoản ở chế độ chỉ đọc.",
      "BUSINESS_TERMINATED",
    ];
  }

  if (
    [BUSINESS_STATUS.SUSPICIOUS, BUSINESS_STATUS.SUSPENDED].includes(
      business.status,
    ) &&
    method !== "GET"
  ) {
    return business.status === BUSINESS_STATUS.SUSPICIOUS
      ? [
          423,
          "Tài khoản doanh nghiệp đang bị khóa do hoạt động đáng ngờ. Vui lòng liên hệ quản trị viên.",
          "BUSINESS_SUSPICIOUS",
        ]
      : [423, "Doanh nghiệp đang tạm ngừng hoạt động", "BUSINESS_SUSPENDED"];
  }

  if (business.status !== BUSINESS_STATUS.APPROVED) {
    return [
      422,
      "Doanh nghiệp chưa được duyệt để vận hành",
      "BUSINESS_NOT_APPROVED",
    ];
  }

  if (requireContractSigned && !business.contractSigned) {
    return [
      403,
      "Vui lòng ký hợp đồng trước khi sử dụng tính năng này",
      "CONTRACT_REQUIRED",
    ];
  }

  if (
    requireContractSigned &&
    business.contractVersion !== CURRENT_CONTRACT_VERSION
  ) {
    return [
      403,
      "Hợp đồng đã có phiên bản mới. Vui lòng ký lại để tiếp tục.",
      "CONTRACT_RENEWAL_REQUIRED",
    ];
  }

  return null;
};

/**
 * Gate business-owner operations by profile existence, status, and contract state.
 * Admin roles bypass this check. Staff users are resolved via businessId.
 */
export const requireActiveBusiness = (options = {}) => {
  const { requireContractSigned = false } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const roleId = req.user?.roleId;

      if (!userId || !roleId) {
        return sendError(
          res,
          401,
          "Vui lòng đăng nhập để tiếp tục",
          "UNAUTHORIZED",
        );
      }

      if (roleId <= ROLES.ADMIN) return next();

      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true },
      });

      if (!userRecord?.emailVerified) {
        return sendError(
          res,
          403,
          "Vui lòng xác thực email trước khi sử dụng tính năng này",
          "EMAIL_NOT_VERIFIED",
        );
      }

      const { business, isStaff, hasBusinessAssignment } =
        await getBusinessForUser(userId, roleId);

      if (isStaff && !hasBusinessAssignment) {
        return sendError(
          res,
          403,
          "Bạn chưa được gán cho doanh nghiệp nào",
          "NO_BUSINESS_PROFILE",
        );
      }

      if (!business) {
        return sendError(
          res,
          403,
          "Bạn chưa đăng ký doanh nghiệp",
          "NO_BUSINESS_PROFILE",
        );
      }

      const accessError = getAccessError({
        business,
        isStaff,
        method: req.method,
        requireContractSigned,
      });
      if (accessError) return sendError(res, ...accessError);

      req.activeBusiness = business;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default requireActiveBusiness;
