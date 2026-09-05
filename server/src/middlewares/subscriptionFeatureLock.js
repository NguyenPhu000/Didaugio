import { checkFeatureLock } from "../services/subscription/subscription.service.js";
import { ROLES } from "../config/constants.js";
import logger from "../config/logger.js";

export async function requireActiveSubscription(req, res, next) {
  try {
    const roleId = req.user?.roleId;
    if (roleId && roleId <= ROLES.ADMIN) return next();

    const businessId = req.activeBusiness?.id;
    if (!businessId) return next();

    const { locked, reason } = await checkFeatureLock(businessId);
    if (!locked) return next();

    logger.warn(`[subscription-lock] business#${businessId} locked: ${reason}`);
    return res.status(403).json({
      success: false,
      data: null,
      message: "Dịch vụ đã bị khóa do quá hạn thanh toán. Vui lòng gia hạn gói dịch vụ.",
      errorCode: "SUBSCRIPTION_LOCKED",
      details: { reason },
    });
  } catch (error) {
    logger.error("[subscription-lock] middleware error", error);
    return next(error);
  }
}
