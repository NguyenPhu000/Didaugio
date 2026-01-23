import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
        "flex items-start space-x-3 p-3 rounded-xl border transition-all duration-200",
        checked
          ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        disabled && "opacity-60 cursor-not-allowed",
        isInherited && "border-l-4 border-l-blue-500 rounded-l-md"
      )}
    >
      <Checkbox
        id={`permission-${permission.id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled} // User có thể bỏ tích quyền từ role
        className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          >
            {permission.displayName}
          </Label>
          {showSource && isInherited && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md"
                  >
                    <span className="material-icons-round text-[14px]">shield</span>
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
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-md"
            >
              <span className="material-icons-round text-[14px]">person_add</span>
              Đặc quyền
            </Badge>
          )}
        </div>
        {permission.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {permission.description}
          </p>
        )}
      </div>
    </div>
  );
}
