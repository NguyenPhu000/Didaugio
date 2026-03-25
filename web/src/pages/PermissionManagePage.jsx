import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionService.getPermissionsByModule(true);

      if (response && response.permissions) {
        setPermissions(response.permissions);
        setModuleStats(response.moduleStats || {});
        setStats({
          totalPermissions: response.totalPermissions,
          totalModules: response.totalModules,
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
    <div className="min-h-screen p-8 bg-background relative">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">QUẢN LÝ QUYỀN HẠN</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  RBAC // PERMISSIONS
                </span>
                <p className="tim-meta">PHÂN HỆ CHỨC NĂNG VÀ QUYỀN TRUY CẬP</p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchPermissions}
            className="h-12 w-12 border border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center"
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title="TỔNG QUYỀN"
            value={stats.totalPermissions}
            icon={Shield}
            serial="PRM-001"
          />
          <TimStatsCard
            title="PHÂN HỆ (MODULE)"
            value={stats.totalModules}
            icon={Layers}
            serial="PRM-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="TB / MODULE"
            value={avgPerModule}
            icon={BarChart3}
            serial="PRM-003"
          />
          <TimStatsCard
            title="MAX QUYỀN / MODULE"
            value={maxPermissionsPerModule}
            icon={Hash}
            serial="PRM-004"
            color="bg-yellow-50"
          />
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-black p-6 h-48 animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 bg-gray-200" />
                  <div className="h-6 w-20 bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200" />
                  <div className="h-4 w-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  className="group relative bg-white border border-black p-6 hover:shadow-hard transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#F3E600]/10 -mr-8 -mt-8 rotate-45 transform transition-transform group-hover:scale-150"></div>

                  <div className="flex items-start justify-between relative z-10">
                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center group-hover:bg-[#F3E600] group-hover:text-black transition-colors">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="px-2 py-1 bg-gray-100 border border-gray-200 text-xs font-mono text-gray-600">
                      {perms.length} quyền
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-black relative z-10 uppercase tracking-tight font-display">
                    {displayName}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 relative z-10 font-mono uppercase">
                    {modStats.rolesUsing || 0} vai trò sử dụng
                  </p>

                  <div className="mt-6 space-y-2 relative z-10">
                    <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
                      <div className="flex items-center text-gray-600">
                        <Eye className="h-3 w-3 mr-2" />
                        <span className="font-mono uppercase">Xem</span>
                      </div>
                      <span className="bg-[#F3E600] text-black text-xs font-bold px-2 py-0.5 font-mono">
                        {perms.filter((p) => p.action === "view").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
                      <div className="flex items-center text-gray-600">
                        <Edit className="h-3 w-3 mr-2" />
                        <span className="font-mono uppercase">Thao tác</span>
                      </div>
                      <span className="bg-black text-white text-xs font-bold px-2 py-0.5 font-mono">
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
          <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden bg-white border-2 border-black rounded-none shadow-hard">
            <DialogHeader className="p-6 border-b-2 border-black">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold uppercase tracking-wider">
                <div className="h-8 w-8 bg-black text-white flex items-center justify-center">
                  {selectedModule &&
                    (() => {
                      const IconComponent = getModuleIcon(selectedModule);
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                </div>
                {selectedModule &&
                  (MODULE_DISPLAY_NAMES?.[selectedModule] || selectedModule)}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-6">
              <div className="grid gap-4">
                {selectedModule &&
                  permissions[selectedModule]?.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-black hover:shadow-hard transition-all"
                    >
                      <div className="space-y-1 mb-3 sm:mb-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-black uppercase tracking-tight">
                            {permission.name}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono",
                              permission.action === "view"
                                ? "bg-[#F3E600] text-black"
                                : permission.action === "delete"
                                  ? "bg-red-500 text-white"
                                  : "bg-black text-white",
                            )}
                          >
                            {permission.action}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                          {permission.description}
                        </p>
                        {permission.roles && permission.roles.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 mt-2">
                            <span className="text-xs text-gray-400 mr-1 font-mono uppercase">
                              Vai trò:
                            </span>
                            {permission.roles.map((role) => (
                              <span
                                key={role.id}
                                className="text-xs bg-gray-100 border border-gray-300 text-black px-2 py-0.5 font-mono"
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
    </div>
  );
}
