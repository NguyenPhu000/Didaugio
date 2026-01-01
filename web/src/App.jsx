import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
} from "@/pages";
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

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
