import { Search, CheckCircle2, XCircle, Save, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { roleService } from "@/apis/roleService";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function RolePermissionModal({
  open,
  onOpenChange,
  role,
  onPermissionsUpdated,
}) {
  const { t } = useTranslation();
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

      // 1. Parse all system permissions
      const rawPermData = permissionsResponse?.data ?? permissionsResponse;
      const groupedPerms = rawPermData?.permissions ?? rawPermData ?? {};
      setAllPermissions(groupedPerms);

      // 2. Parse current role permissions
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

      const modules = Object.keys(groupedPerms);
      setExpandedModules(new Set(modules));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error(t("role.permissionModal.loadFailed") || "Không thể tải danh sách quyền");
    } finally {
      setLoading(false);
    }
  }, [role?.id, t]);

  useEffect(() => {
    if (open && role) {
      fetchData();
    }
  }, [open, role, fetchData]);

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

      await roleService.updateRolePermissions(role.id, permissionIds);

      toast.success(t("role.permissionModal.saveSuccess") || "Lưu quyền thành công");
      setInitialPermissions(new Set(selectedPermissions));

      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền:", error);
      toast.error(error.response?.data?.message || t("role.permissionModal.saveFailed") || "Không thể lưu quyền");
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
            p.displayName.toLowerCase().includes(lowerSearch) ||
            (p.description && p.description.toLowerCase().includes(lowerSearch))
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{t("role.permissionModal.title")}</span>
            <Badge variant="outline">{role?.displayName}</Badge>
          </DialogTitle>
          <DialogDescription>
            {t("role.permissionModal.description")}
          </DialogDescription>
        </DialogHeader>

        {role?.isSystem && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              {t("role.permissionModal.systemRoleWarning")}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("role.permissionModal.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("role.permissionModal.filterModule")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("role.permissionModal.allModules")}</SelectItem>
              {Object.keys(allPermissions).map((module) => (
                <SelectItem key={module} value={module}>
                  {MODULE_DISPLAY_NAMES[module] || module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>
              {t("role.permissionModal.selected")}: {stats.selected} / {stats.total} (
              {stats.percentage.toFixed(0)}%)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={stats.selected === stats.total}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {t("role.permissionModal.selectAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={stats.selected === 0}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {t("role.permissionModal.deselectAll")}
              </Button>
            </div>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {Object.entries(filteredPermissions).map(([module, permissions]) => {
                const moduleSelected = permissions.filter((p) =>
                  selectedPermissions.has(p.id)
                ).length;
                const moduleTotal = permissions.length;
                const isExpanded = expandedModules.has(module);
                const allModuleSelected = moduleSelected === moduleTotal;
                const someModuleSelected = moduleSelected > 0 && !allModuleSelected;

                return (
                  <div
                    key={module}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={
                            allModuleSelected
                              ? true
                              : someModuleSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={() => handleToggleModule(module)}
                        />
                        <div>
                          <Label className="font-semibold text-base">
                            {MODULE_DISPLAY_NAMES[module] || module}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {moduleSelected} / {moduleTotal} {t("role.permissionModal.permissions")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleModuleExpand(module)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
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
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {hasChanges && (
              <span className="text-amber-500 font-medium">
                {t("role.permissionModal.unsavedChanges")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
