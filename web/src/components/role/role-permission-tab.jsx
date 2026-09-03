import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PermissionCheckbox } from "./permission-checkbox";
import { roleService } from "@/apis/roleService";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  Save,
  RefreshCw,
  SearchX,
  Shield,
} from "lucide-react";

export function RolePermissionTab({ role, onUpdated, onClose, readOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [initialPermissions, setInitialPermissions] = useState(new Set());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        permissionService.getPermissionsByModule(false),
        roleService.getRolePermissions(role.id),
      ]);

      // 1. Parse toàn bộ quyền hệ thống nhóm theo module
      const rawPermData = permissionsResponse?.data ?? permissionsResponse;
      const groupedPerms = rawPermData?.permissions ?? rawPermData ?? {};
      setAllPermissions(groupedPerms);

      // 2. Parse danh sách quyền hiện tại của vai trò này
      const currentPermissionIds = new Set();
      const rawRoleData = rolePermissionsResponse?.data ?? rolePermissionsResponse;
      const rolePerms = rawRoleData?.permissions ?? rawRoleData ?? {};

      if (Array.isArray(rolePerms)) {
        rolePerms.forEach((p) => {
          if (p?.id != null) currentPermissionIds.add(p.id);
          else if (typeof p === "number") currentPermissionIds.add(p);
        });
      } else if (rolePerms && typeof rolePerms === "object") {
        Object.values(rolePerms).forEach((perms) => {
          if (Array.isArray(perms)) {
            perms.forEach((p) => {
              if (p?.id != null) currentPermissionIds.add(p.id);
              else if (typeof p === "number") currentPermissionIds.add(p);
            });
          }
        });
      }

      setSelectedPermissions(currentPermissionIds);
      setInitialPermissions(new Set(currentPermissionIds));

      // Mở rộng tất cả các module để người dùng xem được ngay
      const modules = Object.keys(groupedPerms);
      setExpandedModules(new Set(modules));
    } catch (error) {
      console.error("Lỗi tải quyền của vai trò:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách quyền";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [role?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePermission = (permissionId) => {
    if (readOnly) return;
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
    if (readOnly) return;
    const allIds = new Set();
    Object.values(filteredPermissions).forEach((perms) => {
      perms.forEach((p) => allIds.add(p.id));
    });
    setSelectedPermissions(allIds);
  };

  const handleDeselectAll = () => {
    if (readOnly) return;
    setSelectedPermissions(new Set());
  };

  const handleToggleModule = (module) => {
    if (readOnly) return;
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
    if (readOnly) return;
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
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Read-only banner */}
      {readOnly && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-blue-600 shrink-0" />
          <p className="text-xs font-medium text-blue-900">
            Chế độ xem quyền — Super Admin tự động có toàn quyền truy cập hệ thống
          </p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Tìm kiếm quyền theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800">
            <SelectValue placeholder="Lọc module" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-lg">
            <SelectItem value="all" className="text-xs font-medium">
              Tất cả modules
            </SelectItem>
            {Object.keys(allPermissions).map((module) => (
              <SelectItem
                key={module}
                value={module}
                className="text-xs font-medium"
              >
                {MODULE_DISPLAY_NAMES[module] || module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress and Actions */}
      <div className="bg-white p-4 rounded-2xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-semibold text-slate-900">
            <span>
              Đã chọn: <strong className="font-mono">{stats.selected}</strong> / <span className="font-mono text-slate-500">{stats.total}</span>
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold">
              {Math.round(stats.percentage)}%
            </span>
          </div>
          <div className="w-full sm:w-[240px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-950 transition-all duration-300 rounded-full"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={stats.selected === stats.total}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Chọn tất cả
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={stats.selected === 0}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Bỏ chọn
            </Button>
          </div>
        )}
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {Object.keys(filteredPermissions).length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-black/[0.04]">
            <SearchX className="h-10 w-10 mx-auto mb-2 opacity-40 stroke-[1.5]" />
            <p className="text-xs font-semibold">Không tìm thấy quyền phù hợp</p>
          </div>
        ) : (
          Object.entries(filteredPermissions).map(([module, permissions]) => {
            const moduleSelected = permissions.filter((p) =>
              selectedPermissions.has(p.id),
            ).length;
            const moduleTotal = permissions.length;
            const isExpanded = expandedModules.has(module);
            let moduleCheckedState = false;
            if (moduleSelected === moduleTotal && moduleTotal > 0) {
              moduleCheckedState = true;
            } else if (moduleSelected > 0) {
              moduleCheckedState = "indeterminate";
            }

            return (
              <div
                key={module}
                className="rounded-2xl border border-black/[0.04] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all"
              >
                <div
                  className="flex items-center justify-between p-4 bg-white cursor-pointer select-none hover:bg-slate-50/80 transition-all"
                  onClick={() => toggleModuleExpand(module)}
                >
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={moduleCheckedState}
                        onCheckedChange={() => handleToggleModule(module)}
                        disabled={readOnly}
                        className="rounded-md border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                      />
                    </div>
                    <div>
                      <Label className="font-bold text-slate-950 text-sm cursor-pointer">
                        {MODULE_DISPLAY_NAMES[module] || module}
                      </Label>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {moduleSelected}/{moduleTotal} quyền
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {module}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        isExpanded ? "rotate-180" : "",
                      )}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2 bg-slate-50/50 border-t border-black/[0.04]">
                    {permissions.map((permission) => (
                      <PermissionCheckbox
                        key={permission.id}
                        permission={permission}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() =>
                          handleTogglePermission(permission.id)
                        }
                        disabled={readOnly}
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
      <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-black/[0.04] sticky bottom-0 bg-white p-4 -mx-4 -mb-4 shadow-lg sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
        >
          {readOnly ? "Đóng" : "Hủy"}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-3.5 w-3.5" />
                Lưu thay đổi
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
