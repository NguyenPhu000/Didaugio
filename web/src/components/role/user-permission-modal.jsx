import { useState, useEffect, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionCheckbox } from "./permission-checkbox";
import { userPermissionService } from "@/services/userPermissionService";
import { permissionService } from "@/services/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/config/permissions";
import {
  Search,
  Save,
  Info,
  ChevronDown,
  ChevronUp,
  Trash,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

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
          permissionIds
        );
        toast.success(`Cập nhật quyền cho ${userIds.length} users thành công`);
      } else {
        await userPermissionService.updateUserPermissions(
          user.id,
          permissionIds
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
            p.displayName.toLowerCase().includes(lowerSearch)
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
        selectedPermissions.has(p.id)
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isBulk
              ? `Chỉnh quyền cho ${userIds?.length || 0} users`
              : `Chỉnh quyền - ${user?.fullName || user?.email}`}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? "Quyền được thêm sẽ áp dụng cho tất cả users đã chọn"
              : `Vai trò: ${role?.displayName}. Quyền custom sẽ override quyền từ role.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {!isBulk && rolePermissions.size > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {rolePermissions.size} quyền có badge "Từ vai trò" là quyền
                    mặc định. Bạn có thể bỏ chọn nếu không muốn user có quyền
                    đó, hoặc thêm quyền khác.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm quyền..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Lọc theo module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả modules</SelectItem>
                    {Object.keys(allPermissions).map((module) => (
                      <SelectItem key={module} value={module}>
                        {MODULE_DISPLAY_NAMES[module] || module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Đã chọn: {stats.selected} / {stats.total} quyền
                  </p>
                  <Progress
                    value={stats.percentage}
                    className="h-2 w-[200px]"
                  />
                </div>
                <div className="flex gap-2">
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
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Chọn tất cả
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions(new Set())}
                    disabled={stats.selected === 0}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4 h-[calc(90vh-400px)]">
              <div className="space-y-3 pb-4">
                {Object.keys(filteredPermissions).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy quyền nào
                  </div>
                ) : (
                  Object.entries(filteredPermissions).map(
                    ([module, permissions]) => {
                      const moduleSelected = permissions.filter((p) =>
                        selectedPermissions.has(p.id)
                      ).length;
                      const moduleTotal = permissions.length;
                      const isExpanded = expandedModules.has(module);

                      return (
                        <div
                          key={module}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div
                            className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                            onClick={() => toggleModuleExpand(module)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={moduleSelected === moduleTotal}
                                onCheckedChange={() =>
                                  handleToggleModule(module)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div>
                                <Label className="font-semibold cursor-pointer">
                                  {MODULE_DISPLAY_NAMES[module] || module}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {moduleSelected}/{moduleTotal} quyền custom
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{module}</Badge>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-2 bg-background">
                              {permissions.map((permission) => {
                                const isInherited = rolePermissions.has(
                                  permission.id
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
                    }
                  )
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex items-center justify-between">
              <div>
                {!isBulk && rolePermissions.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedPermissions(new Set(rolePermissions))
                    }
                    disabled={saving}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Đặt lại về mặc định
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges || saving}>
                  {saving ? (
                    <>Đang lưu...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </>
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
