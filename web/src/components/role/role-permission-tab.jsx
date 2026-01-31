import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PermissionCheckbox } from "./permission-checkbox";
import { roleService } from "@/apis/roleService";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RolePermissionTab({ role, onUpdated, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [initialPermissions, setInitialPermissions] = useState(new Set());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [role]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        permissionService.getPermissionsByModule(false),
        roleService.getRolePermissions(role.id),
      ]);

      if (permissionsResponse?.success && permissionsResponse.permissions) {
        setAllPermissions(permissionsResponse.permissions);

        const currentPermissionIds = new Set();
        if (
          rolePermissionsResponse?.success &&
          rolePermissionsResponse.data?.permissions
        ) {
          Object.values(rolePermissionsResponse.data.permissions).forEach(
            (perms) => {
              perms.forEach((p) => currentPermissionIds.add(p.id));
            },
          );
        }

        setSelectedPermissions(currentPermissionIds);
        setInitialPermissions(currentPermissionIds);

        const modules = Object.keys(permissionsResponse.permissions);
        setExpandedModules(new Set(modules.slice(0, 3)));
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách quyền";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set();
    Object.values(filteredPermissions).forEach((perms) => {
      perms.forEach((p) => allIds.add(p.id));
    });
    setSelectedPermissions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPermissions(new Set());
  };

  const handleToggleModule = (module) => {
    const modulePermissions = filteredPermissions[module] || [];
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.has(id));

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        moduleIds.forEach((id) => newSet.delete(id));
      } else {
        moduleIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const permissionIds = Array.from(selectedPermissions);

      const response = await roleService.updateRolePermissions(
        role.id,
        permissionIds,
      );

      if (response?.success) {
        toast.success(response.message || "Cập nhật quyền thành công");
        setInitialPermissions(new Set(selectedPermissions));

        if (onUpdated) {
          onUpdated();
        }

        onClose();
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật quyền";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    let result = { ...allPermissions };

    if (moduleFilter !== "all") {
      result = { [moduleFilter]: allPermissions[moduleFilter] || [] };
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      const filtered = {};

      Object.entries(result).forEach(([module, perms]) => {
        const matched = perms.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.displayName.toLowerCase().includes(lowerSearch),
        );
        if (matched.length > 0) {
          filtered[module] = matched;
        }
      });

      result = filtered;
    }

    return result;
  }, [allPermissions, moduleFilter, search]);

  const stats = useMemo(() => {
    let totalFiltered = 0;
    let selectedFiltered = 0;

    Object.values(filteredPermissions).forEach((perms) => {
      totalFiltered += perms.length;
      selectedFiltered += perms.filter((p) =>
        selectedPermissions.has(p.id),
      ).length;
    });

    return {
      total: totalFiltered,
      selected: selectedFiltered,
      percentage:
        totalFiltered > 0 ? (selectedFiltered / totalFiltered) * 100 : 0,
    };
  }, [filteredPermissions, selectedPermissions]);

  const hasChanges = useMemo(() => {
    if (selectedPermissions.size !== initialPermissions.size) return true;
    for (const id of selectedPermissions) {
      if (!initialPermissions.has(id)) return true;
    }
    return false;
  }, [selectedPermissions, initialPermissions]);

  const toggleModuleExpand = (module) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-icons-round text-lg">search</span>
          </span>
          <Input
            placeholder="Tìm quyền..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border-slate-200 dark:border-slate-800">
            <SelectValue placeholder="Lọc theo module" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
            <SelectItem value="all">Tất cả modules</SelectItem>
            {Object.keys(allPermissions).map((module) => (
              <SelectItem key={module} value={module}>
                {MODULE_DISPLAY_NAMES[module] || module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress and Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 dark:border-slate-800">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>
              Đã chọn: {stats.selected} / {stats.total} quyền
            </span>
            <span className="text-slate-400">
              ({Math.round(stats.percentage)}%)
            </span>
          </div>
          <Progress
            value={stats.percentage}
            className="h-2 w-full sm:w-[240px] bg-slate-200 dark:bg-slate-700"
            indicatorClassName="bg-blue-600"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={stats.selected === stats.total}
            className="flex-1 sm:flex-none rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-icons-round text-sm mr-2 text-blue-500">
              check_circle
            </span>
            Chọn tất cả
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={stats.selected === 0}
            className="flex-1 sm:flex-none rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-icons-round text-sm mr-2 text-slate-500">
              cancel
            </span>
            Bỏ chọn
          </Button>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {Object.keys(filteredPermissions).length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="material-icons-round text-4xl mb-2 opacity-50">
              search_off
            </span>
            <p>Không tìm thấy quyền nào</p>
          </div>
        ) : (
          Object.entries(filteredPermissions).map(([module, permissions]) => {
            const moduleSelected = permissions.filter((p) =>
              selectedPermissions.has(p.id),
            ).length;
            const moduleTotal = permissions.length;
            const isExpanded = expandedModules.has(module);

            return (
              <div
                key={module}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
              >
                <div
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 cursor-pointer select-none"
                  onClick={() => toggleModuleExpand(module)}
                >
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={
                          moduleSelected === moduleTotal && moduleTotal > 0
                            ? true
                            : moduleSelected > 0
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={() => handleToggleModule(module)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="font-bold text-slate-800 dark:text-slate-200 text-base cursor-pointer">
                        {MODULE_DISPLAY_NAMES[module] || module}
                      </Label>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {moduleSelected}/{moduleTotal} quyền được chọn
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-2.5"
                    >
                      {module}
                    </Badge>
                    <span
                      className={cn(
                        "material-icons-round text-slate-400 transition-transform duration-200",
                        isExpanded ? "rotate-180" : "",
                      )}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    {permissions.map((permission) => (
                      <PermissionCheckbox
                        key={permission.id}
                        permission={permission}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() =>
                          handleTogglePermission(permission.id)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-t-2xl -mx-4 -mb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:rounded-none">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-xl border-slate-300"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="material-icons-round animate-spin text-sm">
                refresh
              </span>
              Đang lưu...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="material-icons-round text-sm">save</span>
              Lưu thay đổi
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
