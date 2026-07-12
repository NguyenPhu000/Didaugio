const MOBILE_USER_ROLE_ID = 5;

export const getRoleId = (user) => {
  const roleId = user?.roleId ?? user?.role?.id ?? user?.role_id;
  const numericRoleId = Number(roleId);
  return Number.isFinite(numericRoleId) ? numericRoleId : null;
};

export const isMobileUserRole = (user) => getRoleId(user) === MOBILE_USER_ROLE_ID;

export const assertMobileUserRole = (user) => {
  if (isMobileUserRole(user)) return;

  const error = new Error(
    "Tài khoản này không dùng cho ứng dụng dụ lịch. Vui lòng đăng nhập đúng cổng thông tin theo vai trò của bạn.",
  );
  error.code = "ROLE_NOT_ALLOWED_ON_MOBILE";
  throw error;
};
