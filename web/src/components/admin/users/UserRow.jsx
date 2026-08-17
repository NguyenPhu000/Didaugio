import { memo } from "react";
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  Lock,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Checkbox,
} from "@/components/ui";
import { ROLES } from "@/constants/constants";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/utils";

export const UserRow = memo(
  ({
    user,
    selected,
    onSelect,
    onDetail,
    onEdit,
    onChangePassword,
    onToggleStatus,
    onDelete,
    serial,
    t,
  }) => {
    const isActive = user.status === "active" || user.isActive;
    const isOnline = user.isOnline || false;

    const fullName = user.profile?.fullName || user.fullName;
    const phone = user.profile?.phone || user.phone;
    const avatar = user.profile?.avatar || user.avatar;

    const roleConfig = {
      [ROLES.SUPER_ADMIN]: {
        key: "roles.names.superAdmin",
        class: "bg-slate-950 text-white border-slate-950",
      },
      [ROLES.ADMIN]: {
        key: "roles.names.admin",
        class: "bg-slate-900 text-white border-slate-900",
      },
      [ROLES.BUSINESS]: {
        key: "roles.names.business",
        class: "bg-[#FFFDE6] text-slate-950 border-[#F3E600]/80",
      },
      [ROLES.STAFF]: {
        key: "roles.names.staff",
        class: "bg-[#F4F2EC] text-slate-800 border-black/[0.06]",
      },
      [ROLES.USER]: {
        key: "roles.names.user",
        class: "bg-slate-100 text-slate-700 border-slate-200",
      },
    };
    const role = roleConfig[user.roleId] || {
      key: null,
      class: "bg-slate-100 text-slate-500 border-slate-200",
    };
    const roleLabel = role.key ? t(role.key) : `Vai trò #${user.roleId}`;

    return (
      <tr className="hover:bg-[#FAF9F5] group transition-colors">
        <td className="p-4 w-[40px]">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(user.id)}
            aria-label={`Chọn ${user.username}`}
            className="rounded-md"
          />
        </td>
        <td className="p-4 font-mono text-xs text-slate-400 tabular-nums hidden sm:table-cell">
          #{serial}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 rounded-xl border border-black/[0.06] bg-slate-950 text-[#F3E600] font-bold">
                <AvatarImage
                  src={resolveMediaUrl(avatar) || undefined}
                  className="rounded-xl object-cover"
                />
                <AvatarFallback className="rounded-xl bg-slate-950 text-[#F3E600] font-bold text-xs">
                  {(user.username || user.email || "?")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full",
                  isOnline
                    ? "bg-[#F3E600] shadow-[0_0_4px_#F3E600]"
                    : "bg-slate-300"
                )}
                title={isOnline ? "Trực tuyến" : "Ngoại tuyến"}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-slate-950 leading-none mb-1 truncate">
                {fullName ||
                  user.username ||
                  user.email?.split("@")[0] ||
                  "Chưa đặt tên"}
              </div>
              <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "—"}
              </div>
              <div className="md:hidden mt-2 space-y-1">
                {user.email && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 truncate">
                    <Mail className="w-3 h-3 shrink-0 text-slate-400" />{" "}
                    {user.email}
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <Phone className="w-3 h-3 shrink-0 text-slate-400" />{" "}
                    {phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 hidden md:table-cell">
          <div className="space-y-1">
            {user.email && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </td>
        <td className="p-4 whitespace-nowrap">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs",
              role.class
            )}
          >
            {roleLabel}
          </span>
        </td>
        <td className="p-4 whitespace-nowrap">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 bg-[#FFFDE6] px-2.5 py-0.5 rounded-full border border-[#F3E600]/80">
              <span className="w-1.5 h-1.5 bg-[#F3E600] rounded-full animate-pulse shadow-[0_0_4px_#F3E600]" />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              Offline
            </span>
          )}
        </td>
        <td className="p-4 whitespace-nowrap">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
              isActive
                ? "bg-white text-slate-950 border-black/[0.08]"
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive ? "bg-[#F3E600]" : "bg-slate-400"
              )}
            />
            {isActive ? t("users.status.active") : t("users.status.locked")}
          </span>
        </td>
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onDetail(user)}
              className="h-8 px-3 rounded-xl bg-white hover:bg-[#F5F4F0] text-slate-900 border border-black/[0.06] text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              Chi tiết
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 rounded-xl border border-black/[0.06] bg-white hover:bg-[#F5F4F0] text-slate-700 flex items-center justify-center transition-all"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs"
              >
                <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  {t("users.table.actions")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/[0.04]" />
                <DropdownMenuItem
                  onClick={() => onEdit(user)}
                  className="rounded-xl cursor-pointer py-2 font-medium"
                >
                  <Edit className="mr-2 h-3.5 w-3.5 text-slate-600" />{" "}
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onChangePassword(user)}
                  className="rounded-xl cursor-pointer py-2 font-medium"
                >
                  <Lock className="mr-2 h-3.5 w-3.5 text-slate-600" />{" "}
                  {t("users.actions.changePassword")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleStatus(user)}
                  className="rounded-xl cursor-pointer py-2 font-medium"
                >
                  {isActive ? (
                    <>
                      <UserX className="mr-2 h-3.5 w-3.5 text-amber-600" />{" "}
                      {t("users.actions.lockAccount")}
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-3.5 w-3.5 text-slate-900" />{" "}
                      {t("users.actions.unlockAccount")}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-black/[0.04]" />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" />{" "}
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
    );
  }
);

UserRow.displayName = "UserRow";
export default UserRow;
