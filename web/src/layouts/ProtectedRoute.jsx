import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";

/**
 * Protected Route Component
 *
 * Zustand v5 `persist` with localStorage hydrates synchronously before
 * the first React render, so no hydration guard is needed.
 */
const ProtectedRoute = ({ allowedRoles = [], roles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();

  const effectiveRoles =
    Array.isArray(allowedRoles) && allowedRoles.length > 0
      ? allowedRoles
      : Array.isArray(roles)
        ? roles
        : [];

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  //CRITICAL: Block GUEST role from all admin routes
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
  if (effectiveRoles.length > 0 && !effectiveRoles.includes(user?.roleId)) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
