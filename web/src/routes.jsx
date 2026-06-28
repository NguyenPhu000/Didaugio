import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ProtectedRoute } from "@/layouts";
import { AdminLayout } from "@/layouts";
import { BusinessLayout } from "@/layouts";
import { ROLES } from "@/constants";
import {
  AUTH_ROUTES,
  AUTH_PREFIX_ROUTES,
  ADMIN_ROUTES,
  BUSINESS_ROUTES,
  PLACES_ALIAS,
} from "@/constants/routes";

// Auth pages - lazy loaded for faster initial load
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const VerifyEmailPublicPage = lazy(() => import("@/pages/auth/VerifyEmailPublicPage"));
const ResendVerificationPage = lazy(() => import("@/pages/auth/ResendVerificationPage"));
const CheckEmailPage = lazy(() => import("@/pages/auth/CheckEmailPage"));
const StaffInvitePage = lazy(() => import("@/pages/auth/StaffInvitePage"));

// Admin pages - lazy loaded
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const UserManagePage = lazy(() => import("@/pages/UserManagePage"));
const EmailVerificationPage = lazy(() => import("@/pages/EmailVerificationPage"));
const PasswordResetPage = lazy(() => import("@/pages/PasswordResetPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const LoginHistoryPage = lazy(() => import("@/pages/LoginHistoryPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const PlaceWizardPage = lazy(() => import("@/pages/admin/PlaceWizardPage"));
const PlaceListPage = lazy(() => import("@/pages/admin/PlaceListPage"));
const PlacePendingPage = lazy(() => import("@/pages/admin/PlacePendingPage"));
const MapPage = lazy(() => import("@/pages/admin/MapPage"));
const CategoryManagementPage = lazy(() => import("@/pages/admin/CategoryManagementPage"));
const TagManagementPage = lazy(() => import("@/pages/admin/TagManagementPage"));
const DistrictListPage = lazy(() => import("@/pages/admin/DistrictListPage"));
const BusinessListPage = lazy(() => import("@/pages/admin/BusinessListPage"));
const BusinessPendingPage = lazy(() => import("@/pages/admin/BusinessPendingPage"));
const AdminReviewModerationPage = lazy(() => import("@/pages/admin/AdminReviewModerationPage"));
const AdminPayoutManagementPage = lazy(() => import("@/pages/admin/AdminPayoutManagementPage"));
const AdminRefundManagementPage = lazy(() => import("@/pages/admin/AdminRefundManagementPage"));
const AdminCashflowPage = lazy(() => import("@/pages/admin/AdminCashflowPage"));
const AdminSubscriptionPage = lazy(() => import("@/pages/admin/AdminSubscriptionPage"));
const AdminPlanManagementPage = lazy(() => import("@/pages/admin/AdminPlanManagementPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const CMSContentPage = lazy(() => import("@/pages/admin/CMSContentPage"));
const RoleManagePage = lazy(() => import("@/pages/RoleManagePage"));
const PermissionManagePage = lazy(() => import("@/pages/PermissionManagePage"));

// Business pages - lazy loaded
const BusinessProfilePage = lazy(() => import("@/pages/business/BusinessProfilePage"));
const BusinessRegisterPage = lazy(() => import("@/pages/business/BusinessRegisterPage"));
const BusinessWelcomePage = lazy(() => import("@/pages/business/BusinessWelcomePage"));
const ServiceListPage = lazy(() => import("@/pages/business/ServiceListPage"));
const BookingListPage = lazy(() => import("@/pages/business/BookingListPage"));
const BookingDetailPage = lazy(() => import("@/pages/business/BookingDetailPage"));
const BookingSchedulePage = lazy(() => import("@/pages/business/BookingSchedulePage"));
const BookingQuickProcessPage = lazy(() => import("@/pages/business/BookingQuickProcessPage"));
const VoucherListPage = lazy(() => import("@/pages/business/VoucherListPage"));
const BusinessDashboardPage = lazy(() => import("@/pages/business/BusinessDashboardPage"));
const RevenuePage = lazy(() => import("@/pages/business/RevenuePage"));
const BusinessReportCenterPage = lazy(() => import("@/pages/business/BusinessReportCenterPage"));
const ReviewListPage = lazy(() => import("@/pages/business/ReviewListPage"));
const BusinessPlacePage = lazy(() => import("@/pages/business/BusinessPlacePage"));
const StaffManagementPage = lazy(() => import("@/pages/business/StaffManagementPage"));
const EarningsPage = lazy(() => import("@/pages/business/EarningsPage"));
const BusinessCashflowPage = lazy(() => import("@/pages/business/BusinessCashflowPage"));
const BusinessSettingsPage = lazy(() => import("@/pages/business/BusinessSettingsPage"));
const SubscriptionPage = lazy(() => import("@/pages/business/SubscriptionPage"));
const PricingPage = lazy(() => import("@/pages/business/PricingPage"));
const InvoiceHistoryPage = lazy(() => import("@/pages/business/InvoiceHistoryPage"));

import BusinessGuard from "@/components/business/BusinessGuard";
import { resolvePostLoginRoute, resolveRoleId } from "@/utils/authRouting";

/** Redirect / to correct dashboard based on role */
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  const to = resolvePostLoginRoute(user);
  return <Navigate to={to} replace />;
};

/** Business/Staff thấy BusinessDashboard, Admin thấy DashboardPage */
const DashboardGate = () => {
  const { user } = useAuthStore();
  const roleId = resolveRoleId(user);

  if (roleId === ROLES.BUSINESS || roleId === ROLES.STAFF) {
    return <Navigate to={BUSINESS_ROUTES.DASHBOARD} replace />;
  }

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(roleId)) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return <DashboardPage />;
};

/**
 * Route configuration helpers
 *
 * SECURITY NOTE: GUEST (role 6) is NEVER included in any admin role arrays
 */
const adminRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const allStaffRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.BUSINESS,
  ROLES.STAFF,
]; // GUEST excluded
const placeRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const superAdminOnly = [ROLES.SUPER_ADMIN];

/** Wrap page in ProtectedRoute + AdminLayout */
const ProtectedAdmin = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

const ProtectedBusiness = ({
  children,
  allowWhenPendingOrRejected = false,
  skipBusinessGuard = false,
}) => (
  <ProtectedRoute roles={[ROLES.BUSINESS, ROLES.STAFF]}>
    <BusinessLayout>
      {skipBusinessGuard ? (
        children
      ) : (
        <BusinessGuard allowWhenPendingOrRejected={allowWhenPendingOrRejected}>
          {children}
        </BusinessGuard>
      )}
    </BusinessLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== Public auth routes (primary) ===== */}
      <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={AUTH_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route
        path={AUTH_ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />
      <Route
        path={AUTH_ROUTES.RESET_PASSWORD}
        element={<ResetPasswordPage />}
      />
      <Route
        path={AUTH_ROUTES.VERIFY_EMAIL}
        element={<VerifyEmailPublicPage />}
      />
      <Route
        path="/check-email"
        element={<CheckEmailPage />}
      />
      <Route
        path={AUTH_ROUTES.RESEND_VERIFICATION}
        element={<ResendVerificationPage />}
      />

      {/* Legacy /auth/* prefix — redirect to primary paths */}
      {Object.entries(AUTH_PREFIX_ROUTES).map(([key, prefixPath]) => (
        <Route
          key={prefixPath}
          path={prefixPath}
          element={<Navigate to={AUTH_ROUTES[key]} replace />}
        />
      ))}

      {/* Staff invite (public) */}
      <Route path="/invite" element={<StaffInvitePage />} />

      {/* Redirect root to dashboard - Business -> business dashboard */}
      <Route path="/" element={<RootRedirect />} />

      {/* ===== Protected routes ===== */}

      {/* Dashboard - Business redirect to business dashboard */}
      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <ProtectedAdmin roles={allStaffRoles}>
            <DashboardGate />
          </ProtectedAdmin>
        }
      />

      {/* Profile & Settings */}
      <Route
        path={ADMIN_ROUTES.PROFILE}
        element={
          <ProtectedAdmin>
            <ProfilePage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.SETTINGS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <SettingsPage />
          </ProtectedAdmin>
        }
      />

      <Route
        path={ADMIN_ROUTES.PLACES_PENDING}
        element={
          <ProtectedAdmin roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF]}>
            <PlacePendingPage />
          </ProtectedAdmin>
        }
      />

      {/* User Management */}
      <Route
        path={ADMIN_ROUTES.USERS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <UserManagePage />
          </ProtectedAdmin>
        }
      />

      {/* Email Verification */}
      <Route
        path={ADMIN_ROUTES.EMAIL_VERIFICATIONS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <EmailVerificationPage />
          </ProtectedAdmin>
        }
      />

      {/* Password Resets */}
      <Route
        path={ADMIN_ROUTES.PASSWORD_RESETS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <PasswordResetPage />
          </ProtectedAdmin>
        }
      />

      {/* Audit Logs */}
      <Route
        path={ADMIN_ROUTES.AUDIT_LOGS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AuditLogsPage />
          </ProtectedAdmin>
        }
      />

      {/* Login History */}
      <Route
        path={ADMIN_ROUTES.LOGIN_HISTORY}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <LoginHistoryPage />
          </ProtectedAdmin>
        }
      />

      {/* Role Management */}
      <Route
        path={ADMIN_ROUTES.ROLES}
        element={
          <ProtectedAdmin roles={superAdminOnly}>
            <RoleManagePage />
          </ProtectedAdmin>
        }
      />

      {/* Permission Management */}
      <Route
        path={ADMIN_ROUTES.PERMISSIONS}
        element={
          <ProtectedAdmin roles={superAdminOnly}>
            <PermissionManagePage />
          </ProtectedAdmin>
        }
      />

      {/* Category Management */}
      <Route
        path={ADMIN_ROUTES.CATEGORIES}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <CategoryManagementPage />
          </ProtectedAdmin>
        }
      />

      {/* Tag Management */}
      <Route
        path={ADMIN_ROUTES.TAGS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <TagManagementPage />
          </ProtectedAdmin>
        }
      />

      {/* District Management */}
      <Route
        path={ADMIN_ROUTES.DISTRICTS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <DistrictListPage />
          </ProtectedAdmin>
        }
      />

      {/* Place Management */}
      <Route
        path={ADMIN_ROUTES.MAP}
        element={
          <ProtectedAdmin roles={placeRoles}>
            <MapPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.PLACES}
        element={
          <ProtectedAdmin roles={placeRoles}>
            <PlaceListPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.PLACES_NEW}
        element={
          <ProtectedAdmin roles={placeRoles}>
            <PlaceWizardPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.PLACES_EDIT_PATTERN}
        element={
          <ProtectedAdmin roles={placeRoles}>
            <PlaceWizardPage />
          </ProtectedAdmin>
        }
      />

      {/* ===== Admin Business Management ===== */}
      <Route
        path={ADMIN_ROUTES.BUSINESS_LIST}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <BusinessListPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.BUSINESS_PENDING}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <BusinessPendingPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.REVIEWS_MODERATION}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminReviewModerationPage />
          </ProtectedAdmin>
        }
      />

      {/* Admin Refund Management */}
      <Route
        path={ADMIN_ROUTES.REFUNDS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminRefundManagementPage />
          </ProtectedAdmin>
        }
      />

      {/* Admin Payout Management */}
      <Route
        path={ADMIN_ROUTES.PAYOUTS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminPayoutManagementPage />
          </ProtectedAdmin>
        }
      />

      <Route
        path={ADMIN_ROUTES.CASHFLOW}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminCashflowPage />
          </ProtectedAdmin>
        }
      />

      {/* Admin Subscription Management */}
      <Route
        path={ADMIN_ROUTES.SUBSCRIPTIONS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminSubscriptionPage />
          </ProtectedAdmin>
        }
      />
      <Route
        path={ADMIN_ROUTES.SUBSCRIPTION_PLANS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminPlanManagementPage />
          </ProtectedAdmin>
        }
      />

      {/* Admin Booking Operations */}

      {/* Admin Analytics */}
      <Route
        path={ADMIN_ROUTES.ANALYTICS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminAnalyticsPage />
          </ProtectedAdmin>
        }
      />

      {/* CMS Content Management */}
      <Route
        path={ADMIN_ROUTES.CMS}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <CMSContentPage />
          </ProtectedAdmin>
        }
      />

      {/* ===== Business Portal Routes ===== */}
      <Route
        path={BUSINESS_ROUTES.REGISTER}
        element={
          <ProtectedBusiness skipBusinessGuard>
            <BusinessRegisterPage />
          </ProtectedBusiness>
        }
      />
      <Route
        path={BUSINESS_ROUTES.WELCOME}
        element={
          <ProtectedBusiness skipBusinessGuard>
            <BusinessWelcomePage />
          </ProtectedBusiness>
        }
      />
      <Route
        path={BUSINESS_ROUTES.PROFILE}
        element={
          <ProtectedBusiness allowWhenPendingOrRejected>
            <BusinessProfilePage />
          </ProtectedBusiness>
        }
      />

      {/* Business guarded routes — DRY wrapper */}
      {[
        {
          path: BUSINESS_ROUTES.BOOKING_SCHEDULE,
          element: <BookingSchedulePage />,
        },
        {
          path: BUSINESS_ROUTES.BOOKING_QUICK,
          element: <BookingQuickProcessPage />,
        },
        { path: BUSINESS_ROUTES.BOOKINGS, element: <BookingListPage /> },
        {
          path: BUSINESS_ROUTES.BOOKING_DETAIL(":id"),
          element: <BookingDetailPage />,
        },
        { path: BUSINESS_ROUTES.DASHBOARD, element: <BusinessDashboardPage /> },
        { path: BUSINESS_ROUTES.REVENUE, element: <RevenuePage /> },
        { path: BUSINESS_ROUTES.CASHFLOW, element: <BusinessCashflowPage /> },
        { path: BUSINESS_ROUTES.REVIEWS, element: <ReviewListPage /> },
        { path: BUSINESS_ROUTES.VOUCHERS, element: <VoucherListPage /> },
        { path: BUSINESS_ROUTES.STAFF, element: <StaffManagementPage /> },
        { path: BUSINESS_ROUTES.EARNINGS, element: <EarningsPage /> },
        { path: BUSINESS_ROUTES.REPORTS, element: <BusinessReportCenterPage /> },
        { path: BUSINESS_ROUTES.SERVICES, element: <ServiceListPage /> },
        { path: BUSINESS_ROUTES.PLACES, element: <BusinessPlacePage /> },
        { path: BUSINESS_ROUTES.SETTINGS, element: <BusinessSettingsPage /> },
        { path: BUSINESS_ROUTES.SUBSCRIPTION, element: <SubscriptionPage /> },
        { path: BUSINESS_ROUTES.SUBSCRIPTION_PLANS, element: <PricingPage /> },
        { path: BUSINESS_ROUTES.SUBSCRIPTION_INVOICES, element: <InvoiceHistoryPage /> },
      ].map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedBusiness>{element}</ProtectedBusiness>
          }
        />
      ))}

      {/* Business Place Wizard - New */}
      <Route
        path={BUSINESS_ROUTES.PLACES_NEW}
        element={
          <ProtectedBusiness>
            <PlaceWizardPage />
          </ProtectedBusiness>
        }
      />
      {/* Redirect /business/map to /business/places?tab=map */}
      <Route
        path={BUSINESS_ROUTES.MAP}
        element={<Navigate to={`${BUSINESS_ROUTES.PLACES}?tab=map`} replace />}
      />
      {/* Business Place Wizard - Edit */}
      <Route
        path={BUSINESS_ROUTES.PLACES_EDIT_PATTERN}
        element={
          <ProtectedBusiness>
            <PlaceWizardPage />
          </ProtectedBusiness>
        }
      />

      {/* Legacy: hợp đồng gộp vào Hồ sơ (Phương án A) */}
      <Route
        path="/business/contracts"
        element={
          <Navigate
            to={`${BUSINESS_ROUTES.PROFILE}?section=contract`}
            replace
          />
        }
      />
      <Route
        path="/business/contracts/:id"
        element={
          <Navigate
            to={`${BUSINESS_ROUTES.PROFILE}?section=contract`}
            replace
          />
        }
      />

      {/* Alias routes */}
      <Route
        path={PLACES_ALIAS}
        element={<Navigate to={ADMIN_ROUTES.PLACES} replace />}
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
