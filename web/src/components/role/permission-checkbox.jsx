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
        "flex items-start space-x-3 p-3.5 rounded-xl border transition-all duration-150",
        checked
          ? "bg-slate-50/60 border-slate-300 ring-1 ring-slate-200"
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40",
        disabled && "opacity-60 cursor-not-allowed",
        isInherited && "bg-slate-50/80 border-slate-300",
      )}
    >
      <Checkbox
        id={`permission-${permission.id}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5 rounded-md border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              "text-xs font-semibold text-slate-900 cursor-pointer",
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
                    className="text-[11px] bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                  >
                    <Shield className="h-3 w-3 text-slate-500" />
                    {t("role.permissionCheckbox.roleBadge")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white rounded-xl text-xs">
                  <p className="font-medium">
                    {t("role.permissionCheckbox.inheritedFromRole")}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {t("role.permissionCheckbox.deselectHint")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {showSource && !isInherited && checked && (
            <Badge
              variant="outline"
              className="text-[11px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
            >
              <UserPlus className="h-3 w-3" />
              {t("role.permissionCheckbox.specialPermission")}
            </Badge>
          )}
        </div>
        {permission.description && (
          <p className="text-xs text-slate-500 leading-relaxed">
            {permission.description}
          </p>
        )}
      </div>
    </div>
  );
}
