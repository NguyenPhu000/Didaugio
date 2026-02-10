import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";

/**
 * Protected Route Component
 *
 * SECURITY REQUIREMENT:
 * - GUEST role is NEVER allowed in admin routes
 * - Check both authentication and role permissions
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // Must be authenticated
  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  // 🔒 CRITICAL: Block GUEST role from all admin routes
  if (user?.roleId === ROLES.GUEST) {
    return (
      <Navigate
        to={AUTH_ROUTES.LOGIN}
        replace
        state={{
          message: "Guest users are not allowed in admin area",
          errorCode: "GUEST_NOT_ALLOWED",
        }}
      />
    );
  }

  // Check specific role requirements if provided
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.roleId)) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
