import { useState, useEffect, useCallback } from "react";
import { roleService } from "@/apis/roleService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoleManagementModal } from "@/components/role/role-management-modal";
import { ROLE_ICONS, ROLE_COLORS } from "@/constants/roleConstants";

// Note: Material icons mapping differs from Lucide, keeping local mapping
const ROLE_ICON_NAMES = {
  1: "security",        // Super Admin -> Crown
  2: "admin_panel_settings", // Admin -> Shield
  3: "store",          // Business -> Briefcase
  4: "group",          // Staff -> Users
  5: "person",         // Guest -> User
};

export default function RoleManagePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalPermissions, setTotalPermissions] = useState(0);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles({
        includePermissions: false,
        includeUserCount: true,
        limit: 100,
      });

      if (response?.success && response.data) {
        const filteredRoles = response.data.filter(
          (role) => role.name !== "guest"
        );
        setRoles(filteredRoles);
        if (filteredRoles.length > 0) {
          const maxPermissions = Math.max(
            ...filteredRoles.map((r) => r.permissionCount || 0)
          );
          if (maxPermissions > 0) {
            setTotalPermissions(maxPermissions);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleManagePermissions = (role) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const handlePermissionsUpdated = () => {
    fetchRoles();
  };

  const filteredRoles = roles.filter((role) => {
    if (!search.trim()) return true;
    const lowerSearch = search.toLowerCase();
    return (
      role.name.toLowerCase().includes(lowerSearch) ||
      role.displayName.toLowerCase().includes(lowerSearch)
    );
  });

  const getRoleIcon = (roleName) => ROLE_ICON_NAMES[roleName] || "badge";
  const getRoleColor = (roleId) => {
    const colorMap = {
      1: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
      2: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
      3: "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
      4: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
      5: "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
    };
    return colorMap[roleId] || colorMap[5];
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-6 lg:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-blue-600/10 text-blue-600 p-2 rounded-lg">
              <span className="material-icons-round text-2xl">admin_panel_settings</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý vai trò
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-14">
            Quản lý quyền hạn và phân cấp vai trò trong hệ thống
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRoles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-sm font-medium disabled:opacity-50"
          >
            <span className={`material-icons-round text-lg ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
            Làm mới
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="relative w-full lg:max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <span className="material-icons-round text-xl">search</span>
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
            placeholder="Tìm kiếm vai trò..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-48 animate-pulse">
              <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
              <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="material-icons-round text-7xl text-slate-300 dark:text-slate-600">
            search_off
          </span>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
            Không tìm thấy vai trò phù hợp
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", getRoleColor(role.name))}>
                    <span className="material-icons-round text-2xl">
                      {getRoleIcon(role.name)}
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <span className="material-icons-round text-sm">group</span>
                    {role.userCount || 0}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                  {role.displayName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px]">
                  {role.description || "Chưa có mô tả"}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Quyền hạn
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {role.permissionCount || 0}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((role.permissionCount || 0) / (totalPermissions || 1)) * 100, 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => handleManagePermissions(role)}
                  className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round text-lg">settings</span>
                  Cấu hình quyền
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRole && (
        <RoleManagementModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          role={selectedRole}
          onUpdated={handlePermissionsUpdated}
        />
      )}
    </div>
  );
}
