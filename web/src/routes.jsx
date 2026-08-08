import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { safeLazy as lazy } from "@/lib/safeLazy";
import { useAuthStore } from "@/stores/authStore";
import { ProtectedRoute } from "@/layouts";
import { AdminLayout } from "@/layouts";
import { BusinessLayout } from "@/layouts";
import { ROLES } from "@/constants";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
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

// Shared pages - lazy loaded
const ProfilePage = lazy(() => import("@/pages/shared/ProfilePage"));
const NotificationsPage = lazy(() => import("@/pages/shared/NotificationsPage"));
const NotFoundPage = lazy(() => import("@/pages/shared/NotFoundPage"));

// Admin pages - lazy loaded
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const UserManagePage = lazy(() => import("@/pages/admin/UserManagePage"));
const EmailVerificationPage = lazy(() => import("@/pages/admin/EmailVerificationPage"));
const PasswordResetPage = lazy(() => import("@/pages/admin/PasswordResetPage"));
const AuditLogsPage = lazy(() => import("@/pages/admin/AuditLogsPage"));
const LoginHistoryPage = lazy(() => import("@/pages/admin/LoginHistoryPage"));
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
const RoleManagePage = lazy(() => import("@/pages/admin/RoleManagePage"));
const PermissionManagePage = lazy(() => import("@/pages/admin/PermissionManagePage"));
const AdminAiPage = lazy(() => import("@/pages/admin/ai/AdminAiPage"));

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

  if (roleId === ROLES.STAFF) {
    return <Navigate to={BUSINESS_ROUTES.BOOKINGS} replace />;
  }

  if (roleId === ROLES.BUSINESS) {
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
const dashboardRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const placeRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const STAFF_OPERATION_ROUTES = new Set([
  BUSINESS_ROUTES.BOOKING_SCHEDULE,
  BUSINESS_ROUTES.BOOKINGS,
  BUSINESS_ROUTES.BOOKING_DETAIL(":id"),
]);

import GlobalErrorBoundary from "@/components/common/GlobalErrorBoundary";

/** Wrap page in ProtectedRoute + AdminLayout */
const ProtectedAdmin = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <AdminLayout>
      <GlobalErrorBoundary
        title="Lỗi phân hệ Quản trị (Admin)"
        description="Phân hệ Admin gặp sự cố không mong muốn. Sự cố này đã được cách ly và không ảnh hưởng tới các phân hệ khác."
      >
        {children}
      </GlobalErrorBoundary>
    </AdminLayout>
  </ProtectedRoute>
);

const ProtectedBusinessOwner = ({
  children,
  allowWhenPendingOrRejected = false,
  skipBusinessGuard = false,
}) => (
  <ProtectedRoute roles={[ROLES.BUSINESS]}>
    <BusinessLayout>
      <GlobalErrorBoundary
        title="Lỗi phân hệ Doanh nghiệp (Business)"
        description="Phân hệ Doanh nghiệp gặp sự cố không mong muốn. Sự cố này đã được cách ly và không ảnh hưởng tới các phân hệ khác."
      >
        {skipBusinessGuard ? (
          children
        ) : (
          <BusinessGuard allowWhenPendingOrRejected={allowWhenPendingOrRejected}>
            {children}
          </BusinessGuard>
        )}
      </GlobalErrorBoundary>
    </BusinessLayout>
  </ProtectedRoute>
);

const ProtectedAdminPermission = ({
  children,
  roles,
  permission,
  permissions = [],
}) => {
  const user = useAuthStore((state) => state.user);
  const { hasAnyPermission, isLoading } = usePermission();
  const requiredPermissions = permission ? [permission, ...permissions] : permissions;
  const permissionsLoaded = Array.isArray(user?.permissions);

  if (isLoading) return null;

  if (
    requiredPermissions.length > 0 &&
    permissionsLoaded &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return <Navigate to={ADMIN_ROUTES.PROFILE} replace />;
  }

  return <ProtectedAdmin roles={roles}>{children}</ProtectedAdmin>;
};

