import React from "react";
import { usePermission } from "@/hooks/usePermission";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * PermissionGate — conditionally renders children based on user permissions.
 *
 * @param {string} permission - Single permission string to check
 * @param {string[]} permissions - Array of permission strings (OR or AND logic)
 * @param {boolean} requireAll - If true, requires ALL permissions (AND logic). Default: false (OR)
 * @param {'hide'|'disable'} mode - 'hide' renders fallback, 'disable' renders children as disabled
 * @param {React.ReactNode} fallback - What to render when denied (default: null)
 * @param {React.ReactNode} children
 */
const PermissionGate = ({
  permission,
  permissions,
  requireAll = false,
  mode = "hide",
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermission();

  if (isLoading) {
    return <Skeleton className="h-8 w-20" />;
  }

  let allowed = false;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions && requireAll) {
    allowed = hasAllPermissions(permissions);
  } else if (permissions) {
    allowed = hasAnyPermission(permissions);
  }

  if (allowed) return children;

  if (mode === "disable") {
    return React.cloneElement(children, {
      disabled: true,
      title: "Bạn không có quyền thực hiện hành động này",
    });
  }

  return fallback;
};

export default PermissionGate;
