import { useState, useMemo, useCallback, memo, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Check,
  X,
  Minus,
} from "lucide-react";
import {
  PERMISSION_MODULES,
  MODULE_DISPLAY_NAMES,
  PERMISSIONS,
} from "@/constants/permissions";

const STATUS_STYLES = {
  granted: "bg-emerald-50 border-emerald-200 text-emerald-700",
  denied: "bg-gray-50 border-gray-200 text-gray-400",
  inherited: "bg-blue-50 border-blue-200 text-blue-600",
};

const STATUS_ICONS = {
  granted: <Check className="h-3 w-3" />,
  denied: <X className="h-3 w-3" />,
  inherited: <Minus className="h-3 w-3" />,
};

/**
 * Group permissions by module from the PERMISSIONS constant.
 */
function groupPermissionsByModule() {
  const groups = {};
  for (const [moduleKey, perms] of Object.entries(PERMISSIONS)) {
    const moduleSlug =
      PERMISSION_MODULES[moduleKey] || moduleKey.toLowerCase();
    if (!groups[moduleSlug]) {
      groups[moduleSlug] = {
        key: moduleSlug,
        name: MODULE_DISPLAY_NAMES[moduleSlug] || moduleKey,
        permissions: [],
      };
    }
    for (const [actionKey, permName] of Object.entries(perms)) {
      groups[moduleSlug].permissions.push({
        key: permName,
        label: actionKey
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/^\w/, (c) => c.toUpperCase()),
        module: moduleSlug,
      });
    }
  }
  return Object.values(groups);
}

/**
 * ModuleHeader — expandable module row with "Select All" per column.
 */
const ModuleHeader = memo(function ModuleHeader({
  group,
  expanded,
  onToggle,
  roles,
  matrix,
  onSelectAllModule,
  onSelectAllRole,
}) {
  const modulePerms = group.permissions.map((p) => p.key);
  const allGrantedForRole = useCallback(
    (roleKey) =>
      modulePerms.every((pk) => matrix[roleKey]?.[pk] === "granted"),
    [modulePerms, matrix],
  );
  const someGrantedForRole = useCallback(
    (roleKey) =>
      modulePerms.some((pk) => matrix[roleKey]?.[pk] === "granted"),
    [modulePerms, matrix],
  );

  return (
    <tr className="bg-muted/50">
      <td className="sticky left-0 z-10 bg-muted/50 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Shield className="h-4 w-4 text-primary" />
          {group.name}
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {modulePerms.length}
          </Badge>
        </button>
      </td>
      {roles.map((role) => {
        const all = allGrantedForRole(role.key);
        const some = someGrantedForRole(role.key);
        return (
          <td key={role.key} className="px-2 py-2 text-center">
            <Checkbox
              checked={all ? true : some ? "indeterminate" : false}
              onCheckedChange={(checked) =>
                onSelectAllModule(role.key, group.key, checked)
              }
              aria-label={`Chọn tất cả ${group.name} cho ${role.label}`}
            />
          </td>
        );
      })}
    </tr>
  );
});

/**
 * PermissionRow — single permission row with checkboxes per role.
 */
const PermissionRow = memo(function PermissionRow({
  perm,
  roles,
  matrix,
  onToggle,
}) {
  return (
    <tr className="border-b border-muted/40 hover:bg-muted/20 transition-colors">
      <td className="sticky left-0 z-10 bg-background px-3 py-2 pl-10">
        <span className="text-sm">{perm.label}</span>
      </td>
      {roles.map((role) => {
        const status = matrix[role.key]?.[perm.key] || "denied";
        return (
          <td key={role.key} className="px-2 py-2 text-center">
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded border transition-colors",
                  STATUS_STYLES[status],
                )}
              >
                {STATUS_ICONS[status]}
              </div>
            </div>
          </td>
        );
      })}
    </tr>
  );
});

/**
 * PermissionMatrix — visual grid of permissions × roles.
 *
 * @param {Object} props
 * @param {Array<{key: string, label: string}>} props.roles — Column roles
 * @param {Record<string, Record<string, 'granted'|'denied'|'inherited'>>} props.matrix — roleKey → permKey → status
 * @param {(roleKey: string, permKey: string, status: string) => void} props.onToggle — Called when a cell is toggled
 * @param {boolean} props.readOnly — Disable interactions
 * @param {boolean} props.loading — Show skeleton
 */
export default function PermissionMatrix({
  roles = [],
  matrix = {},
  onToggle,
  readOnly = false,
  loading = false,
}) {
  const groups = useMemo(() => groupPermissionsByModule(), []);
  const [expandedModules, setExpandedModules] = useState(
    () => new Set(groups.map((g) => g.key)),
  );

  const toggleModule = useCallback((key) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleToggle = useCallback(
    (roleKey, permKey) => {
      if (readOnly || !onToggle) return;
      const current = matrix[roleKey]?.[permKey] || "denied";
      const next = current === "granted" ? "denied" : "granted";
      onToggle(roleKey, permKey, next);
    },
    [readOnly, onToggle, matrix],
  );

  const handleSelectAllModule = useCallback(
    (roleKey, moduleKey, checked) => {
      if (readOnly || !onToggle) return;
      const group = groups.find((g) => g.key === moduleKey);
      if (!group) return;
      const status = checked ? "granted" : "denied";
      for (const perm of group.permissions) {
        onToggle(roleKey, perm.key, status);
      }
    },
    [readOnly, onToggle, groups],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 z-20 bg-muted/30 px-3 py-3 text-left text-sm font-semibold min-w-[220px]">
              Quyền hạn
            </th>
            {roles.map((role) => (
              <th
                key={role.key}
                className="px-3 py-3 text-center text-sm font-semibold min-w-[100px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{role.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const isExpanded = expandedModules.has(group.key);
            return (
              <Fragment key={group.key}>
                <ModuleHeader
                  group={group}
                  expanded={isExpanded}
                  onToggle={() => toggleModule(group.key)}
                  roles={roles}
                  matrix={matrix}
                  onSelectAllModule={handleSelectAllModule}
                />
                {isExpanded &&
                  group.permissions.map((perm) => (
                    <PermissionRow
                      key={perm.key}
                      perm={perm}
                      roles={roles}
                      matrix={matrix}
                      onToggle={handleToggle}
                    />
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
