import userRoutes from "./user/user.route.js";
import authRoutes from "./auth/auth.route.js";
import profileRoutes from "./profile/profile.route.js";
import tripRoutes from "./trip/trip.route.js";
import auditLogRoutes from "./activity/auditLog.route.js";
import emailVerificationRoutes from "./activity/emailVerification.route.js";
import passwordResetRoutes from "./activity/passwordReset.route.js";
import loginHistoryRoutes from "./activity/loginHistory.route.js";
import roleRoutes from "./rbac/role.route.js";
import permissionRoutes from "./rbac/permission.route.js";
import userPermissionRoutes from "./rbac/userPermission.route.js";
import categoryRoutes from "./category/category.route.js";
import tagRoutes from "./tag/tag.route.js";
import tagGroupRoutes from "./tag/tagGroup.route.js";
import placeRoutes from "./place/place.route.js";
import districtRoutes from "./district/district.route.js";
import wardRoutes from "./district/ward.route.js";
import boundaryRoutes from "./boundary/boundary.route.js";
import settingsRoutes from "./settings/settings.route.js";
import businessRoutes from "./business/business.route.js";
import businessStaffRoutes from "./business/staff.route.js";
import staffInvitationRoutes from "./business/staffInvitation.route.js";
import staffInvitePublicRoutes from "./business/staffInvitePublic.route.js";
import businessRoleRoutes from "./business/businessRole.route.js";
import businessBlockedDateRoutes from "./business/blockedDate.route.js";
import businessSettingsRoutes from "./business/businessSettings.route.js";
import businessPayoutRoutes from "./business/payout.route.js";
import businessRevenueRoutes from "./business/revenue.route.js";
import adminPayoutRoutes from "./admin/payout.route.js";
import businessOfferingRoutes from "./businessOffering/businessOffering.route.js";
import bookingRoutes from "./booking/booking.route.js";
import bookingPublicRoutes from "./booking/bookingPublic.route.js";
import autoApproveRuleRoutes from "./autoApproveRule/autoApproveRule.route.js";
import voucherRoutes from "./voucher/voucher.route.js";
import reviewRoutes from "./review/review.route.js";
import adminReviewRoutes from "./review/adminReview.route.js";
import feedbackRoutes from "./feedback/feedback.route.js";
import serviceBookingRoutes from "./booking/serviceBooking.route.js";
import aiRoutes from "./ai/ai.route.js";
import routingRoutes from "../modules/routing/routing.routes.js";
import navigationRoutes from "../modules/navigation/navigation.routes.js";
import placeTelemetryRoutes from "./analytics/placeTelemetry.route.js";
import dashboardRoutes from "./dashboard/dashboard.route.js";
import notificationRoutes from "./notification/notification.route.js";
import eventRoutes from "./event/event.route.js";
import cmsRoutes from "./cms/cms.route.js";
import bannerRoutes from "./banner/banner.route.js";
import paymentRoutes from "./payment/payment.route.js";
import documentRoutes from "./document/document.route.js";
import placeV2Routes from "./v2/place.route.js";
import locationV2Routes from "./v2/location.route.js";
import { locationTrafficMiddleware } from "../observability/administrativeMetrics.js";
import { businessRouter as subscriptionRoutes, adminRouter as adminSubscriptionRoutes } from "./subscription/subscription.route.js";
import {
  authLimiter,
  apiLimiter,
  businessApiLimiter,
  refreshLimiter,
  recoveryLimiter,
  routingLimiter,
  aiNavigateLimiter,
  navigationLimiter,
  navigationTelemetryLimiter,
  changePasswordLimiter,
  groqChatLimiter,
  documentDownloadLimiter,
} from "../middlewares/rateLimitMiddleware.js";

export const registerRateLimiters = (app) => {
  app.use("/api/staff/invite/accept", authLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/register-business", authLimiter);
  app.use("/api/auth/upgrade-to-business", authLimiter);
  app.use("/api/auth/google", authLimiter);
  app.use("/api/auth/refresh", refreshLimiter);
  app.use("/api/auth/forgot-password", recoveryLimiter);
  app.use("/api/auth/reset-password", recoveryLimiter);
  app.use("/api/auth/resend-verification-public", recoveryLimiter);
  app.use("/api/auth/change-password", changePasswordLimiter);
  app.use("/api/routes", routingLimiter);
  app.use("/api/ai/navigate", aiNavigateLimiter);
  app.use("/api/ai/groq-chat", groqChatLimiter);
  app.use("/api/ai/voice", groqChatLimiter);
  app.use("/api/navigation/navigate", navigationLimiter);
  app.use("/api/navigation/telemetry", navigationTelemetryLimiter);
  app.use("/api/documents/download", documentDownloadLimiter);
  // Business routes have stricter limits due to sensitive operations
  app.use("/api/business", businessApiLimiter);
  app.use("/api/business/services", businessApiLimiter);
  app.use("/api/business/staff", businessApiLimiter);
  app.use("/api/business/bookings", businessApiLimiter);
  app.use("/api/payments/checkout", businessApiLimiter);
  app.use("/api/subscriptions/upgrade", businessApiLimiter);
  app.use("/api", apiLimiter);
};

export const registerApiRoutes = (app) => {
  app.use("/api/v2/places", placeV2Routes);
  app.use("/api/v2/locations", locationTrafficMiddleware("v2"), locationV2Routes);
  // Public routes (no auth required)
  app.use("/api/staff/invite", staffInvitePublicRoutes);

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/profile", tripRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/email-verifications", emailVerificationRoutes);
  app.use("/api/password-resets", passwordResetRoutes);
  app.use("/api/login-history", loginHistoryRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/tag-groups", tagGroupRoutes);
  app.use("/api/places", placeRoutes);
  app.use("/api/districts", locationTrafficMiddleware("v1"), districtRoutes);
  app.use("/api/wards", locationTrafficMiddleware("v1"), wardRoutes);
  app.use("/api/boundaries", boundaryRoutes);
  app.use("/api/settings", settingsRoutes);
  // Register specific /api/business/* sub-routes BEFORE the generic /api/business
  // to prevent Express from matching sub-paths as :id params in businessRoutes
  app.use("/api/business/services", businessOfferingRoutes);
  app.use("/api/business/staff", staffInvitationRoutes);
  app.use("/api/business/staff", businessStaffRoutes);
  app.use("/api/business/roles", businessRoleRoutes);
  app.use("/api/business/blocked-dates", businessBlockedDateRoutes);
  app.use("/api/business/settings", businessSettingsRoutes);
  app.use("/api/business/bookings", bookingRoutes);
  app.use("/api/business/booking-auto-rules", autoApproveRuleRoutes);
  app.use("/api/business/vouchers", voucherRoutes);
  app.use("/api/business/revenue", businessRevenueRoutes);
  app.use("/api/business/reviews", reviewRoutes);
  // Generic /api/business routes (profile, register, admin list/detail) — must come AFTER sub-routes
  app.use("/api/business", businessPayoutRoutes);
  app.use("/api/business", businessRoutes);
  app.use("/api/admin/payouts", adminPayoutRoutes);
  app.use("/api/admin/reviews", adminReviewRoutes);
  app.use("/api/bookings", bookingPublicRoutes);
  app.use("/api/services", serviceBookingRoutes);

  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/banners", bannerRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/cms", cmsRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/admin/subscriptions", adminSubscriptionRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/routes", routingRoutes);
  app.use("/api/navigation", navigationRoutes);
  app.use("/api/telemetry", placeTelemetryRoutes);
  app.use("/api", userPermissionRoutes);
  app.use("/api", userRoutes);
};
