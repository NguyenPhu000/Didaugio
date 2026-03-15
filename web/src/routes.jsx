import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ProtectedRoute } from "@/layouts";
import { AdminLayout } from "@/layouts";
import { ROLES } from "@/constants";
import {
  AUTH_ROUTES,
  AUTH_PREFIX_ROUTES,
  ADMIN_ROUTES,
  BUSINESS_ROUTES,
  PLACES_ALIAS,
} from "@/constants/routes";
import {
  DashboardPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  SettingsPage,
  UserManagePage,
  EmailVerificationPage,
  PasswordResetPage,
  AuditLogsPage,
  LoginHistoryPage,
  NotFoundPage,
  PlaceWizardPage,
  PlaceListPage,
  PlacePendingPage,
  MapPage,
  CategoryManagementPage,
  TagManagementPage,
  DistrictListPage,
  BusinessListPage,
  BusinessPendingPage,
  BusinessProfilePage,
  BusinessRegisterPage,
  ServiceListPage,
} from "@/pages";
import BookingListPage from "@/pages/business/BookingListPage";
import BookingDetailPage from "@/pages/business/BookingDetailPage";
import VoucherListPage from "@/pages/business/VoucherListPage";
import BusinessDashboardPage from "@/pages/business/BusinessDashboardPage";
import RevenuePage from "@/pages/business/RevenuePage";
import ReviewListPage from "@/pages/business/ReviewListPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPublicPage from "@/pages/auth/VerifyEmailPublicPage";
import ResendVerificationPage from "@/pages/auth/ResendVerificationPage";
import RoleManagePage from "@/pages/RoleManagePage";
import PermissionManagePage from "@/pages/PermissionManagePage";
import BusinessGuard from "@/components/business/BusinessGuard";

/** Redirect / to correct dashboard based on role */
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  const to =
    user?.roleId === ROLES.BUSINESS
      ? BUSINESS_ROUTES.DASHBOARD
      : ADMIN_ROUTES.DASHBOARD;
  return <Navigate to={to} replace />;
};

/** Business thấy BusinessDashboard, Admin/Staff thấy DashboardPage */
const DashboardGate = () => {
  const { user } = useAuthStore();
  if (user?.roleId === ROLES.BUSINESS) {
    return <Navigate to={BUSINESS_ROUTES.DASHBOARD} replace />;
  }
  return <DashboardPage />;
};

/**
 * Route configuration helpers
 *
 * SECURITY NOTE: GUEST (role 5) is NEVER included in any admin role arrays
 */
const adminRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const allStaffRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.BUSINESS,
  ROLES.STAFF,
]; // GUEST excluded
const placeRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BUSINESS];
const superAdminOnly = [ROLES.SUPER_ADMIN];

/** Wrap page in ProtectedRoute + AdminLayout */
const ProtectedAdmin = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== Public auth routes ===== */}
      <Route path={AUTH_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={AUTH_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={AUTH_PREFIX_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={AUTH_PREFIX_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route
        path={AUTH_ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />
      <Route
        path={AUTH_PREFIX_ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />
      <Route
        path={AUTH_ROUTES.RESET_PASSWORD}
        element={<ResetPasswordPage />}
      />
      <Route
        path={AUTH_PREFIX_ROUTES.RESET_PASSWORD}
        element={<ResetPasswordPage />}
      />
      <Route
        path={AUTH_ROUTES.VERIFY_EMAIL}
        element={<VerifyEmailPublicPage />}
      />
      <Route
        path={AUTH_PREFIX_ROUTES.VERIFY_EMAIL}
        element={<VerifyEmailPublicPage />}
      />
      <Route
        path={AUTH_ROUTES.RESEND_VERIFICATION}
        element={<ResendVerificationPage />}
      />
      <Route
        path={AUTH_PREFIX_ROUTES.RESEND_VERIFICATION}
        element={<ResendVerificationPage />}
      />

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
        path="/admin/places/edit/:id"
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

      {/* ===== Business Portal Routes ===== */}
      <Route
        path={BUSINESS_ROUTES.REGISTER}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessRegisterPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={BUSINESS_ROUTES.PROFILE}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard allowWhenPendingOrRejected>
                <BusinessProfilePage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={BUSINESS_ROUTES.BOOKINGS}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <BookingListPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/bookings/:id"
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <BookingDetailPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={BUSINESS_ROUTES.DASHBOARD}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <BusinessDashboardPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={BUSINESS_ROUTES.REVENUE}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <RevenuePage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={BUSINESS_ROUTES.REVIEWS}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <ReviewListPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={BUSINESS_ROUTES.VOUCHERS}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <VoucherListPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={BUSINESS_ROUTES.SERVICES}
        element={
          <ProtectedRoute roles={[ROLES.BUSINESS]}>
            <AdminLayout>
              <BusinessGuard>
                <ServiceListPage />
              </BusinessGuard>
            </AdminLayout>
          </ProtectedRoute>
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
