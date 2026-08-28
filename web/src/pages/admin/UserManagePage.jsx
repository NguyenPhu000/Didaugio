// MAP: UserManagePage
// ├── UI: @/components/admin/users/{UserHeaderToolbar, UserMasterTable, UserCreateEditModal, UserDeleteLockModal}
// └── API: @/apis/userService, @/components/admin/users/useUserManagement

import React from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus, RefreshCw, UserCheck, UserX, Activity, Download } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import TimStatsCard from "@/components/admin/TimStatsCard";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";

// Extracted Sub-Components
import { useUserManagement } from "@/components/admin/users/useUserManagement";
import UserFilterBar from "@/components/admin/users/UserFilterBar";
import UserBulkActionsBar from "@/components/admin/users/UserBulkActionsBar";
import UserBulkRoleDialog from "@/components/admin/users/UserBulkRoleDialog";
import UserDeleteDialog from "@/components/admin/users/UserDeleteDialog";
import UserTableView from "@/components/admin/users/UserTableView";

const UserManagePage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  const {
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
  } = useUserManagement(currentUser);

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quản trị Tài khoản & Phân quyền
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("users.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("users.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center h-10 px-4 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-slate-50 shadow-sm border border-slate-200 transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-700" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchUsers}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-slate-50 shadow-sm border border-slate-200 transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            title="Đồng bộ lại"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-800 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 sm:flex-initial justify-center h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>{t("users.addUser")}</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Strip */}
      {!loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("users.stats.total")}
            value={userStats.total}
            icon={Users}
          />
          <TimStatsCard
            title={t("users.stats.active")}
            value={userStats.active}
            icon={UserCheck}
          />
          <TimStatsCard
            title={t("users.stats.locked")}
            value={userStats.locked}
            icon={UserX}
          />
          <TimStatsCard
            title={t("users.stats.perPage")}
            value={userStats.onPage}
            icon={Activity}
          />
        </section>
      )}

      {/* Filter Bar */}
      <UserFilterBar
        filters={filters}
        handleFilterChange={handleFilterChange}
        roleOptions={roleOptions}
      />

      {/* Bulk Action Pill Bar */}
      <UserBulkActionsBar
        selectedCount={selectedIds.size}
        onOpenBulkRole={() => setBulkRoleDialogOpen(true)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* User Table View */}
      <UserTableView
        loading={loading}
        users={users}
        pagination={pagination}
        filters={filters}
        selectedIds={selectedIds}
        handleSelectOne={handleSelectOne}
        handleSelectAll={handleSelectAll}
        handleDetail={handleDetail}
        handleEdit={handleEdit}
        handleChangePassword={handleChangePassword}
        handleToggleStatus={handleToggleStatus}
        handleDelete={handleDelete}
        handlePageChange={handlePageChange}
        SelectAllIcon={SelectAllIcon}
      />

      {/* Delete Confirmation Dialog */}
      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userToDelete={userToDelete}
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk Role Assignment Dialog */}
      <UserBulkRoleDialog
        open={bulkRoleDialogOpen}
        onOpenChange={setBulkRoleDialogOpen}
        selectedCount={selectedIds.size}
        bulkRoleId={bulkRoleId}
        setBulkRoleId={setBulkRoleId}
        assignableRoleOptions={assignableRoleOptions}
        onSubmit={handleBulkRoleAssign}
        bulkSubmitting={bulkSubmitting}
      />

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
