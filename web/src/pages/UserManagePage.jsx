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
      class: "bg-red-600 text-white border-red-800",
    },
    [ROLES.ADMIN]: {
      key: "roles.names.admin",
      class: "bg-black text-white border-black",
    },
    [ROLES.BUSINESS]: {
      key: "roles.names.business",
      class: "bg-blue-600 text-white border-blue-800",
    },
    [ROLES.STAFF]: {
      key: "roles.names.staff",
      class: "bg-indigo-600 text-white border-indigo-800",
    },
    [ROLES.USER]: {
      key: "roles.names.user",
      class: "bg-gray-200 text-black border-gray-400",
    },
  };
  const role = roleConfig[user.roleId] || {
    key: null,
    class: "bg-gray-100 text-gray-500",
  };
  const roleLabel = role.key ? t(role.key).toUpperCase() : `ROLE-${user.roleId}`;

  return (
    <tr className="hover:bg-yellow-50 group transition-colors">
      <td className="p-4 border-r border-black/5 w-[40px]">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(user.id)}
          aria-label={`Chọn ${user.username}`}
        />
      </td>
      <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5 hidden sm:table-cell">
        {serial}
      </td>
      <td className="p-4 border-r border-black/5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border border-black rounded-none">
              <AvatarImage
                src={resolveMediaUrl(avatar) || undefined}
              />
              <AvatarFallback className="rounded-none bg-gray-200 font-bold font-mono">
                {(user.username || user.email || "?").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-white rounded-full ${
                isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
              title={isOnline ? "Trực tuyến (Online)" : "Ngoại tuyến (Offline)"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold uppercase text-base leading-none mb-1 truncate">
              {fullName || user.username || user.email?.split("@")[0] || "UNKNOWN"}
            </div>
            <div className="font-mono text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </div>
            {/* Hiển thị thông tin liên hệ phụ dưới dạng text nhỏ trên mobile (md:hidden) */}
            <div className="md:hidden mt-2 space-y-1">
              {user.email && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {user.email}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Phone className="w-3 h-3 shrink-0" /> {phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 border-r border-gray-100 hidden md:table-cell">
        <div className="space-y-1">
          {user.email && (
            <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
              <Mail className="w-3 h-3" /> {user.email}
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
              <Phone className="w-3 h-3" /> {phone}
            </div>
          )}
        </div>
      </td>
      <td className="p-4 border-r border-gray-100 whitespace-nowrap">
        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase font-mono border whitespace-nowrap ${role.class}`}>
          {roleLabel}
        </span>
      </td>
      <td className="p-4 border-r border-gray-100 whitespace-nowrap">
        {isOnline ? (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-600 font-bold uppercase">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
            <span className="hidden sm:inline">ONLINE</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 font-bold uppercase">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <span className="hidden sm:inline">OFFLINE</span>
          </span>
        )}
      </td>
      <td className="p-4 border-r border-gray-100 whitespace-nowrap">
        {isActive ? (
          <span className="px-2 py-0.5 text-[10px] font-mono border border-black bg-white text-black font-bold uppercase">
            {t("users.status.active", "Hoạt động")}
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-mono border border-red-600 bg-red-50 text-red-600 font-bold uppercase">
            {t("users.status.locked", "Đã khóa")}
          </span>
        )}
      </td>
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-none border border-transparent hover:border-black hover:bg-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-none border border-black w-48 font-mono text-xs uppercase"
          >
            <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDetail(user)} className="cursor-pointer">
              <Eye className="mr-2 h-3 w-3" /> {t("users.actions.detail")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)} className="cursor-pointer">
              <Edit className="mr-2 h-3 w-3" /> {t("users.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangePassword(user)} className="cursor-pointer">
              <Lock className="mr-2 h-3 w-3" /> {t("users.actions.changePassword")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(user)} className="cursor-pointer">
              {isActive ? (
                <>
                  <UserX className="mr-2 h-3 w-3 text-red-600" /> <span className="text-red-600">{t("users.actions.lock", "Khóa tài khoản")}</span>
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-3 w-3 text-green-600" /> <span className="text-green-600">{t("users.actions.unlock", "Kích hoạt")}</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600 hover:bg-red-50 cursor-pointer">
              <Trash2 className="mr-2 h-3 w-3" /> {t("users.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
});
UserRow.displayName = "UserRow";

/**
 * UserManagePage — Admin user management with bulk operations and activity log.
 */
const UserManagePage = () => {
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
  const assignableRoleOptions = roleOptions.filter(
    (option) => ![String(ROLES.USER), String(ROLES.GUEST)].includes(option.value),
  );

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16 shrink-0" />
            <div>
              <h1 className="tim-title">{t("users.title")}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0">
                  SYSTEM // USERS
                </span>
                <p className="tim-meta">{t("users.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="flex-1 sm:flex-none h-12 rounded-none border border-black hover:bg-black hover:text-white px-4 font-mono text-xs uppercase font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={fetchUsers}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 sm:flex-none h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all tim-button rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("users.addUser")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard title={t("users.stats.total")} value={userStats.total} icon={Users} serial="USR-001" />
            <TimStatsCard title={t("users.stats.active")} value={userStats.active} icon={UserCheck} serial="USR-002" textColor="text-emerald-600" />
            <TimStatsCard title={t("users.stats.locked")} value={userStats.locked} icon={UserX} serial="USR-003" textColor="text-gray-500" />
            <TimStatsCard title={t("users.stats.perPage")} value={userStats.onPage} icon={Activity} serial="USR-004" color="bg-yellow-50" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="flex-1 flex shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder={t("users.searchPlaceholder")}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="flex-1 h-10 px-4 border-y border-r border-black tim-body uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex md:items-center">
            <Select value={filters.roleId.toString()} onValueChange={(val) => handleFilterChange("roleId", val)}>
              <SelectTrigger className="w-full md:w-[180px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("users.table.role")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(val) => handleFilterChange("status", val)}>
              <SelectTrigger className="w-full md:w-[150px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("users.table.account", "Tài khoản")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="active">{t("users.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("users.status.locked")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-black text-white p-3 flex items-center justify-between border border-black">
            <div className="flex items-center gap-3 font-mono text-xs uppercase">
              <CheckSquare className="h-4 w-4" />
              <span>Đã chọn {selectedIds.size} người dùng</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-white text-white hover:bg-white hover:text-black font-mono text-xs uppercase"
                onClick={() => setBulkRoleDialogOpen(true)}
              >
                <UserCog className="mr-2 h-3 w-3" />
                Gán vai trò
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-white text-white hover:bg-white hover:text-black font-mono text-xs uppercase"
                onClick={() => setSelectedIds(new Set())}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
              <span className="font-mono text-xs uppercase text-gray-500">
                {t("common.loading")}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white tim-table-header">
                    <th className="p-4 border-r border-black/20 w-[40px]">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="flex items-center justify-center text-white"
                        aria-label="Chọn tất cả"
                      >
                        <SelectAllIcon className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="p-4 border-r border-black/20 w-[60px] hidden sm:table-cell">
                      STT
                    </th>
                    <th className="p-4 border-r border-black/20">
                      {t("users.table.basicInfo")}
                    </th>
                    <th className="p-4 border-r border-black/20 hidden md:table-cell">{t("users.table.contact")}</th>
                    <th className="p-4 border-r border-black/20 whitespace-nowrap">{t("users.table.role")}</th>
                    <th className="p-4 border-r border-black/20 whitespace-nowrap">{t("users.table.connection", "Kết nối")}</th>
                    <th className="p-4 border-r border-black/20 whitespace-nowrap">{t("users.table.account", "Tài khoản")}</th>
                    <th className="p-4 text-right">{t("users.table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
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
                        <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <div className="font-bold uppercase text-gray-400">
                          {t("common.noData")}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50 font-mono text-xs uppercase">
              <div>
                {t("users.pagination.showing", { count: users.length, total: pagination.total })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => handleFilterChange("page", filters.page - 1)}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  {t("users.pagination.previous")}
                </Button>
                <span className="flex items-center px-4 font-bold">
                  {filters.page}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page === pagination.totalPages}
                  onClick={() => handleFilterChange("page", filters.page + 1)}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  {t("users.pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-none border border-black p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-red-600 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" /> {t("users.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
              {t("users.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="font-mono text-sm mb-4">
              {t("users.deleteDialog.message", { username: userToDelete?.username || userToDelete?.email })}
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none border-black hover:bg-gray-100"
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
              >
                {t("common.confirmDelete")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <DialogContent className="rounded-none border border-black">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Gán vai trò hàng loạt
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase">
              Cập nhật vai trò cho {selectedIds.size} người dùng đã chọn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
              <SelectTrigger className="rounded-none border-black font-mono text-xs uppercase">
                <SelectValue placeholder="Chọn vai trò mới" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                {assignableRoleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRoleDialogOpen(false)}
              className="rounded-none border-black"
            >
              Hủy
            </Button>
            <Button
              onClick={handleBulkRoleAssign}
              disabled={!bulkRoleId || bulkSubmitting}
              className="rounded-none border border-black bg-black text-white hover:bg-primary hover:text-black font-bold uppercase"
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
