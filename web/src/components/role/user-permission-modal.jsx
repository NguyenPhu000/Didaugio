import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionCheckbox } from "./permission-checkbox";
import { userPermissionService } from "@/apis/userPermissionService";
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
  UserCog,
  Info,
  RotateCcw,
} from "lucide-react";

export function UserPermissionModal({
  open,
  onOpenChange,
  user,
  userIds,
  role,
  onUpdated,
  isBulk = false,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [initialPermissions, setInitialPermissions] = useState(new Set());
  const [rolePermissions, setRolePermissions] = useState(new Set());
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy tất cả permissions
      const permissionsResponse =
        await permissionService.getPermissionsByModule(false);

      const permData = permissionsResponse?.data || permissionsResponse;
      if (!permData || !permData.permissions) {
        throw new Error("Không thể tải danh sách quyền");
      }

      setAllPermissions(permData.permissions);

      // Lấy quyền của user (nếu single mode)
      if (!isBulk && user) {
        const userPermsResponse =
          await userPermissionService.getUserPermissions(user.id);

        const userPermData = userPermsResponse?.data || userPermsResponse;
        if (userPermData && userPermData.permissions) {
          const allUserPermissions = new Set(); // TẤT CẢ quyền user có
          const roleOnlyPermissions = new Set(); // Quyền CHỈ từ role (để hiển thị badge)

          Object.values(userPermData.permissions).forEach((perms) => {
            perms.forEach((p) => {
              allUserPermissions.add(p.id); // Thêm tất cả vào selected
              if (p.source === "role" && !p.hasBothSources) {
                roleOnlyPermissions.add(p.id); // Badge "Từ vai trò"
              }
            });
          });

          setSelectedPermissions(allUserPermissions);
          setInitialPermissions(new Set(allUserPermissions));
          setRolePermissions(roleOnlyPermissions); // Chỉ để hiển thị badge
        }
      } else if (isBulk) {
        // Bulk mode: bắt đầu với empty selection
        setSelectedPermissions(new Set());
        setInitialPermissions(new Set());
        setRolePermissions(new Set());
      }

      const modules = Object.keys(permData.permissions);
      setExpandedModules(new Set(modules.slice(0, 3)));
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách quyền";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [user, isBulk]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

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

      if (isBulk) {
        if (!userIds || userIds.length === 0) {
          toast.error("Không có user nào được chọn");
          return;
        }

        const response = await userPermissionService.bulkAssignPermissions(
          userIds,
          permissionIds,
        );

        if (response?.success) {
          toast.success(
            response.message ||
              `Đã cập nhật quyền cho ${userIds.length} users`,
          );
          if (onUpdated) onUpdated();
          onOpenChange(false);
        }
      } else {
        if (!user) {
          toast.error("Không tìm thấy thông tin user");
          return;
        }

        const response = await userPermissionService.updateUserPermissions(
          user.id,
          permissionIds,
        );

        if (response?.success) {
          toast.success(
            response.message || "Cập nhật quyền thành công",
          );
          if (onUpdated) onUpdated();
          onOpenChange(false);
        }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 border-b border-black/[0.04] bg-[#FAF9F5]">
          <DialogTitle className="text-xl flex items-center gap-3 font-extrabold tracking-tight text-slate-950">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <UserCog className="h-5 w-5" />
            </div>
            {isBulk
              ? `Chỉnh quyền cho ${userIds?.length || 0} thành viên`
              : `Phân quyền riêng: ${user?.fullName || user?.email}`}
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1 text-xs font-medium">
            {isBulk
              ? "Các quyền được tích chọn bên dưới sẽ được áp dụng cho toàn bộ danh sách thành viên đã chọn."
              : `Vai trò cơ sở: ${role?.displayName || role?.name}. Các quyền chọn riêng sẽ bổ sung hoặc ghi đè quyền từ vai trò.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="space-y-4 p-6 pb-0">
              {!isBulk && rolePermissions.size > 0 && (
                <Alert className="bg-blue-50/70 border border-blue-200/80 text-blue-900 rounded-2xl">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <AlertDescription className="text-xs font-medium">
                    {rolePermissions.size} quyền có nhãn &ldquo;Từ vai trò&rdquo; là quyền mặc định kế thừa. Bạn có thể bật hoặc tắt linh hoạt cho tài khoản này.
                  </AlertDescription>
                </Alert>
              )}

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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-900">
                    <span>
                      Đã chọn: <strong className="font-mono">{stats.selected}</strong> / <span className="font-mono text-slate-500">{stats.total}</span>
                    </span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold">
                      {Math.round(stats.percentage)}%
                    </span>
                  </div>
                  <div className="w-full sm:w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-950 transition-all duration-300 rounded-full"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = new Set();
                      Object.values(filteredPermissions).forEach((perms) => {
                        perms.forEach((p) => allIds.add(p.id));
                      });
                      setSelectedPermissions(allIds);
                    }}
                    disabled={stats.selected === stats.total}
                    className="flex-1 sm:flex-none rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                    Chọn tất cả
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions(new Set())}
                    disabled={stats.selected === 0}
                    className="flex-1 sm:flex-none rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 py-2 h-[calc(90vh-450px)]">
              <div className="space-y-3 pb-4">
                {Object.keys(filteredPermissions).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-black/[0.04]">
                    <SearchX className="h-10 w-10 mx-auto mb-2 opacity-40 stroke-[1.5]" />
                    <p className="text-xs font-semibold">
                      Không tìm thấy quyền phù hợp
                    </p>
                  </div>
                ) : (
                  Object.entries(filteredPermissions).map(
                    ([module, permissions]) => {
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
                                  onCheckedChange={() =>
                                    handleToggleModule(module)
                                  }
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
                              {permissions.map((permission) => {
                                const isInherited = rolePermissions.has(
                                  permission.id,
                                );
                                const isCustomSelected =
                                  selectedPermissions.has(permission.id);
                                const isChecked =
                                  isInherited || isCustomSelected;

                                return (
                                  <PermissionCheckbox
                                    key={permission.id}
                                    permission={permission}
                                    checked={isChecked}
                                    onCheckedChange={() =>
                                      handleTogglePermission(permission.id)
                                    }
                                    isInherited={isInherited}
                                    showSource={!isBulk}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex items-center justify-between p-6 border-t border-black/[0.04] bg-[#FAF9F5]">
              <div>
                {!isBulk && rolePermissions.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPermissions(new Set(rolePermissions))
                    }
                    disabled={saving}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Đặt lại mặc định
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </Button>
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
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
