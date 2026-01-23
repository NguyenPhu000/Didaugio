import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/layouts"; // Updated import
import { AdminLayout } from "@/layouts";    // Updated import
import { ROLES } from "@/constants";       // Updated import
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
} from "@/pages";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPublicPage from "@/pages/auth/VerifyEmailPublicPage";
import ResendVerificationPage from "@/pages/auth/ResendVerificationPage";
import RoleManagePage from "@/pages/RoleManagePage";
import PermissionManagePage from "@/pages/PermissionManagePage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPublicPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPublicPage />} />
      <Route
        path="/resend-verification"
        element={<ResendVerificationPage />}
      />
      <Route
        path="/auth/resend-verification"
        element={<ResendVerificationPage />}
      />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes - Only Admin, Business, Staff */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            roles={[
              ROLES.SUPER_ADMIN,
              ROLES.ADMIN,
              ROLES.BUSINESS,
              ROLES.STAFF,
            ]}
          >
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile - All logged in users */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProfilePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Settings - alias for profile */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProfilePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* User Management - Only Admin & Super Admin */}
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <UserManagePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Email Verification Management - Only Admin & Super Admin */}
      <Route
        path="/email-verifications"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <EmailVerificationPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Password Reset Management - Only Admin & Super Admin */}
      <Route
        path="/password-resets"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <PasswordResetPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Audit Logs - Only Admin & Super Admin */}
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <AuditLogsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Login History - Only Admin & Super Admin */}
      <Route
        path="/login-history"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <LoginHistoryPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Role Management - Only Super Admin */}
      <Route
        path="/roles"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <RoleManagePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Permission Management - Only Super Admin */}
      <Route
        path="/permissions"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <PermissionManagePage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Category Management - Admin & Super Admin */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <CategoryManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Tag Management - Admin & Super Admin */}
      <Route
        path="/tags"
        element={
          <ProtectedRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
            <AdminLayout>
              <TagManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Place Management - Admin, Super Admin, Business */}
      <Route
        path="/admin/map"
        element={
          <ProtectedRoute
            roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BUSINESS]}
          >
            <AdminLayout>
              <MapPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/places"
        element={
          <ProtectedRoute
            roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BUSINESS]}
          >
            <AdminLayout>
              <PlaceListPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/places/new"
        element={
          <ProtectedRoute
            roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BUSINESS]}
          >
            <AdminLayout>
              <PlaceWizardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/places/edit/:id"
        element={
          <ProtectedRoute
            roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BUSINESS]}
          >
            <AdminLayout>
              <PlaceWizardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Alias routes for places */}
      <Route
        path="/places"
        element={<Navigate to="/admin/places" replace />}
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
