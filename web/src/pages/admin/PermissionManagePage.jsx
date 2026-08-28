import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES } from "@/constants/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Shield,
  Users,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Flag,
  Settings,
  Grid3x3,
  CreditCard,
  Eye,
  Edit,
  BarChart3,
  Layers,
  Hash,
} from "lucide-react";
import TimStatsCard from "@/components/admin/TimStatsCard";

export default function PermissionManagePage() {
  const [permissions, setPermissions] = useState({});
  const [moduleStats, setModuleStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPermissions: 0,
    totalModules: 0,
  });

  const getPermissionActionClass = (action) => {
    if (action === "view") return "bg-blue-50 text-blue-700 border border-blue-200";
    if (action === "delete") return "bg-rose-50 text-rose-700 border border-rose-200";
    return "bg-slate-100 text-slate-800 border border-slate-200";
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionService.getPermissionsByModule(true);

      const data = response?.data || response;
      if (data && data.permissions) {
        setPermissions(data.permissions);
        setModuleStats(data.moduleStats || {});
        setStats({
          totalPermissions: data.totalPermissions,
          totalModules: data.totalModules,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách quyền:", error);
      toast.error("Không thể tải danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleOpenModule = (module) => {
    setSelectedModule(module);
    setModalOpen(true);
  };

  const MODULE_ICON_MAP = {
    users: Users,
    roles: Shield,
    places: MapPin,
    bookings: Calendar,
    reviews: Star,
    business: Briefcase,
    reports: Flag,
    system: Settings,
    categories: Grid3x3,
    payments: CreditCard,
  };

  const getModuleIcon = (module) => {
    return MODULE_ICON_MAP[module] || Shield;
  };

  const maxPermissionsPerModule = useMemo(() => {
    const vals = Object.values(permissions || {}).map((arr) =>
      Array.isArray(arr) ? arr.length : 0,
    );
    return vals.length ? Math.max(...vals, 0) : 0;
  }, [permissions]);

  const avgPerModule =
    stats.totalModules > 0
      ? Math.round((stats.totalPermissions / stats.totalModules) * 10) / 10
      : 0;

  // Helper to safely get nested values without errors
  const modules = Object.keys(permissions || {});

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Phân hệ Chức năng & Quyền Truy cập
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Quản lý Quyền hạn
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Danh mục chi tiết các quyền thực thi và truy cập theo từng module hệ thống.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={fetchPermissions}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 text-slate-700 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimStatsCard
          title="TỔNG QUYỀN"
          value={stats.totalPermissions}
          icon={Shield}
        />
        <TimStatsCard
          title="PHÂN HỆ (MODULE)"
          value={stats.totalModules}
          icon={Layers}
        />
        <TimStatsCard
          title="TB / MODULE"
          value={avgPerModule}
          icon={BarChart3}
        />
        <TimStatsCard
          title="MAX QUYỀN / MODULE"
          value={maxPermissionsPerModule}
          icon={Hash}
        />
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 h-48 animate-pulse shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const IconComponent = getModuleIcon(module);
            const perms = permissions[module] || [];
            const modStats = moduleStats[module] || {};

            const displayName =
              MODULE_DISPLAY_NAMES?.[module] ||
              module.charAt(0).toUpperCase() + module.slice(1);

            return (
              <div
                key={module}
                onClick={() => handleOpenModule(module)}
                className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600">
                      {perms.length} quyền
                    </div>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-950 tracking-tight">
                    {displayName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    {modStats.rolesUsing || 0} vai trò sử dụng
                  </p>
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-slate-600 font-medium">
                      <Eye className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      <span>Xem</span>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      {perms.filter((p) => p.action === "view").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-slate-600 font-medium">
                      <Edit className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      <span>Thao tác</span>
                    </div>
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                      {
                        perms.filter((p) =>
                          ["create", "update", "delete", "manage"].includes(
                            p.action,
                          ),
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader className="p-6 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-950">
              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                {selectedModule &&
                  (() => {
                    const IconComponent = getModuleIcon(selectedModule);
                    return <IconComponent className="h-4 w-4" />;
                  })()}
              </div>
              {selectedModule &&
                (MODULE_DISPLAY_NAMES?.[selectedModule] || selectedModule)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-6">
            <div className="grid gap-3">
              {selectedModule &&
                permissions[selectedModule]?.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all"
                  >
                    <div className="space-y-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-950 text-sm">
                          {permission.name}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                            getPermissionActionClass(permission.action),
                          )}
                        >
                          {permission.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {permission.description}
                      </p>
                      {permission.roles && permission.roles.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 mt-2">
                          <span className="text-xs text-slate-400 mr-1">
                            Vai trò:
                          </span>
                          {permission.roles.map((role) => (
                            <span
                              key={role.id}
                              className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                            >
                              {role.displayName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