const ProtectedStaffOperations = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isStaff = resolveRoleId(user) === ROLES.STAFF;
  const { hasPermission } = usePermission();
  const permissionsLoaded = Array.isArray(user?.permissions);
  const canViewBookings = !permissionsLoaded || hasPermission("bookings.view");

  if (isStaff && !canViewBookings) {
    return <Navigate to={ADMIN_ROUTES.PROFILE} replace />;
  }

  return (
    <ProtectedRoute roles={[ROLES.BUSINESS, ROLES.STAFF]}>
      <BusinessLayout>
        <GlobalErrorBoundary
          title="Booking operations unavailable"
          description="Unable to load booking operations."
        >
          {isStaff ? children : <BusinessGuard>{children}</BusinessGuard>}
        </GlobalErrorBoundary>
      </BusinessLayout>
    </ProtectedRoute>
  );
};

const ProtectedShared = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const currentRoleId = resolveRoleId(user);

  return (
    <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.BUSINESS]}>
      {currentRoleId === ROLES.BUSINESS || currentRoleId === ROLES.STAFF ? (
        <BusinessLayout>{children}</BusinessLayout>
      ) : (
        <AdminLayout>{children}</AdminLayout>
      )}
    </ProtectedRoute>
  );
};

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

      {/* Dashboard - admin only, business/staff are redirected from root/login */}
      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <ProtectedAdmin roles={dashboardRoles}>
            <DashboardGate />
          </ProtectedAdmin>
        }
      />

      {/* Profile & Settings */}
      <Route
        path={ADMIN_ROUTES.PROFILE}
        element={
          <ProtectedShared>
            <ProfilePage />
          </ProtectedShared>
        }
      />
      <Route
        path={ADMIN_ROUTES.NOTIFICATIONS}
        element={
          <ProtectedShared>
            <NotificationsPage />
          </ProtectedShared>
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
          <ProtectedAdmin roles={adminRoles}>
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
          <ProtectedAdminPermission
            roles={adminRoles}
            permission={PERMISSIONS.ROLES.VIEW}
          >
            <RoleManagePage />
          </ProtectedAdminPermission>
        }
      />

      {/* Permission Management */}
      <Route
        path={ADMIN_ROUTES.PERMISSIONS}
        element={
          <ProtectedAdminPermission
            roles={adminRoles}
            permissions={[
              PERMISSIONS.ROLES.VIEW_DETAIL,
              PERMISSIONS.ROLES.MANAGE_PERMISSIONS,
            ]}
          >
            <PermissionManagePage />
          </ProtectedAdminPermission>
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

      <Route
        path={ADMIN_ROUTES.PLACES_PENDING}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <PlacePendingPage />
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

      <Route
        path={ADMIN_ROUTES.AI}
        element={
          <ProtectedAdmin roles={adminRoles}>
            <AdminAiPage />
          </ProtectedAdmin>
        }
      />

      {/* ===== Business Portal Routes ===== */}
      <Route
        path={BUSINESS_ROUTES.REGISTER}
        element={
          <ProtectedBusinessOwner skipBusinessGuard>
            <BusinessRegisterPage />
          </ProtectedBusinessOwner>
        }
      />
      <Route
        path={BUSINESS_ROUTES.WELCOME}
        element={
          <ProtectedBusinessOwner skipBusinessGuard>
            <BusinessWelcomePage />
          </ProtectedBusinessOwner>
        }
      />
      <Route
        path={BUSINESS_ROUTES.PROFILE}
        element={
          <ProtectedBusinessOwner allowWhenPendingOrRejected>
            <BusinessProfilePage />
          </ProtectedBusinessOwner>
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
        {
          path: BUSINESS_ROUTES.SUBSCRIPTION_INVOICES,
          element: <InvoiceHistoryPage />,
        },
      ].map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            STAFF_OPERATION_ROUTES.has(path) ? (
              <ProtectedStaffOperations>{element}</ProtectedStaffOperations>
            ) : (
              <ProtectedBusinessOwner>{element}</ProtectedBusinessOwner>
            )
          }
        />
      ))}

      {/* Business Place Wizard - New */}
      <Route
        path={BUSINESS_ROUTES.PLACES_NEW}
        element={
          <ProtectedBusinessOwner>
            <PlaceWizardPage />
          </ProtectedBusinessOwner>
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
          <ProtectedBusinessOwner>
            <PlaceWizardPage />
          </ProtectedBusinessOwner>
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
