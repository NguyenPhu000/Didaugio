import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/layouts";
import { AdminLayout } from "@/layouts";
import { ROLES } from "@/constants";
import {
  AUTH_ROUTES,
  AUTH_PREFIX_ROUTES,
  ADMIN_ROUTES,
  PLACES_ALIAS,
  DEFAULT_REDIRECT,
} from "@/constants/routes";
import {
  DashboardPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  UserManagePage,
  EmailVerificationPage,
  PasswordResetPage,
  AuditLogsPage,
  LoginHistoryPage,
  NotFoundPage,
  PlaceWizardPage,
  PlaceListPage,
  MapPage,
  CategoryManagementPage,
  TagManagementPage,
  DistrictListPage,
} from "@/pages";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPublicPage from "@/pages/auth/VerifyEmailPublicPage";
import ResendVerificationPage from "@/pages/auth/ResendVerificationPage";
import RoleManagePage from "@/pages/RoleManagePage";
import PermissionManagePage from "@/pages/PermissionManagePage";

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

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to={DEFAULT_REDIRECT} replace />} />

      {/* ===== Protected routes ===== */}

      {/* Dashboard */}
      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <ProtectedAdmin roles={allStaffRoles}>
            <DashboardPage />
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
          <ProtectedAdmin>
            <ProfilePage />
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
