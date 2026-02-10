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
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  Save,
  RefreshCw,
  SearchX,
} from "lucide-react";

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
        <Skeleton className="h-10 w-full border border-black" />
        <Skeleton className="h-10 w-full border border-black" />
        <Skeleton className="h-40 w-full border border-black" />
        <Skeleton className="h-40 w-full border border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute left-0 top-0 h-full w-10 bg-black flex items-center justify-center text-white">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="TÌM KIẾM QUYỀN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-10 rounded-none border border-black bg-white focus-visible:ring-0 focus-visible:border-black focus:bg-yellow-50 uppercase text-xs font-mono"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-none border border-black bg-white uppercase text-xs font-bold">
            <SelectValue placeholder="LỌC MODULE" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-black bg-white">
            <SelectItem value="all" className="uppercase font-mono text-xs">
              TẤT CẢ MODULES
            </SelectItem>
            {Object.keys(allPermissions).map((module) => (
              <SelectItem
                key={module}
                value={module}
                className="uppercase font-mono text-xs"
              >
                {MODULE_DISPLAY_NAMES[module] || module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress and Actions */}
      <div className="bg-white p-4 border border-black flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs font-bold text-black uppercase tracking-wider">
            <span className="font-mono">
              ĐÃ CHỌN: {stats.selected} / {stats.total}
            </span>
            <span className="bg-[#F3E600] text-black px-2 py-0.5 font-mono">
              {Math.round(stats.percentage)}%
            </span>
          </div>
          <div className="w-full sm:w-[240px] h-1 bg-gray-200 border border-gray-300">
            <div
              className="h-full bg-[#F3E600] transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={stats.selected === stats.total}
            className="flex-1 sm:flex-none rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
          >
            <CheckCircle className="h-3 w-3 mr-2" />
            CHỌN TẤT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            disabled={stats.selected === 0}
            className="flex-1 sm:flex-none rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
          >
            <XCircle className="h-3 w-3 mr-2" />
            BỎ CHỌN
          </Button>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {Object.keys(filteredPermissions).length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white border border-black border-dashed">
            <SearchX className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="uppercase font-mono text-xs">KHÔNG TÌM THẤY QUYỀN</p>
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
                className="border border-black overflow-hidden transition-all hover:shadow-hard"
              >
                <div
                  className="flex items-center justify-between p-4 bg-white cursor-pointer select-none hover:bg-gray-50 border-l-4 border-l-transparent hover:border-l-[#F3E600] transition-all"
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
                        className="data-[state=checked]:bg-[#F3E600] data-[state=checked]:border-black data-[state=checked]:text-black rounded-none border-2"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 bg-black"></div>
                      <div>
                        <Label className="font-bold text-black text-sm cursor-pointer uppercase tracking-tight">
                          {MODULE_DISPLAY_NAMES[module] || module}
                        </Label>
                        <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
                          {moduleSelected}/{moduleTotal} QUYỀN
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-black text-white rounded-none px-2.5 py-1 font-mono text-xs uppercase"
                    >
                      {module}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-black transition-transform duration-200",
                        isExpanded ? "rotate-180" : "",
                      )}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2 bg-gray-50 border-t-2 border-black">
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
      <div className="flex justify-end gap-3 pt-4 mt-6 border-t-2 border-black sticky bottom-0 bg-white p-4 -mx-4 -mb-4 shadow-hard z-10 sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button
          variant="outline"
          onClick={onClose}
          className="rounded-none border border-black hover:bg-gray-100 uppercase text-xs font-bold"
        >
          HỦY
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="rounded-none bg-black hover:bg-[#F3E600] hover:text-black text-white border border-black shadow-hard uppercase text-xs font-bold"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              ĐANG LƯU...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-3 w-3" />
              LƯU THAY ĐỔI
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
