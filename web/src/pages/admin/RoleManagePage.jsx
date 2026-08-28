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
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
      toast.error(t("roles.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

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
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Phân quyền Hệ thống (RBAC)
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("roles.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("roles.subtitle")}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={fetchRoles}
            variant="outline"
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-700 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </header>

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("roles.stats.count")}
            value={roleStats.count}
            icon={ShieldAlert}
          />
          <TimStatsCard
            title={t("roles.stats.totalUsers")}
            value={roleStats.totalUsers}
            icon={Users}
          />
          <TimStatsCard
            title={t("roles.stats.totalPermissions")}
            value={roleStats.totalPerms}
            icon={Lock}
          />
          <TimStatsCard
            title={t("roles.stats.avgUsersPerRole")}
            value={roleStats.avgUsers}
            icon={BarChart3}
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
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-48 animate-pulse"
                >
                  <div className="flex justify-between mb-8">
                    <div className="h-10 w-10 rounded-xl bg-slate-100" />
                    <div className="h-6 w-16 rounded-full bg-slate-100" />
                  </div>
                  <div className="h-5 w-1/2 rounded bg-slate-100 mb-2" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          );
        }

        if (filteredRoles.length === 0) {
          return (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-500 text-sm">
                {t("roles.empty")}
              </p>
            </div>
          );
        }

        return (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRoles.map((role) => {
              const Icon = getRoleIcon(role.name);
              return (
                <div
                  key={role.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        {role.userCount || 0}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-950 mb-1 tracking-tight">
                      {role.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 h-9 mb-4">
                      {role.description || "Chưa có mô tả"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {t("roles.permissions")}
                      </span>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full border border-slate-200">
                        {role.permissionCount || 0}
                      </span>
                    </div>

                    {role.id === ROLES.SUPER_ADMIN ? (
                      <Button
                        onClick={() => handleManagePermissions(role, true)}
                        className="w-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl h-9 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        {t("roles.viewPermissions")}
                      </Button>
                    ) : !hasPermission(PERMISSIONS.ROLES.MANAGE_PERMISSIONS) ||
                      !canEditRolePermissions(role.id) ? (
                      <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl h-9 text-xs font-semibold flex items-center justify-center cursor-not-allowed">
                        <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                        {t("roles.noPermissions")}
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleManagePermissions(role)}
                        className="w-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white rounded-xl h-9 text-xs font-semibold"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        {t("roles.configurePermissions")}
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
  );
}
