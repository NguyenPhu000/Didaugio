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
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/admin/SettingsPage";
import UserManagePage from "@/pages/UserManagePage";
import EmailVerificationPage from "@/pages/EmailVerificationPage";
import PasswordResetPage from "@/pages/PasswordResetPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import LoginHistoryPage from "@/pages/LoginHistoryPage";
import NotFoundPage from "@/pages/NotFoundPage";
import PlaceWizardPage from "@/pages/admin/PlaceWizardPage";
import PlaceListPage from "@/pages/admin/PlaceListPage";
import PlacePendingPage from "@/pages/admin/PlacePendingPage";
import MapPage from "@/pages/admin/MapPage";
import CategoryManagementPage from "@/pages/admin/CategoryManagementPage";
import TagManagementPage from "@/pages/admin/TagManagementPage";
import DistrictListPage from "@/pages/admin/DistrictListPage";
import BusinessListPage from "@/pages/admin/BusinessListPage";
import BusinessPendingPage from "@/pages/admin/BusinessPendingPage";
import BusinessProfilePage from "@/pages/business/BusinessProfilePage";
import BusinessRegisterPage from "@/pages/business/BusinessRegisterPage";
import ServiceListPage from "@/pages/business/ServiceListPage";
import BookingListPage from "@/pages/business/BookingListPage";
import BookingDetailPage from "@/pages/business/BookingDetailPage";
import BookingSchedulePage from "@/pages/business/BookingSchedulePage";
import BookingQuickProcessPage from "@/pages/business/BookingQuickProcessPage";
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
import { resolvePostLoginRoute, resolveRoleId } from "@/utils/authRouting";

/** Redirect / to correct dashboard based on role */
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  const to = resolvePostLoginRoute(user);
  return <Navigate to={to} replace />;
};

/** Business thấy BusinessDashboard, Admin/Staff thấy DashboardPage */
const DashboardGate = () => {
  const { user } = useAuthStore();
  const roleId = resolveRoleId(user);

  if (roleId === ROLES.BUSINESS) {
    return <Navigate to={BUSINESS_ROUTES.DASHBOARD} replace />;
  }

  if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF].includes(roleId)) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
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
        { path: BUSINESS_ROUTES.REVIEWS, element: <ReviewListPage /> },
        { path: BUSINESS_ROUTES.VOUCHERS, element: <VoucherListPage /> },
        { path: BUSINESS_ROUTES.SERVICES, element: <ServiceListPage /> },
      ].map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute roles={[ROLES.BUSINESS]}>
              <AdminLayout>
                <BusinessGuard>{element}</BusinessGuard>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      ))}

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
