import { checkFeatureLock } from "../services/subscription/subscription.service.js";
import { ROLES } from "../config/constants.js";
import logger from "../config/logger.js";

/**
 * Middleware kiem tra subscription feature lock.
 * ────────────────────────────────────────────────────────────────────────────
 * Ap dung cho cac route cua business can subscription active.
 * Neu subscription past_due/canceled → tra 403 voi errorCode SUBSCRIPTION_LOCKED.
 *
 * Usage:
 *   router.get("/bookings", auth, requireActiveBusiness(), requireActiveSubscription, controller.list);
 *
 * Bo qua cho SUPER_ADMIN va ADMIN.
 */
export async function requireActiveSubscription(req, res, next) {
  try {
    // Admin/Super Admin bypass
    const roleId = req.user?.roleId;
    if (roleId && roleId <= ROLES.ADMIN) {
      return next();
    }

    const businessId = req.activeBusiness?.id;
    if (!businessId) {
      return next(); // Khong co business → khong lien quan subscription
    }

    const { locked, reason } = await checkFeatureLock(businessId);

    if (locked) {
      logger.warn(
        `[subscription-lock] business#${businessId} bi khoa: ${reason}`,
      );
      return res.status(403).json({
        success: false,
        data: null,
        message: "Dich vu da bi khoa do qua han thanh toan. Vui long gia han subscription.",
        errorCode: "SUBSCRIPTION_LOCKED",
        details: { reason },
      });
    }

    next();
  } catch (err) {
    logger.error("[subscription-lock] middleware error", err);
    next(); // Loi → cho qua, tranh block hoan toan
  }
}
