import { useState, useEffect, useCallback, useMemo } from "react";
import { roleService } from "@/apis/roleService";
import { toast } from "sonner";
import { RoleManagementModal } from "@/components/role/role-management-modal";
import { Button } from "@/components/ui/Button";
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  RefreshCw,
  ShieldAlert,
  Briefcase,
  Users,
  User,
  Crown,
  Lock,
  BarChart3,
} from "lucide-react";

// Lucide mapping
const ROLE_ICONS_LUCIDE = {
  admin: ShieldAlert, // Admin
  super_admin: Crown, // Super Admin
  business: Briefcase, // Business
  staff: Users, // Staff
  user: User, // User
  guest: User, // Guest
};

export default function RoleManagePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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
          (role) => role.name !== "guest",
        );
        setRoles(filteredRoles);
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

  const filteredRoles = roles;

  const roleStats = useMemo(() => {
    const r = filteredRoles;
    const totalUsers = r.reduce((s, x) => s + (x.userCount || 0), 0);
    const totalPerms = r.reduce((s, x) => s + (x.permissionCount || 0), 0);
    const avgUsers =
      r.length > 0 ? Math.round((totalUsers / r.length) * 10) / 10 : 0;
    return { count: r.length, totalUsers, totalPerms, avgUsers };
  }, [filteredRoles]);

  const getRoleIcon = (roleName) => {
    // Normalize role name
    const key = roleName.toLowerCase().replace(/\s+/g, "_");
    return ROLE_ICONS_LUCIDE[key] || ROLE_ICONS_LUCIDE["user"];
  };

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">QUẢN LÝ VAI TRÒ</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  RBAC // ROLES
                </span>
                <p className="tim-meta">CẤU HÌNH VAI TRÒ VÀ QUYỀN HẠN</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchRoles}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard
              title="SỐ VAI TRÒ"
              value={roleStats.count}
              icon={ShieldAlert}
              serial="ROL-001"
            />
            <TimStatsCard
              title="TỔNG USER GÁN"
              value={roleStats.totalUsers}
              icon={Users}
              serial="ROL-002"
              textColor="text-emerald-600"
            />
            <TimStatsCard
              title="TỔNG GÁN QUYỀN"
              value={roleStats.totalPerms}
              icon={Lock}
              serial="ROL-003"
            />
            <TimStatsCard
              title="TB USER / VAI TRÒ"
              value={roleStats.avgUsers}
              icon={BarChart3}
              serial="ROL-004"
              color="bg-yellow-50"
            />
          </div>
        )}

        {/* Roles Grid */}
        {(() => {
          if (loading) {
            return (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 border border-black shadow-sm h-48 animate-pulse relative"
                  >
                    <div className="flex justify-between mb-8">
                      <div className="h-12 w-12 bg-gray-200" />
                      <div className="h-6 w-16 bg-gray-200" />
                    </div>
                    <div className="h-6 w-1/2 bg-gray-200 mb-2" />
                    <div className="h-4 w-3/4 bg-gray-200" />
                  </div>
                ))}
              </div>
            );
          }

          if (filteredRoles.length === 0) {
            return (
              <div className="text-center py-16 bg-white border border-black border-dashed">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500 font-mono uppercase">
                  CHƯA CÓ VAI TRÒ
                </p>
              </div>
            );
          }

          return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRoles.map((role) => {
                const Icon = getRoleIcon(role.name);
                return (
                  <div
                    key={role.id}
                    className="group bg-white border border-black p-6 flex flex-col justify-between hover:shadow-hard transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#F3E600]/10 -mr-8 -mt-8 rotate-45 transform transition-transform group-hover:scale-150"></div>

                    <div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="h-12 w-12 bg-black text-white flex items-center justify-center border border-black group-hover:bg-[#F3E600] group-hover:text-black transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="px-2 py-1 bg-gray-100 border border-gray-200 text-xs font-mono text-gray-600 flex items-center gap-1 group-hover:border-black group-hover:bg-white transition-colors">
                          <Users className="h-3 w-3" />
                          {role.userCount || 0}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-black mb-1 font-display uppercase tracking-tight">
                        {role.displayName}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 h-10 mb-4 font-mono">
                        {role.description || "NO DESCRIPTION AVAILABLE"}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 group-hover:border-black/10 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-black">
                          Permissions
                        </span>
                        <span className="text-xs font-mono font-bold bg-[#F3E600] text-black px-1.5 py-0.5">
                          {role.permissionCount || 0}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleManagePermissions(role)}
                        className="w-full bg-white border border-black text-black hover:bg-black hover:text-white rounded-none h-9 text-xs font-bold uppercase tracking-wider"
                      >
                        <Lock className="w-3 h-3 mr-2" />
                        Cấu hình quyền
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {selectedRole && (
          <RoleManagementModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            role={selectedRole}
            onUpdated={handlePermissionsUpdated}
          />
        )}
      </div>
    </div>
  );
}
