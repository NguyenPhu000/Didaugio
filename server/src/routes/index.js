import userRoutes from "./user/user.route.js";
import authRoutes from "./auth/auth.route.js";
import profileRoutes from "./profile/profile.route.js";
import auditLogRoutes from "./activity/auditLog.route.js";
import emailVerificationRoutes from "./activity/emailVerification.route.js";
import passwordResetRoutes from "./activity/passwordReset.route.js";
import loginHistoryRoutes from "./activity/loginHistory.route.js";
import roleRoutes from "./rbac/role.route.js";
import permissionRoutes from "./rbac/permission.route.js";
import userPermissionRoutes from "./rbac/userPermission.route.js";
import categoryRoutes from "./category/category.route.js";
import tagRoutes from "./tag/tag.route.js";
import placeRoutes from "./place/place.route.js";
import districtRoutes from "./district/district.route.js";
import wardRoutes from "./district/ward.route.js";
import boundaryRoutes from "./boundary/boundary.route.js";
import settingsRoutes from "./settings/settings.route.js";
import businessRoutes from "./business/business.route.js";
import businessOfferingRoutes from "./businessOffering/businessOffering.route.js";
import bookingRoutes from "./booking/booking.route.js";
import bookingPublicRoutes from "./booking/bookingPublic.route.js";
import autoApproveRuleRoutes from "./autoApproveRule/autoApproveRule.route.js";
import voucherRoutes from "./voucher/voucher.route.js";
import reviewRoutes from "./review/review.route.js";
import feedbackRoutes from "./feedback/feedback.route.js";
import serviceBookingRoutes from "./booking/serviceBooking.route.js";
import aiRoutes from "./ai/ai.route.js";
import routingRoutes from "../modules/routing/routing.routes.js";
import navigationRoutes from "../modules/navigation/navigation.routes.js";
import {
  authLimiter,
  apiLimiter,
  refreshLimiter,
  recoveryLimiter,
  routingLimiter,
  aiNavigateLimiter,
  navigationLimiter,
  navigationTelemetryLimiter,
} from "../middlewares/rateLimitMiddleware.js";

export const registerRateLimiters = (app) => {
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/google", authLimiter);
  app.use("/api/auth/refresh", refreshLimiter);
  app.use("/api/auth/forgot-password", recoveryLimiter);
  app.use("/api/auth/reset-password", recoveryLimiter);
  app.use("/api/auth/resend-verification-public", recoveryLimiter);
  app.use("/api/routes", routingLimiter);
  app.use("/api/ai/navigate", aiNavigateLimiter);
  app.use("/api/navigation/navigate", navigationLimiter);
  app.use("/api/navigation/telemetry", navigationTelemetryLimiter);
  app.use("/api", apiLimiter);
};

export const registerApiRoutes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/email-verifications", emailVerificationRoutes);
  app.use("/api/password-resets", passwordResetRoutes);
  app.use("/api/login-history", loginHistoryRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/places", placeRoutes);
  app.use("/api/districts", districtRoutes);
  app.use("/api/wards", wardRoutes);
  app.use("/api/boundaries", boundaryRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/business/services", businessOfferingRoutes);
  app.use("/api/business/bookings", bookingRoutes);
  app.use("/api/bookings", bookingPublicRoutes);
  app.use("/api/services", serviceBookingRoutes);
  app.use("/api/business/booking-auto-rules", autoApproveRuleRoutes);
  app.use("/api/business/vouchers", voucherRoutes);
  app.use("/api/business/reviews", reviewRoutes);
  app.use("/api/business", businessRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/routes", routingRoutes);
  app.use("/api/navigation", navigationRoutes);
  app.use("/api", userPermissionRoutes);
  app.use("/api", userRoutes);
};
