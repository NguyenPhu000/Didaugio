import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/constants";

const NON_ADMIN_ROLES = [ROLES.USER, ROLES.GUEST];
const ROLE_NAME_TO_ID = {
  super_admin: ROLES.SUPER_ADMIN,
  admin: ROLES.ADMIN,
  business: ROLES.BUSINESS,
  staff: ROLES.STAFF,
  user: ROLES.USER,
  guest: ROLES.GUEST,
};

const resolveRoleId = (user) => {
  if (user?.roleId) return user.roleId;
  const roleKey = String(
    user?.roleName || user?.role?.name || user?.role || "",
  ).toLowerCase();
  return ROLE_NAME_TO_ID[roleKey] || null;
};

const ProtectedRoute = ({ allowedRoles = [], roles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const roleId = resolveRoleId(user);

  const effectiveRoles = allowedRoles.length > 0 ? allowedRoles : roles;

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  if (NON_ADMIN_ROLES.includes(roleId)) {
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
    const fallback =
      roleId === ROLES.BUSINESS ? BUSINESS_ROUTES.DASHBOARD : AUTH_ROUTES.LOGIN;
    return <Navigate to={fallback} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
