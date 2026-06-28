import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ADMIN_ROUTES, AUTH_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";
import { resolveRoleId } from "@/utils/authRouting";
import BusinessUpgradePrompt from "@/components/auth/BusinessUpgradePrompt";

const ProtectedRoute = ({ allowedRoles = [], roles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const roleId = resolveRoleId(user);

  const effectiveRoles = allowedRoles.length > 0 ? allowedRoles : roles;

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  // USER role trying to access business pages -> show upgrade prompt
  if (roleId === ROLES.USER && effectiveRoles.includes(ROLES.BUSINESS)) {
    return <BusinessUpgradePrompt />;
  }

  // GUEST role -> block from admin/business areas
  if (roleId === ROLES.GUEST) {
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
