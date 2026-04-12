import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ADMIN_ROUTES, AUTH_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { isNonAdminRole, resolveRoleId } from "@/utils/authRouting";

const ProtectedRoute = ({ allowedRoles = [], roles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const roleId = resolveRoleId(user);

  const effectiveRoles = allowedRoles.length > 0 ? allowedRoles : roles;

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  if (isNonAdminRole(roleId)) {
    return (
      <Navigate
        to={AUTH_ROUTES.LOGIN}
        replace
        state={{
          message: "Bạn không có quyền truy cập khu vực quản trị",
          errorCode: "NOT_ALLOWED",
        }}
      />
    );
  }

  if (effectiveRoles.length > 0 && !effectiveRoles.includes(roleId)) {
    let fallback = AUTH_ROUTES.LOGIN;
    if (roleId === ROLES.BUSINESS) {
      fallback = BUSINESS_ROUTES.DASHBOARD;
    } else if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF].includes(roleId)) {
      fallback = ADMIN_ROUTES.DASHBOARD;
    }

    return <Navigate to={fallback} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
