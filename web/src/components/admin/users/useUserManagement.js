import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast as sonnerToast } from "sonner";
import { userService } from "@/apis/userService";
import { auditLogService } from "@/apis/auditLogService";
import { ROLES } from "@/constants/constants";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { Square, CheckSquare, MinusSquare } from "lucide-react";

export const useUserManagement = (currentUser) => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const { toast } = useToast();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: urlSearch,
    roleId: "all",
    status: "all",
    limit: 10,
    page: 1,
  });

  // Sync search filter when URL param changes
  useEffect(() => {
    const currentUrlSearch = searchParams.get("search") || "";
    setFilters((prev) => {
      if (prev.search !== currentUrlSearch) {
        return { ...prev, search: currentUrlSearch, page: 1 };
      }
      return prev;
    });
  }, [searchParams]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false);
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

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
        (item) => Number(item?.roleId) !== ROLES.GUEST
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

  const handlePageChange = (newPage) => {
    handleFilterChange("page", newPage);
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
        description:
          newStatus === "active"
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
          description:
            formMode === "change-password"
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
          error.data?.message || error.message || t("users.errors.saveFailed"),
      });
      throw error;
    }
  };

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

  const handleBulkRoleAssign = async () => {
    if (!bulkRoleId || selectedIds.size === 0) return;
    try {
      setBulkSubmitting(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          userService.updateRole(id, parseInt(bulkRoleId, 10))
        )
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

  const handleExportCsv = async () => {
    try {
      sonnerToast.loading(t("users.export.loading"), { id: "csv-export" });
      const allData = await fetchAllPages(
        async (params) => {
          const res = await userService.getAll(params);
          const users = res.data.users || res.data || [];
          return {
            success: true,
            data: users.filter((u) => Number(u?.roleId) !== ROLES.GUEST),
            pagination: res.data.pagination || { totalPages: 1 },
          };
        },
        {
          search: filters.search || undefined,
          roleId: filters.roleId !== "all" ? filters.roleId : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
        }
      );

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          {
            key: (row) =>
              row.profile?.fullName || row.fullName || row.username || "",
            label: t("users.csv.fullName"),
          },
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
              return roleKeys[row.roleId]
                ? t(roleKeys[row.roleId])
                : `Role ${row.roleId}`;
            },
            label: t("users.csv.role"),
          },
          {
            key: (row) =>
              row.status === "active" || row.isActive
                ? t("users.status.active")
                : t("users.status.locked"),
            label: t("users.csv.status"),
          },
          {
            key: (row) => formatCsvDate(row.createdAt),
            label: t("users.csv.createdAt"),
          },
        ],
        data: allData,
        filename: slugifyFilename("danh_sach_nguoi_dung"),
      });

      sonnerToast.success(t("users.export.success", { count: allData.length }), {
        id: "csv-export",
      });
    } catch {
      sonnerToast.error(t("users.export.error"), { id: "csv-export" });
    }
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
    [currentUser?.roleId]
  );

  const assignableRoleOptions = roleOptions.filter(
    (option) =>
      ![String(ROLES.GUEST)].includes(option.value) &&
      canAssignRole(option.value)
  );

  return {
    users,
    loading,
    filters,
    pagination,
    selectedIds,
    setSelectedIds,
    showFormModal,
    setShowFormModal,
    formMode,
    showDetailModal,
    setShowDetailModal,
    selectedUser,
    deleteDialogOpen,
    setDeleteDialogOpen,
    userToDelete,
    bulkRoleDialogOpen,
    setBulkRoleDialogOpen,
    bulkRoleId,
    setBulkRoleId,
    bulkSubmitting,
    activityLog,
    activityLoading,
    fetchUsers,
    handleFilterChange,
    handlePageChange,
    handleCreate,
    handleEdit,
    handleChangePassword,
    handleToggleStatus,
    handleDetail,
    handleDelete,
    handleDeleteConfirm,
    handleSaveUser,
    handleSelectOne,
    handleSelectAll,
    handleBulkRoleAssign,
    handleExportCsv,
    userStats,
    SelectAllIcon,
    roleOptions,
    assignableRoleOptions,
  };
};
