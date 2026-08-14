import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { userService } from "@/apis/userService";
import { auditLogService } from "@/apis/auditLogService";
import { ROLES } from "@/constants/constants";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  Lock,
  RefreshCw,
  UserCheck,
  UserX,
  Activity,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  UserCog,
  Clock,
} from "lucide-react";
import {
  exportToCsv,
  fetchAllPages,
  formatCsvDate,
  slugifyFilename,
} from "@/utils/csvExport";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Checkbox,
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getTableSerialNumber } from "@/utils/tableSerial";
import { useTranslation } from "react-i18next";
import { toast as sonnerToast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

/**
 * UserRow — memoized table row for a single user.
 */
const UserRow = memo(({
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
                {(user.username || user.email || "?").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full",
                isOnline ? "bg-[#F3E600] shadow-[0_0_4px_#F3E600]" : "bg-slate-300"
              )}
              title={isOnline ? "Trực tuyến" : "Ngoại tuyến"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-slate-950 leading-none mb-1 truncate">
              {fullName || user.username || user.email?.split("@")[0] || "Chưa đặt tên"}
            </div>
            <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
            </div>
            <div className="md:hidden mt-2 space-y-1">
              {user.email && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 truncate">
                  <Mail className="w-3 h-3 shrink-0 text-slate-400" /> {user.email}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                  <Phone className="w-3 h-3 shrink-0 text-slate-400" /> {phone}
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
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs", role.class)}>
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
          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-[#F3E600]" : "bg-slate-400")} />
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
            <DropdownMenuContent align="end" className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs">
              <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {t("users.table.actions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/[0.04]" />
              <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl cursor-pointer py-2 font-medium">
                <Edit className="mr-2 h-3.5 w-3.5 text-slate-600" /> {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePassword(user)} className="rounded-xl cursor-pointer py-2 font-medium">
                <Lock className="mr-2 h-3.5 w-3.5 text-slate-600" /> {t("users.actions.changePassword")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(user)} className="rounded-xl cursor-pointer py-2 font-medium">
                {isActive ? (
                  <>
                    <UserX className="mr-2 h-3.5 w-3.5 text-amber-600" /> {t("users.actions.lockAccount")}
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-3.5 w-3.5 text-slate-900" /> {t("users.actions.unlockAccount")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/[0.04]" />
              <DropdownMenuItem onClick={() => onDelete(user)} className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold">
                <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" /> {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
});
UserRow.displayName = "UserRow";

/**
 * UserManagePage — Admin user management with bulk operations and activity log.
 */
const UserManagePage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    roleId: "all",
    status: "all",
    limit: 10,
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Selection for bulk ops
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Bulk role assignment
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false);
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // User detail sidebar - activity log
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        roleId: filters.roleId !== "all" ? filters.roleId : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
      };

      const response = await userService.getAll(params);
      const userData = response.data.users || response.data || [];
      const managedUsers = userData.filter(
        (item) => Number(item?.roleId) !== ROLES.GUEST,
      );
      const paginationData = response.data.pagination || {
        total: response.data.total || userData.length,
        totalPages: response.data.totalPages || 1,
      };

      setUsers(managedUsers);
      setPagination(paginationData);
    } catch {
      toast({
        title: t("common.error"),
        description: t("users.errors.loadFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setFormMode("create");
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormMode("edit");
    setShowFormModal(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setFormMode("change-password");
    setShowFormModal(true);
  };

  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.status === "active" || user.isActive;
    const newStatus = isCurrentlyActive ? "inactive" : "active";
    try {
      setLoading(true);
      await userService.update(user.id, { status: newStatus });
      toast({
        title: t("common.success"),
        description: newStatus === "active"
          ? t("users.messages.unlockSuccess", "Kích hoạt tài khoản thành công")
          : t("users.messages.lockSuccess", "Khóa tài khoản thành công"),
        className: "bg-black text-white border border-primary font-mono",
      });
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("common.error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);

    // Fetch activity log for this user
    try {
      setActivityLoading(true);
      const res = await auditLogService.getAll({
        userId: user.id,
        limit: 10,
        page: 1,
      });
      setActivityLog(res.data || []);
    } catch {
      setActivityLog([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await userService.delete(userToDelete.id);
      toast({
        title: t("common.success"),
        description: t("users.messages.deleteSuccess"),
        className: "bg-black text-white border border-primary font-mono",
      });
      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  const handleSaveUser = async (data, isEdit) => {
    try {
      if (isEdit) {
        await userService.update(selectedUser.id, data);
        toast({
          title: t("common.success"),
          description: formMode === "change-password"
            ? t("users.messages.changePasswordSuccess", "Đổi mật khẩu thành công")
            : t("users.messages.updateSuccess"),
          className: "bg-black text-white border border-primary font-mono",
        });
      } else {
        await userService.create(data);
        toast({
          title: t("common.success"),
          description: t("users.messages.createSuccess"),
          className: "bg-black text-white border border-primary font-mono",
        });
      }
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error.data?.message ||
          error.message ||
          t("users.errors.saveFailed"),
      });
      throw error;
    }
  };

  // ─── Selection handlers ────────────────────────────────────────────────────
  const handleSelectOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  }, [selectedIds.size, users]);

  // ─── Bulk role assignment ──────────────────────────────────────────────────
  const handleBulkRoleAssign = async () => {
    if (!bulkRoleId || selectedIds.size === 0) return;
    try {
      setBulkSubmitting(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          userService.updateRole(id, parseInt(bulkRoleId, 10)),
        ),
      );
      toast({
        title: t("common.success"),
        description: `Đã cập nhật vai trò cho ${selectedIds.size} người dùng`,
        className: "bg-black text-white border border-primary font-mono",
      });
      setBulkRoleDialogOpen(false);
      setBulkRoleId("");
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || "Lỗi cập nhật vai trò",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ─── CSV export ────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    try {
      sonnerToast.loading(t("users.export.loading"), { id: "csv-export" });
      const allData = await fetchAllPages(async (params) => {
        const res = await userService.getAll(params);
        const users = res.data.users || res.data || [];
        return {
          success: true,
          data: users.filter((u) => Number(u?.roleId) !== ROLES.GUEST),
          pagination: res.data.pagination || { totalPages: 1 },
        };
      }, {
        search: filters.search || undefined,
        roleId: filters.roleId !== "all" ? filters.roleId : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
      });

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          { key: (row) => row.profile?.fullName || row.fullName || row.username || "", label: t("users.csv.fullName") },
          { key: "email", label: "Email" },
          { key: (row) => row.profile?.phone || "", label: t("users.csv.phone") },
          {
            key: (row) => {
              const roleKeys = {
                1: "roles.names.superAdmin",
                2: "roles.names.admin",
                3: "roles.names.business",
                4: "roles.names.staff",
                5: "roles.names.user",
                6: "roles.names.guest",
              };
              return roleKeys[row.roleId] ? t(roleKeys[row.roleId]) : `Role ${row.roleId}`;
            },
            label: t("users.csv.role"),
          },
          { key: (row) => (row.status === "active" || row.isActive) ? t("users.status.active") : t("users.status.locked"), label: t("users.csv.status") },
          { key: (row) => formatCsvDate(row.createdAt), label: t("users.csv.createdAt") },
        ],
        data: allData,
        filename: slugifyFilename("danh_sach_nguoi_dung"),
      });

      sonnerToast.success(t("users.export.success", { count: allData.length }), { id: "csv-export" });
    } catch {
      sonnerToast.error(t("users.export.error"), { id: "csv-export" });
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  const userStats = useMemo(() => {
    const isActive = (u) => u.status === "active" || u.status === 1 || u.status === true;
    return {
      total: pagination.total,
      active: users.filter(isActive).length,
      locked: users.filter((u) => !isActive(u)).length,
      onPage: users.length,
    };
  }, [users, pagination.total]);

  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < users.length;
  let SelectAllIcon = Square;
  if (allSelected) {
    SelectAllIcon = CheckSquare;
  } else if (someSelected) {
    SelectAllIcon = MinusSquare;
  }

  const roleOptions = [
    { value: String(ROLES.SUPER_ADMIN), label: t("roles.names.superAdmin").toUpperCase() },
    { value: String(ROLES.ADMIN), label: t("roles.names.admin").toUpperCase() },
    { value: String(ROLES.BUSINESS), label: t("roles.names.business").toUpperCase() },
    { value: String(ROLES.STAFF), label: t("roles.names.staff").toUpperCase() },
    { value: String(ROLES.USER), label: t("roles.names.user").toUpperCase() },
  ];
  const canAssignRole = useCallback(
    (roleId) => {
      const targetRoleId = Number(roleId);
      if (currentUser?.roleId === ROLES.SUPER_ADMIN) {
        return targetRoleId !== ROLES.SUPER_ADMIN;
      }
      if (currentUser?.roleId === ROLES.ADMIN) {
        return [ROLES.BUSINESS, ROLES.STAFF, ROLES.USER].includes(targetRoleId);
      }
      if (currentUser?.roleId === ROLES.BUSINESS) {
        return targetRoleId === ROLES.STAFF;
      }
      return false;
    },
    [currentUser?.roleId],
  );
  const assignableRoleOptions = roleOptions.filter(
    (option) =>
      ![String(ROLES.GUEST)].includes(option.value) &&
      canAssignRole(option.value),
  );

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quản trị Tài khoản & Phân quyền
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("users.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("users.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-slate-700" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Đồng bộ lại"
          >
            <RefreshCw className={`h-4 w-4 text-slate-800 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#F3E600]" />
            <span>{t("users.addUser")}</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Strip */}
      {!loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard title={t("users.stats.total")} value={userStats.total} icon={Users} />
          <TimStatsCard title={t("users.stats.active")} value={userStats.active} icon={UserCheck} />
          <TimStatsCard title={t("users.stats.locked")} value={userStats.locked} icon={UserX} />
          <TimStatsCard title={t("users.stats.perPage")} value={userStats.onPage} icon={Activity} />
        </section>
      )}

      {/* Soft Search & Filters Bar */}
      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t("users.searchPlaceholder")}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <Select value={filters.roleId.toString()} onValueChange={(val) => handleFilterChange("roleId", val)}>
            <SelectTrigger className="h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-[150px]">
              <SelectValue placeholder={t("users.table.role")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(val) => handleFilterChange("status", val)}>
            <SelectTrigger className="h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-[140px]">
              <SelectValue placeholder={t("users.table.account", "Tài khoản")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("users.status.active")}</SelectItem>
              <SelectItem value="inactive">{t("users.status.locked")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Bulk Action Pill Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-950 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] animate-pulse" />
            <span>Đã chọn <strong className="text-[#F3E600] font-mono tabular-nums">{selectedIds.size}</strong> người dùng</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-950 font-semibold text-xs transition-all flex items-center gap-1.5"
              onClick={() => setBulkRoleDialogOpen(true)}
            >
              <UserCog className="h-3.5 w-3.5 text-[#F3E600]" />
              Gán vai trò
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 text-xs font-medium transition-all"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* User Table (Soft Neumorphic Rounded Panel) */}
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500">{t("common.loading")}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                  <th className="p-4 w-[40px]">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center justify-center text-slate-700"
                      aria-label="Chọn tất cả"
                    >
                      <SelectAllIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="p-4 w-[60px] hidden sm:table-cell">STT</th>
                  <th className="p-4">{t("users.table.basicInfo")}</th>
                  <th className="p-4 hidden md:table-cell">{t("users.table.contact")}</th>
                  <th className="p-4 whitespace-nowrap">{t("users.table.role")}</th>
                  <th className="p-4 whitespace-nowrap">{t("users.table.connection", "Kết nối")}</th>
                  <th className="p-4 whitespace-nowrap">{t("users.table.account", "Tài khoản")}</th>
                  <th className="p-4 text-right">{t("users.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {users.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    serial={getTableSerialNumber(
                      pagination.total || users.length,
                      index,
                      filters.page,
                      filters.limit,
                    )}
                    selected={selectedIds.has(user.id)}
                    onSelect={handleSelectOne}
                    onDetail={handleDetail}
                    onEdit={handleEdit}
                    onChangePassword={handleChangePassword}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    t={t}
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-20 text-center">
                      <UserX className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                      <div className="font-bold text-slate-800">
                        {t("common.noData")}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Không tìm thấy tài khoản nào khớp với bộ lọc.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs">
            <div className="text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-900 font-mono tabular-nums">{users.length}</span> / <span className="font-mono tabular-nums">{pagination.total}</span> người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange("page", filters.page - 1)}
                className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900"
              >
                ← Trước
              </button>
              <span className="font-bold text-slate-950 px-2 font-mono tabular-nums">
                {filters.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange("page", filters.page + 1)}
                className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-500" /> {t("users.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {t("users.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-slate-700 leading-relaxed">
              {t("users.deleteDialog.message", { username: userToDelete?.username || userToDelete?.email })}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
            >
              {t("common.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-[#F3E600]" />
              Gán vai trò hàng loạt
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Cập nhật vai trò cho {selectedIds.size} người dùng đã chọn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
              <SelectTrigger className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs font-semibold h-10">
                <SelectValue placeholder="Chọn vai trò mới" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                {assignableRoleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
            <Button
              variant="outline"
              onClick={() => setBulkRoleDialogOpen(false)}
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              Hủy
            </Button>
            <Button
              onClick={handleBulkRoleAssign}
              disabled={!bulkRoleId || bulkSubmitting}
              className="rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs h-9 px-5 shadow-sm"
            >
              {bulkSubmitting ? "Đang cập nhật..." : "Áp dụng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <UserFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        user={selectedUser}
        onSuccess={handleSaveUser}
        mode={formMode}
        currentUser={currentUser}
      />

      <UserDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        user={selectedUser}
        activityLog={activityLog}
        activityLoading={activityLoading}
      />
    </div>
  );
};

export default UserManagePage;

