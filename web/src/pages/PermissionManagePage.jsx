import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { permissionService } from "@/services/permissionService";
import { MODULE_DISPLAY_NAMES, MODULE_GRADIENTS } from "@/config/permissions";
import {
  RefreshCw,
  Shield,
  ChevronRight,
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  Briefcase,
  Flag,
  Settings,
  FolderTree,
  CreditCard,
} from "lucide-react";
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

      console.log("Permission response:", response);

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
    reviews: MessageSquare,
    business: Briefcase,
    reports: Flag,
    system: Settings,
    categories: FolderTree,
    payments: CreditCard,
  };

  const getModuleIcon = (module) => {
    return MODULE_ICON_MAP[module] || Shield;
  };

  const getModuleGradient = (module) => {
    return MODULE_GRADIENTS?.[module] || "from-gray-500 to-slate-500";
  };

  const modules = Object.keys(permissions);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý quyền hạn
          </h1>
          <p className="text-muted-foreground mt-1">
            Xem danh sách quyền được nhóm theo module
          </p>
        </div>
        <Button onClick={fetchPermissions} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Tổng số quyền</p>
                <p className="text-2xl font-bold">{stats.totalPermissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Số modules</p>
                <p className="text-2xl font-bold">{stats.totalModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">TB quyền/module</p>
                <p className="text-2xl font-bold">
                  {stats.totalModules > 0
                    ? Math.round(
                        (stats.totalPermissions / stats.totalModules) * 10
                      ) / 10
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = getModuleIcon(module);
            const gradient = getModuleGradient(module);
            const perms = permissions[module] || [];
            const stats = moduleStats[module] || {};

            return (
              <Card
                key={module}
                className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleOpenModule(module)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "p-3 rounded-lg bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-110",
                        gradient
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <CardTitle className="mt-4">
                    {MODULE_DISPLAY_NAMES?.[module] || module}
                  </CardTitle>
                  <CardDescription>
                    {perms.length} quyền · {stats.rolesUsing || 0} vai trò
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quyền xem</span>
                      <Badge variant="secondary">
                        {perms.filter((p) => p.action === "view").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quyền sửa</span>
                      <Badge variant="secondary">
                        {
                          perms.filter((p) =>
                            ["create", "update", "delete", "manage"].includes(
                              p.action
                            )
                          ).length
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedModule &&
                (MODULE_DISPLAY_NAMES?.[selectedModule] || selectedModule)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {selectedModule &&
                permissions[selectedModule]?.map((permission) => (
                  <Card key={permission.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{permission.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                          <Badge>{permission.action}</Badge>
                        </div>
                        {permission.roles && permission.roles.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="text-xs text-muted-foreground">
                              Vai trò:
                            </span>
                            {permission.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {role.displayName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
