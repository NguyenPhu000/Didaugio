import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { roleService } from "@/apis/roleService";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import Search from "lucide-react/dist/esm/icons/search";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Save from "lucide-react/dist/esm/icons/save";
import Lightbulb from "lucide-react/dist/esm/icons/lightbulb";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
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

      console.warn("Permissions response:", permissionsResponse);
      console.warn("Role permissions response:", rolePermissionsResponse);

      if (permissionsResponse && permissionsResponse.permissions) {
        setAllPermissions(permissionsResponse.permissions);

        const currentPermissionIds = new Set();
        if (rolePermissionsResponse && rolePermissionsResponse.permissions) {
          Object.values(rolePermissionsResponse.permissions).forEach(
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
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error(t("role.permissionModal.loadFailed"));
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

      toast.success(t("role.permissionModal.saveSuccess"));
      setInitialPermissions(new Set(selectedPermissions));

      if (onPermissionsUpdated) {
        onPermissionsUpdated();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền:", error);
      toast.error(error.response?.data?.message || t("role.permissionModal.saveFailed"));
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

  const getSuggestionForRole = () => {
    const suggestions = {
      admin: t("role.permissionModal.suggestionAdmin"),
      business: t("role.permissionModal.suggestionBusiness"),
      staff: t("role.permissionModal.suggestionStaff"),
      guest: t("role.permissionModal.suggestionGuest"),
    };
    return suggestions[role?.name] || null;
  };

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
            {t("role.permissionModal.title")} - {role?.displayName}
          </DialogTitle>
          <DialogDescription>
            {role?.description || t("role.permissionModal.defaultDescription")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
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
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("role.permissionModal.filterByModule")} />
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

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t("role.permissionModal.selectedCount", { selected: stats.selected, total: stats.total })}
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
                    onClick={handleSelectAll}
                    disabled={stats.selected === stats.total}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("role.permissionModal.selectAll")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={stats.selected === 0}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t("role.permissionModal.deselectAll")}
                  </Button>
                </div>
              </div>

              {getSuggestionForRole() && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>{getSuggestionForRole()}</AlertDescription>
                </Alert>
              )}
            </div>

            <ScrollArea className="flex-1 pr-4 h-[calc(90vh-380px)]">
              <div className="space-y-3 pb-4">
                {Object.keys(filteredPermissions).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("role.permissionModal.noPermissionsFound")}
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
                                  {t("role.permissionModal.modulePermissionCount", { selected: moduleSelected, total: moduleTotal })}
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
                              {permissions.map((permission) => (
                                <PermissionCheckbox
                                  key={permission.id}
                                  permission={permission}
                                  checked={selectedPermissions.has(
                                    permission.id,
                                  )}
                                  onCheckedChange={() =>
                                    handleTogglePermission(permission.id)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("role.permissionModal.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? (
                  <>{t("role.permissionModal.saving")}</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("role.permissionModal.save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
