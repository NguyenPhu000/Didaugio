import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShieldCheck, UserPlus } from "lucide-react";

export function PermissionCheckbox({
  permission,
  checked,
  onCheckedChange,
  disabled = false,
  isInherited = false, // Quyền kế thừa từ Role
  showSource = false, // Hiển thị badge nguồn gốc
}) {
  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
        checked
          ? "bg-primary/5 border-primary/20"
          : "bg-background hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        isInherited && "border-l-4 border-l-blue-500"
      )}
    >
      <Checkbox
        id={`permission-${permission.id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled} // User có thể bỏ tích quyền từ role
        className="mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "text-sm font-medium cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          >
            {permission.displayName}
          </Label>
          {showSource && isInherited && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Từ vai trò
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quyền mặc định từ vai trò</p>
                  <p className="text-xs text-muted-foreground">
                    Bạn có thể bỏ chọn nếu không muốn user có quyền này
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {showSource && !isInherited && checked && (
            <Badge
              variant="outline"
              className="text-xs bg-green-50 text-green-700 border-green-200"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Đặc quyền
            </Badge>
          )}
        </div>
        {permission.description && (
          <p className="text-xs text-muted-foreground">
            {permission.description}
          </p>
        )}
      </div>
    </div>
  );
}
