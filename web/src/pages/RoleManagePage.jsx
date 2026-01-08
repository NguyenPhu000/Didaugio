import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleCard } from "@/components/role/role-card";
import { RoleManagementModal } from "@/components/role/role-management-modal";
import { roleService } from "@/services/roleService";
import {
  Search,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Store,
  Users as UsersIcon,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_ICONS = {
  super_admin: ShieldCheck,
  admin: UserCog,
  business: Store,
  staff: UsersIcon,
  guest: User,
};

const ROLE_GRADIENTS = {
  super_admin: "from-purple-500 to-pink-500",
  admin: "from-blue-500 to-cyan-500",
  business: "from-green-500 to-emerald-500",
  staff: "from-yellow-500 to-orange-500",
  guest: "from-gray-500 to-slate-500",
};

export default function RoleManagePage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalPermissions, setTotalPermissions] = useState(72);

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
      const errorMsg = error.response?.data?.message || error.message || "Không thể tải danh sách vai trò";
      toast.error(errorMsg);
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

  const stats = {
    total: roles.length,
    superAdmin: roles
      .filter((r) => r.name === "super_admin")
      .reduce((sum, r) => sum + (r.userCount || 0), 0),
    admin: roles
      .filter((r) => r.name === "admin")
      .reduce((sum, r) => sum + (r.userCount || 0), 0),
    business: roles
      .filter((r) => r.name === "business")
      .reduce((sum, r) => sum + (r.userCount || 0), 0),
    staff: roles
      .filter((r) => r.name === "staff")
      .reduce((sum, r) => sum + (r.userCount || 0), 0),
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý vai trò & Phân quyền
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý quyền hạn cho từng vai trò trong hệ thống
          </p>
        </div>
        <Button onClick={fetchRoles} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            key: "superAdmin",
            label: "SA",
            name: "Super Admin",
            icon: ShieldCheck,
            gradient: ROLE_GRADIENTS.super_admin,
          },
          {
            key: "admin",
            label: "A",
            name: "Admin",
            icon: UserCog,
            gradient: ROLE_GRADIENTS.admin,
          },
          {
            key: "business",
            label: "B",
            name: "Business",
            icon: Store,
            gradient: ROLE_GRADIENTS.business,
          },
          {
            key: "staff",
            label: "S",
            name: "Staff",
            icon: UsersIcon,
            gradient: ROLE_GRADIENTS.staff,
          },
        ].map(({ key, label, name, icon: Icon, gradient }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-3 rounded-lg bg-gradient-to-br text-white shadow-md",
                    gradient
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{name}</p>
                  <p className="text-2xl font-bold">{stats[key]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Không tìm thấy vai trò nào
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              totalPermissions={totalPermissions}
              onManagePermissions={handleManagePermissions}
            />
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
