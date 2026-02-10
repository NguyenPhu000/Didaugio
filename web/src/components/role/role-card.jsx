import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  UserCog,
  Store,
  Users as UsersIcon,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_ICONS, ROLE_GRADIENTS } from "@/constants/roleConstants";

// Map Lucide icons to role names
const LUCIDE_ICON_MAP = {
  1: ShieldCheck,  // Super Admin
  2: UserCog,      // Admin
  3: Store,        // Business
  4: UsersIcon,    // Staff
  5: User,         // Guest
};

export function RoleCard({ role, onManagePermissions, totalPermissions = 72 }) {
  const Icon = LUCIDE_ICON_MAP[role.id] || User;
  const gradient = ROLE_GRADIENTS[role.id] || ROLE_GRADIENTS[5];
  const permissionPercentage =
    totalPermissions > 0 ? (role.permissionCount / totalPermissions) * 100 : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-lg bg-gradient-to-br text-white shadow-md",
                gradient
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{role.displayName}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {role.description || "Không có mô tả"}
              </CardDescription>
            </div>
          </div>
          {role.isSystem && (
            <Badge variant="outline" className="text-xs">
              Hệ thống
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quyền hạn</span>
            <span className="font-medium">
              {role.permissionCount || 0}/{totalPermissions}
            </span>
          </div>
          <Progress value={permissionPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Người dùng</span>
            <span className="text-lg font-semibold">{role.userCount || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Tỷ lệ quyền</span>
            <span className="text-lg font-semibold">
              {permissionPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        <Button
          onClick={() => onManagePermissions(role)}
          className="w-full"
          variant={role.name === "guest" ? "outline" : "default"}
          disabled={role.name === "guest"}
        >
          <Settings className="h-4 w-4 mr-2" />
          Quản lý quyền
        </Button>

        {role.isSystem && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            Vai trò hệ thống - Không thể xóa
          </p>
        )}
      </CardContent>
    </Card>
  );
}
