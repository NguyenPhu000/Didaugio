import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute, AdminLayout } from "@/components/layout";
import { ROLES } from "@/config/constants";
import {
  DashboardPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  NotFoundPage,
} from "@/pages";

function App() {
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

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
