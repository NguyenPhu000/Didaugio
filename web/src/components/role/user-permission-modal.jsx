import { useState, useEffect, useMemo, useCallback } from "react";
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
      } else {
        // Bulk mode: start with empty
        setSelectedPermissions(new Set());
        setInitialPermissions(new Set());
        setRolePermissions(new Set());
      }

      const modules = Object.keys(permData.permissions);
      setExpandedModules(new Set(modules.slice(0, 3)));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách quyền");
    } finally {
      setLoading(false);
    }
  }, [isBulk, user]);

  useEffect(() => {
    if (open && (user || isBulk)) {
      fetchData();
    }
  }, [open, user, isBulk, fetchData]);

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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-white border-2 border-black rounded-none shadow-hard">
        <DialogHeader className="p-6 border-b-2 border-black">
          <DialogTitle className="text-xl flex items-center gap-3 font-bold uppercase tracking-wider">
            <div className="h-8 w-8 bg-black text-white flex items-center justify-center">
              <UserCog className="h-5 w-5" />
            </div>
            {isBulk
              ? `CHỈNH QUYỀN CHO ${userIds?.length || 0} USERS`
              : `CHỈNH QUYỀN - ${user?.fullName || user?.email}`}
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1 font-mono text-xs uppercase">
            {isBulk
              ? "QUYỀN ĐƯỢC THÊM SẼ ÁP DỤNG CHO TẤT CẢ USERS"
              : `VAI TRÒ: ${role?.displayName}. QUYỀN CUSTOM SẼ OVERRIDE QUYỀN TỪ ROLE.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-full border border-black" />
            <Skeleton className="h-10 w-full border border-black" />
            <Skeleton className="h-40 w-full border border-black" />
          </div>
        ) : (
          <>
            <div className="space-y-4 p-6 pb-0">
              {!isBulk && rolePermissions.size > 0 && (
                <Alert className="bg-[#F3E600]/10 border-2 border-[#F3E600] text-black rounded-none">
                  <Info className="h-4 w-4 text-black" />
                  <AlertDescription className="text-xs font-mono uppercase">
                    {rolePermissions.size} QUYỀN CÓ BADGE "ROLE" LÀ QUYỀN MẶC
                    ĐỊNH. BẠN CÓ THỂ BỎ CHỌN HOẶC THÊM QUYỀN KHÁC.
                  </AlertDescription>
                </Alert>
              )}

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
                    <SelectItem
                      value="all"
                      className="uppercase font-mono text-xs"
                    >
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-black">
                <div className="space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3 text-xs font-bold text-black uppercase tracking-wider">
                    <span className="font-mono">
                      ĐÃ CHỌN: {stats.selected} / {stats.total}
                    </span>
                    <span className="bg-[#F3E600] text-black px-2 py-0.5 font-mono">
                      {Math.round(stats.percentage)}%
                    </span>
                  </div>
                  <div className="w-full sm:w-[200px] h-1 bg-gray-200 border border-gray-300">
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
                    onClick={() => {
                      const allIds = new Set();
                      Object.values(filteredPermissions).forEach((perms) => {
                        perms.forEach((p) => allIds.add(p.id));
                      });
                      setSelectedPermissions(allIds);
                    }}
                    disabled={stats.selected === stats.total}
                    className="flex-1 sm:flex-none rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
                  >
                    <CheckCircle className="h-3 w-3 mr-2" />
                    CHỌN TẤT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissions(new Set())}
                    disabled={stats.selected === 0}
                    className="flex-1 sm:flex-none rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
                  >
                    <XCircle className="h-3 w-3 mr-2" />
                    BỎ CHỌN
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-6 py-2 h-[calc(90vh-450px)]">
              <div className="space-y-3 pb-4">
                {Object.keys(filteredPermissions).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white border border-black border-dashed">
                    <SearchX className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="uppercase font-mono text-xs">
                      KHÔNG TÌM THẤY QUYỀN
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
                          className="border border-black overflow-hidden transition-all hover:shadow-hard"
                        >
                          <div
                            className="flex items-center justify-between p-4 bg-white cursor-pointer select-none hover:bg-gray-50 border-l-4 border-l-transparent hover:border-l-[#F3E600] transition-all"
                            onClick={() => toggleModuleExpand(module)}
                          >
                            <div className="flex items-center gap-3">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={moduleCheckedState}
                                  onCheckedChange={() =>
                                    handleToggleModule(module)
                                  }
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

            <DialogFooter className="flex items-center justify-between p-6 border-t-2 border-black">
              <div>
                {!isBulk && rolePermissions.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedPermissions(new Set(rolePermissions))
                    }
                    disabled={saving}
                    className="text-black hover:bg-gray-100 border border-black rounded-none uppercase text-xs font-bold"
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    ĐẶT LẠI MẶC ĐỊNH
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
