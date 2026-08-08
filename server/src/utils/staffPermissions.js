export const STAFF_OPERATION_PERMISSIONS = new Set([
  "bookings.view",
  "bookings.confirm",
  "bookings.cancel",
  "bookings.complete",
]);

export const getStaffOperationPermissions = (permissions) =>
  new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission) => STAFF_OPERATION_PERMISSIONS.has(permission))
      : [],
  );
