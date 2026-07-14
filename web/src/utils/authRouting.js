import { ROLES } from "@/constants/constants";
import { ADMIN_ROUTES, AUTH_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";

const ROLE_NAME_TO_ID = {
  super_admin: ROLES.SUPER_ADMIN,
  admin: ROLES.ADMIN,
  business: ROLES.BUSINESS,
  staff: ROLES.STAFF,
  user: ROLES.USER,
  guest: ROLES.GUEST,
};

export const resolveRoleId = (user) => {
  if (user?.roleId) return user.roleId;

  const roleKey = String(
    user?.roleName || user?.role?.name || user?.role || "",
  ).toLowerCase();

  return ROLE_NAME_TO_ID[roleKey] || null;
};

export const isNonAdminRole = (roleId) =>
  roleId === ROLES.USER || roleId === ROLES.GUEST;

export const resolvePostLoginRoute = (user) => {
  const roleId = resolveRoleId(user);

  if (roleId === ROLES.BUSINESS || roleId === ROLES.STAFF) {
    return BUSINESS_ROUTES.DASHBOARD;
  }

  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(roleId)) {
    return ADMIN_ROUTES.DASHBOARD;
  }

  if (roleId === ROLES.USER) {
    return BUSINESS_ROUTES.REGISTER;
  }

  return AUTH_ROUTES.LOGIN;
};
