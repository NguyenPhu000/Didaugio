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
import { Shield, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PermissionCheckbox({
  permission,
  checked,
  onCheckedChange,
  disabled = false,
  isInherited = false,
  showSource = false,
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 border transition-all duration-200",
        checked
          ? "bg-white border-black border-l-4 border-l-[#F3E600]"
          : "bg-white border-gray-300 hover:border-black",
        disabled && "opacity-60 cursor-not-allowed",
        isInherited && "border-l-4 border-l-black",
      )}
    >
      <Checkbox
        id={`permission-${permission.id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-1 data-[state=checked]:bg-[#F3E600] data-[state=checked]:border-black data-[state=checked]:text-black rounded-none border-2"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "text-xs font-bold text-black cursor-pointer uppercase tracking-tight",
              disabled && "cursor-not-allowed",
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
                    className="text-xs bg-black text-white border-black flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-none uppercase font-mono"
                  >
                    <Shield className="h-3 w-3" />
                    {t("role.permissionCheckbox.roleBadge")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-black rounded-none">
                  <p className="uppercase font-mono text-xs">
                    {t("role.permissionCheckbox.inheritedFromRole")}
                  </p>
                  <p className="text-xs text-gray-300 font-mono">
                    {t("role.permissionCheckbox.deselectHint")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {showSource && !isInherited && checked && (
            <Badge
              variant="outline"
              className="text-xs bg-[#F3E600] text-black border-black flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-none uppercase font-mono"
            >
              <UserPlus className="h-3 w-3" />
              {t("role.permissionCheckbox.specialPermission")}
            </Badge>
          )}
        </div>
        {permission.description && (
          <p className="text-xs text-gray-500 font-mono">
            {permission.description}
          </p>
        )}
      </div>
    </div>
  );
}
