import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/Label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionCheckbox } from "./permission-checkbox";
import { userPermissionService } from "@/apis/userPermissionService";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (open && (user || isBulk)) {
      fetchData();
    }
  }, [open, user, userIds]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Lấy tất cả permissions
      const permissionsResponse =
        await permissionService.getPermissionsByModule(false);

      if (!permissionsResponse || !permissionsResponse.permissions) {
        throw new Error("Không thể tải danh sách quyền");
      }

      setAllPermissions(permissionsResponse.permissions);

      // Lấy quyền của user (nếu single mode)
      if (!isBulk && user) {
        const userPermsResponse =
          await userPermissionService.getUserPermissions(user.id);

        if (userPermsResponse && userPermsResponse.permissions) {
          const allUserPermissions = new Set(); // TẤT CẢ quyền user có
          const roleOnlyPermissions = new Set(); // Quyền CHỈ từ role (để hiển thị badge)

          Object.values(userPermsResponse.permissions).forEach((perms) => {
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
      } else {
        // Bulk mode: start with empty
        setSelectedPermissions(new Set());
        setInitialPermissions(new Set());
        setRolePermissions(new Set());
      }

      const modules = Object.keys(permissionsResponse.permissions);
      setExpandedModules(new Set(modules.slice(0, 3)));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách quyền");
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
        await userPermissionService.bulkUpdateUserPermissions(
          userIds,
          permissionIds,
        );
        toast.success(`Cập nhật quyền cho ${userIds.length} users thành công`);
      } else {
        await userPermissionService.updateUserPermissions(
          user.id,
          permissionIds,
        );
        toast.success("Cập nhật quyền user thành công");
      }

      setInitialPermissions(new Set(selectedPermissions));

      if (onUpdated) {
        onUpdated();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền:", error);
      toast.error(error.response?.data?.message || "Không thể cập nhật quyền");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCustomPermissions = async () => {
    if (!user || isBulk) return;

    try {
      setSaving(true);
      await userPermissionService.removeUserCustomPermissions(user.id);
      toast.success("Đã xóa tất cả quyền custom");
      setSelectedPermissions(new Set());
      setInitialPermissions(new Set());

      if (onUpdated) {
        onUpdated();
      }
    } catch (error) {
      console.error("Lỗi khi xóa quyền:", error);
      toast.error(error.response?.data?.message || "Không thể xóa quyền");
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-xl flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <span className="material-icons-round">manage_accounts</span>
            </span>
            {isBulk
              ? `Chỉnh quyền cho ${userIds?.length || 0} users`
              : `Chỉnh quyền - ${user?.fullName || user?.email}`}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1">
            {isBulk
              ? "Quyền được thêm sẽ áp dụng cho tất cả users đã chọn"
              : `Vai trò: ${role?.displayName}. Quyền custom sẽ override quyền từ role.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="space-y-4 p-6 pb-0">
              {!isBulk && rolePermissions.size > 0 && (
                <Alert className="bg-blue-50/50 border-blue-100 text-blue-800 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-300">
                  <span className="material-icons-round text-blue-600 dark:text-blue-400 mr-2 text-lg">
                    info
                  </span>
                  <AlertDescription className="text-sm">
                    {rolePermissions.size} quyền có badge "Từ vai trò" là quyền
                    mặc định. Bạn có thể bỏ chọn nếu không muốn user có quyền
                    đó, hoặc thêm quyền khác.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-icons-round text-lg">search</span>
                  </span>
                  <Input
                    placeholder="Tìm quyền..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-slate-200 dark:border-slate-800"
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span>
                      Đã chọn: {stats.selected} / {stats.total} quyền
                    </span>
                  </div>
                  <Progress
                    value={stats.percentage}
                    className="h-2 w-full sm:w-[200px] bg-slate-200 dark:bg-slate-700"
                    indicatorClassName="bg-blue-600"
                  />
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
                    onClick={() => setSelectedPermissions(new Set())}
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
            </div>

            <ScrollArea className="flex-1 px-6 py-2 h-[calc(90vh-450px)]">
              <div className="space-y-3 pb-4">
                {Object.keys(filteredPermissions).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <span className="material-icons-round text-4xl mb-2 opacity-50">
                      search_off
                    </span>
                    <p>Không tìm thấy quyền nào</p>
                  </div>
                ) : (
                  Object.entries(filteredPermissions).map(
                    ([module, permissions]) => {
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
                                    moduleSelected === moduleTotal &&
                                    moduleTotal > 0
                                      ? true
                                      : moduleSelected > 0
                                        ? "indeterminate"
                                        : false
                                  }
                                  onCheckedChange={() =>
                                    handleToggleModule(module)
                                  }
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                                />
                              </div>
                              <div>
                                <Label className="font-bold text-slate-800 dark:text-slate-200 text-base cursor-pointer">
                                  {MODULE_DISPLAY_NAMES[module] || module}
                                </Label>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {moduleSelected}/{moduleTotal} quyền custom
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

            <DialogFooter className="flex items-center justify-between p-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                {!isBulk && rolePermissions.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPermissions(new Set(rolePermissions))
                    }
                    disabled={saving}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="material-icons-round text-sm mr-2">
                      restart_alt
                    </span>
                    Đặt lại về mặc định
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
