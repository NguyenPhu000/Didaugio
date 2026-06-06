import { useState, useEffect, useCallback, useMemo } from "react";
import { userService } from "@/apis/userService";
import { ROLES, ROLE_NAMES } from "@/constants/constants";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";
import TimStatsCard from "@/components/admin/TimStatsCard";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Shield,
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
} from "lucide-react";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
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
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { useTranslation } from "react-i18next";

/**
 * USER MANAGEMENT PAGE - T.I.M STYLE
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

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

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
  }, [filters, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
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
      // Modal closes itself on success
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error.response?.data?.message ||
          error.message ||
          t("users.errors.saveFailed"),
      });
      throw error; // Let modal handle loading state if necessary
    }
  };

  const handleExportCsv = async () => {
    try {
      toast.loading(t("users.export.loading"), { id: "csv-export" });
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
            label: t("users.csv.role") 
          },
          { key: (row) => (row.status === "active" || row.isActive) ? t("users.status.active") : t("users.status.locked"), label: t("users.csv.status") },
          { key: (row) => formatCsvDate(row.createdAt), label: t("users.csv.createdAt") },
        ],
        data: allData,
        filename: slugifyFilename("danh_sach_nguoi_dung"),
      });

      toast.success(t("users.export.success", { count: allData.length }), { id: "csv-export" });
    } catch {
      toast.error(t("users.export.error"), { id: "csv-export" });
    }
  };

  const getRoleBadge = (roleId) => {
    const roles = {
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
    const role = roles[roleId] || {
      key: null,
      class: "bg-gray-100 text-gray-500",
    };
    const label = role.key ? t(role.key).toUpperCase() : `ROLE-${roleId}`;
    return (
      <span
        className={`text-[10px] px-2 py-0.5 font-bold uppercase font-mono border ${role.class}`}
      >
        {label}
      </span>
    );
  };

  const userStats = useMemo(() => {
    const isActive = (u) =>
      u.status === "active" || u.status === 1 || u.status === true;
    return {
      total: pagination.total,
      active: users.filter(isActive).length,
      locked: users.filter((u) => !isActive(u)).length,
      onPage: users.length,
    };
  }, [users, pagination.total]);

  const getStatusBadge = (status) => {
    const active = status === "active" || status === 1 || status === true;
    return active ? (
      <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 font-bold uppercase">
        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
        {t("users.status.active")}
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[10px] font-mono text-red-500 font-bold uppercase">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        {t("users.status.locked")}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">{t("users.title")}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // USERS
                </span>
                <p className="tim-meta">{t("users.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="h-12 rounded-none border border-black hover:bg-black hover:text-white px-4 font-mono text-xs uppercase font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={fetchUsers}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={handleCreate}
              className="h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all tim-button rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("users.addUser")}
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh (tổng từ API; chi tiết trạng thái theo trang hiện tại) */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard
              title={t("users.stats.total")}
              value={userStats.total}
              icon={Users}
              serial="USR-001"
            />
            <TimStatsCard
              title={t("users.stats.active")}
              value={userStats.active}
              icon={UserCheck}
              serial="USR-002"
              textColor="text-emerald-600"
            />
            <TimStatsCard
              title={t("users.stats.locked")}
              value={userStats.locked}
              icon={UserX}
              serial="USR-003"
              textColor="text-gray-500"
            />
            <TimStatsCard
              title={t("users.stats.perPage")}
              value={userStats.onPage}
              icon={Activity}
              serial="USR-004"
              color="bg-yellow-50"
            />
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

          <div className="flex gap-4">
            <Select
              value={filters.roleId.toString()}
              onValueChange={(val) => handleFilterChange("roleId", val)}
            >
              <SelectTrigger className="w-[180px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("users.table.role")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
                <SelectItem value="1">{t("roles.names.superAdmin").toUpperCase()}</SelectItem>
                <SelectItem value="2">{t("roles.names.admin").toUpperCase()}</SelectItem>
                <SelectItem value="3">{t("roles.names.business").toUpperCase()}</SelectItem>
                <SelectItem value="4">{t("roles.names.staff").toUpperCase()}</SelectItem>
                <SelectItem value="5">{t("roles.names.user").toUpperCase()}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(val) => handleFilterChange("status", val)}
            >
              <SelectTrigger className="w-[150px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("users.table.status")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="active">{t("users.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("users.status.locked")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="font-mono text-xs uppercase text-gray-500">
                {t("common.loading")}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white tim-table-header">
                    <th className="p-4 border-r border-black/20 w-[60px]">
                      {t("users.table.id")}
                    </th>
                    <th className="p-4 border-r border-black/20">
                      {t("users.table.basicInfo")}
                    </th>
                    <th className="p-4 border-r border-black/20">{t("users.table.contact")}</th>
                    <th className="p-4 border-r border-black/20">{t("users.table.role")}</th>
                    <th className="p-4 border-r border-black/20">{t("users.table.status")}</th>
                    <th className="p-4 text-right">{t("users.table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-yellow-50 group transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                        #{user.id}
                      </td>
                      <td className="p-4 border-r border-black/5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-black rounded-none">
                            <AvatarImage
                              src={
                                resolveMediaUrl(
                                  user.avatar || user.profile?.avatar,
                                ) || undefined
                              }
                            />
                            <AvatarFallback className="rounded-none bg-gray-200 font-bold font-mono">
                              {(user.username || user.email || "?")
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold uppercase text-base leading-none mb-1">
                              {user.profile?.fullName ||
                                user.fullName ||
                                user.username ||
                                user.email?.split("@")[0] ||
                                "UNKNOWN"}
                            </div>
                            <div className="font-mono text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          )}
                          {user.profile?.phone && (
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
                              <Phone className="w-3 h-3" /> {user.profile.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        {getRoleBadge(user.roleId)}
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        {getStatusBadge(user.isActive ?? user.status)}
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
                            <DropdownMenuItem
                              onClick={() => handleDetail(user)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-3 w-3" /> {t("users.actions.detail")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(user)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-3 w-3" /> {t("users.actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleChangePassword(user)}
                              className="cursor-pointer"
                            >
                              <Lock className="mr-2 h-3 w-3" /> {t("users.actions.changePassword")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user)}
                              className="cursor-pointer"
                            >
                              {(user.status === "active" || user.isActive) ? (
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3 w-3" /> {t("users.actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
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

      {/* Modals - Keeping original components wrapped but could be styled internally if needed */}
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
      />
    </div>
  );
};

export default UserManagePage;
