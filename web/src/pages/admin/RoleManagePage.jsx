import { useState, useEffect, useCallback, useMemo } from "react";
import { roleService } from "@/apis/roleService";
import { toast } from "sonner";
import { RoleManagementModal } from "@/components/role/role-management-modal";
import { Button } from "@/components/ui/button";
import TimStatsCard from "@/components/admin/TimStatsCard";
import { usePermission } from "@/hooks/usePermission";
import { ROLES } from "@/constants/constants";
import { PERMISSIONS } from "@/constants/permissions";
import {
  RefreshCw,
  ShieldAlert,
  Briefcase,
  Users,
  User,
  Crown,
  Lock,
  BarChart3,
  ShieldOff,
  Eye,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Lucide mapping for roles
const ROLE_ICONS_LUCIDE = {
  admin: ShieldAlert,
  super_admin: Crown,
  business: Briefcase,
  staff: Users,
  user: User,
  guest: User,
};

export default function RoleManagePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { hasPermission, canEditRolePermissions } = usePermission();
  const { t } = useTranslation();

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
          (role) => !["guest", "user"].includes(role.name),
        );
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("roles.errors.loadFailed") || "Không thể tải danh sách vai trò");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleManagePermissions = (role, readOnly = false) => {
    setSelectedRole(role);
    setIsReadOnly(readOnly);
    setModalOpen(true);
  };

  const handlePermissionsUpdated = () => {
    fetchRoles();
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase().trim();
    return roles.filter(
      (r) =>
        r.displayName?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const roleStats = useMemo(() => {
    const r = roles;
    const totalUsers = r.reduce((s, x) => s + (x.userCount || 0), 0);
    const totalPerms = r.reduce((s, x) => s + (x.permissionCount || 0), 0);
    const avgUsers =
      r.length > 0 ? Math.round((totalUsers / r.length) * 10) / 10 : 0;
    return { count: r.length, totalUsers, totalPerms, avgUsers };
  }, [roles]);

  const getRoleIcon = (roleName) => {
    const key = (roleName || "").toLowerCase().replace(/\s+/g, "_");
    return ROLE_ICONS_LUCIDE[key] || ROLE_ICONS_LUCIDE["user"];
  };

  return (
    <div className="min-h-screen p-6 sm:p-8 bg-background relative text-foreground">
      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* T.I.M Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="accent-bar h-16 shrink-0 bg-[#F3E600] w-1.5" />
            <div>
              <h1 className="tim-title font-extrabold">
                {t("roles.title") || "QUẢN LÝ VAI TRÒ"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0 font-mono text-xs">
                  RBAC // ROLES
                </span>
                <p className="tim-meta text-xs text-gray-500 font-mono uppercase">
                  {t("roles.subtitle") || "Cấu hình vai trò và quyền hạn hệ thống"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={fetchRoles}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white flex items-center justify-center cursor-pointer shadow-none transition-colors"
              disabled={loading}
              title="Làm mới"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* T.I.M KPI Metrics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-black p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 mb-4" />
                <div className="h-8 w-16 bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard
              title={t("roles.stats.count") || "SỐ VAI TRÒ"}
              value={roleStats.count}
              icon={ShieldAlert}
              serial="ROL-001"
            />
            <TimStatsCard
              title={t("roles.stats.totalUsers") || "TỔNG USER GÁN"}
              value={roleStats.totalUsers}
              icon={Users}
              serial="ROL-002"
              textColor="text-emerald-600"
            />
            <TimStatsCard
              title={t("roles.stats.totalPermissions") || "TỔNG GÁN QUYỀN"}
              value={roleStats.totalPerms}
              icon={Lock}
              serial="ROL-003"
            />
            <TimStatsCard
              title={t("roles.stats.avgUsersPerRole") || "TB USER / VAI TRÒ"}
              value={roleStats.avgUsers}
              icon={BarChart3}
              serial="ROL-004"
              color="bg-yellow-50"
            />
          </div>
        )}

        {/* Search Bar */}
        {roles.length > 0 && (
          <div className="flex items-center justify-between gap-4 bg-white border border-black p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TÌM KIẾM VAI TRÒ (SEARCH)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono uppercase bg-gray-50 border border-gray-300 focus:outline-none focus:border-black"
              />
            </div>
            <div className="text-xs font-mono text-gray-500 uppercase">
              COUNT: <strong>{filteredRoles.length}</strong> / {roles.length}
            </div>
          </div>
        )}

        {/* Roles Grid */}
        {(() => {
          if (loading) {
            return (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 border border-black shadow-sm h-64 animate-pulse relative"
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
                <p className="mt-4 text-gray-500 font-mono uppercase text-xs">
                  {t("roles.empty") || "KHÔNG CÓ DỮ LIỆU VAI TRÒ PHÙ HỢP"}
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
                    {/* Endfield yellow geometric corner */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#F3E600]/10 -mr-8 -mt-8 rotate-45 transform transition-transform group-hover:scale-150 pointer-events-none" />

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
                        {role.description || "CHƯA CÓ MÔ TẢ"}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 group-hover:border-black/10 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-black font-mono">
                          {t("roles.permissions") || "QUYỀN HẠN"}
                        </span>
                        <span className="text-xs font-mono font-bold bg-[#F3E600] text-black px-2 py-0.5 border border-black">
                          {role.permissionCount || 0}
                        </span>
                      </div>

                      {role.id === ROLES.SUPER_ADMIN ? (
                        <Button
                          onClick={() => handleManagePermissions(role, true)}
                          className="w-full bg-white border border-black text-black hover:bg-black hover:text-white rounded-none h-9 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-none"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          {t("roles.viewPermissions") || "XEM QUYỀN"}
                        </Button>
                      ) : !hasPermission(PERMISSIONS.ROLES.MANAGE_PERMISSIONS) ||
                        !canEditRolePermissions(role.id) ? (
                        <div className="w-full bg-gray-50 border border-gray-300 text-gray-400 rounded-none h-9 text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-not-allowed">
                          <ShieldOff className="w-3.5 h-3.5 mr-2" />
                          {t("roles.noPermissions") || "KHÔNG CÓ QUYỀN"}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleManagePermissions(role)}
                          className="w-full bg-white border border-black text-black hover:bg-black hover:text-white rounded-none h-9 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-none"
                        >
                          <Lock className="w-3.5 h-3.5 mr-2" />
                          {t("roles.configurePermissions") || "CẤU HÌNH QUYỀN"}
                        </Button>
                      )}
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
            readOnly={isReadOnly}
          />
        )}
      </div>
    </div>
  );
}
