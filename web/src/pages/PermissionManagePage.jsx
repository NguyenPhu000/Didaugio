import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { permissionService } from "@/apis/permissionService";
import { MODULE_DISPLAY_NAMES, MODULE_GRADIENTS } from "@/constants/permissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    users: "group",
    roles: "verified_user",
    places: "place",
    bookings: "calendar_today",
    reviews: "rate_review",
    business: "business_center",
    reports: "flag",
    system: "settings",
    categories: "category",
    payments: "payments",
  };

  const getModuleIcon = (module) => {
    return MODULE_ICON_MAP[module] || "shield";
  };

  // Helper to safely get nested values without errors
  const modules = Object.keys(permissions || {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Quản lý quyền hạn
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Xem danh sách quyền được nhóm theo module và các vai trò liên quan.
          </p>
        </div>
        <button
          onClick={fetchPermissions}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Làm mới"
        >
          <span className="material-icons-round">refresh</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Permissions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-icons-round text-2xl">verified_user</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng số quyền</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalPermissions}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
             <span className="material-icons-round text-base mr-1">info</span>
             Tổng số quyền hạn trong hệ thống
          </div>
        </div>

        {/* Total Modules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <span className="material-icons-round text-2xl">view_module</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Số modules</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalModules}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
             <span className="material-icons-round text-base mr-1">dvr</span>
             Các phân hệ chức năng
          </div>
        </div>

        {/* Avg Permissions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-icons-round text-2xl">analytics</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">TB quyền/module</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalModules > 0
                  ? Math.round((stats.totalPermissions / stats.totalModules) * 10) / 10
                  : 0}
              </h3>
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
             <span className="material-icons-round text-base mr-1">functions</span>
             Trung bình quyền trên mỗi module
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-48 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                 <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                 <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="space-y-2">
                 <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                 <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const iconName = getModuleIcon(module);
            const perms = permissions[module] || [];
            const modStats = moduleStats[module] || {};
            
            // Map module names for display
            const displayName = MODULE_DISPLAY_NAMES?.[module] || module.charAt(0).toUpperCase() + module.slice(1);

            return (
              <div
                key={module}
                onClick={() => handleOpenModule(module)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                    <span className="material-icons-round text-8xl text-slate-900 dark:text-slate-100 rotate-12">{iconName}</span>
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div
                    className={cn(
                      "p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110",
                       "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <span className="material-icons-round text-2xl">{iconName}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {perms.length} quyền
                  </div>
                </div>
                
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100 relative z-10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {displayName}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 relative z-10">
                   Được sử dụng bởi {modStats.rolesUsing || 0} vai trò
                </p>

                <div className="mt-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                         <span className="material-icons-round text-base mr-2 text-blue-500">visibility</span>
                         <span>Xem</span>
                      </div>
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                         {perms.filter((p) => p.action === "view").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                         <span className="material-icons-round text-base mr-2 text-amber-500">edit</span>
                         <span>Thao tác (Sửa/Xóa)</span>
                      </div>
                       <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                         {perms.filter((p) => ["create", "update", "delete", "manage"].includes(p.action)).length}
                      </span>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-xl">
               <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="material-icons-round text-slate-600 dark:text-slate-400">
                      {selectedModule && getModuleIcon(selectedModule)}
                  </span>
               </span>
              {selectedModule && (MODULE_DISPLAY_NAMES?.[selectedModule] || selectedModule)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-6">
            <div className="grid gap-4">
              {selectedModule &&
                permissions[selectedModule]?.map((permission) => (
                  <div key={permission.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <div className="space-y-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{permission.name}</p>
                         <span className={cn(
                             "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                             permission.action === 'view' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                             permission.action === 'delete' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                             "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                         )}>
                            {permission.action}
                         </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {permission.description}
                      </p>
                       {permission.roles && permission.roles.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 mt-2">
                            <span className="text-xs text-slate-400 mr-1">
                               Dành cho:
                            </span>
                             {permission.roles.map((role) => (
                                <span key={role.id} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
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
