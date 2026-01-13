import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "sonner";
import { useEffect } from "react";
import { ProtectedRoute, AdminLayout } from "@/components/layout";
import { ROLES } from "@/config/constants";
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
  CategoryManagementPage,
  TagManagementPage,
} from "@/pages";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPublicPage from "@/pages/auth/VerifyEmailPublicPage";
import ResendVerificationPage from "@/pages/auth/ResendVerificationPage";
import RoleManagePage from "@/pages/RoleManagePage";
import PermissionManagePage from "@/pages/PermissionManagePage";
import { useAuthStore } from "@/stores/authStore";

function App() {
  // Ensure auth state is restored on app mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth-storage");
    if (storedAuth) {
      try {
        const { state } = JSON.parse(storedAuth);
        // Check if we have valid auth data
        if (
          state?.accessToken &&
          state?.user &&
          !useAuthStore.getState().isAuthenticated
        ) {
          useAuthStore.setState({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated || true,
          });
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
      }
    }
  }, []);
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Sonner richColors position="top-right" />

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
    </BrowserRouter>
  );
}

export default App;
