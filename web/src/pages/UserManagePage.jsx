import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { userService } from "@/services/userService";
import { ROLES, ROLE_NAMES } from "@/config/constants";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";

const UserManagePage = () => {
  const { isAdmin } = useAuthStore();

  // Data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loginFilter, setLoginFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Helper: Get user display name
  const getUserDisplayName = (user) => {
    return user.profile?.fullName || user.fullName || "Chưa cập nhật";
  };

  // Helper: Get user phone
  const getUserPhone = (user) => {
    return user.profile?.phone || user.phone || "—";
  };

  // Helper: Get avatar initial
  const getAvatarInitial = (user) => {
    const name = user.profile?.fullName || user.fullName;
    if (name) return name.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm || undefined,
        roleId: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      };

      const response = await userService.getAll(params);

      if (response.success) {
        const userData = response.data.users || response.data || [];
        setUsers(userData);
        setTotalUsers(
          response.data.total ||
            response.data.pagination?.total ||
            userData.length
        );
        setTotalPages(
          response.data.totalPages ||
            response.data.pagination?.totalPages ||
            Math.ceil(userData.length / usersPerPage) ||
            1
        );
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, usersPerPage]);

  // Effect: Fetch on filter change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    roleFilter,
    statusFilter,
    groupFilter,
    dateFilter,
    loginFilter,
  ]);

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setGroupFilter("all");
    setDateFilter("all");
    setLoginFilter("all");
  };

  // Handle create/update user
  const handleSaveUser = async (data, isEdit) => {
    try {
      if (isEdit && selectedUser) {
        await userService.update(selectedUser.id, data);
        toast.success("Cập nhật người dùng thành công");
      } else {
        await userService.create(data);
        toast.success("Tạo người dùng thành công");
      }
      fetchUsers();
      return true;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (isEdit ? "Lỗi khi cập nhật người dùng" : "Lỗi khi tạo người dùng");
      toast.error(message);
      throw error;
    }
  };

  // Handle view detail
  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Handle edit
  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowFormModal(true);
  };

  // Handle create
  const handleCreate = () => {
    setSelectedUser(null);
    setShowFormModal(true);
  };

  // Handle delete user
  const handleDelete = async (user) => {
    const displayName = getUserDisplayName(user);

    if (
      !window.confirm(
        `Bạn có chắc muốn xóa người dùng "${displayName}"?\n\nHành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await userService.delete(user.id);
      toast.success("Xóa người dùng thành công");
      fetchUsers();
    } catch (error) {
      toast.error("Lỗi khi xóa người dùng");
      console.error("Delete user error:", error);
    }
  };

  // Handle toggle status (lock/unlock)
  const handleToggleStatus = async (user) => {
    const isActive = user.status === "active";
    const action = isActive ? "khóa" : "mở khóa";
    const displayName = getUserDisplayName(user);

    if (
      !window.confirm(`Bạn có chắc muốn ${action} tài khoản "${displayName}"?`)
    ) {
      return;
    }

    try {
      const newStatus = isActive ? "inactive" : "active";
      await userService.update(user.id, { status: newStatus });
      toast.success(`${isActive ? "Khóa" : "Mở khóa"} tài khoản thành công`);
      fetchUsers();
    } catch (error) {
      toast.error(`Lỗi khi ${action} tài khoản`);
      console.error("Toggle status error:", error);
    }
  };

  // Stats calculation
  const stats = {
    total: totalUsers,
    active: users.filter((u) => u.status === "active").length,
    locked: users.filter(
      (u) => u.status === "inactive" || u.status === "locked"
    ).length,
    admin: users.filter(
      (u) => u.roleId === ROLES.ADMIN || u.roleId === ROLES.SUPER_ADMIN
    ).length,
    business: users.filter((u) => u.roleId === ROLES.BUSINESS).length,
    customer: users.filter((u) => u.roleId === ROLES.GUEST).length,
  };

  // Check permission
  if (!isAdmin()) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="material-icons-round text-6xl text-red-400 mb-4">
            shield
          </span>
          <p className="text-red-500 font-medium">
            Bạn không có quyền truy cập trang này
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-6 lg:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-primary/10 text-blue-600 p-2 rounded-lg">
              <span className="material-icons-round text-2xl">people</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý người dùng
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-14">
            Quản lý tài khoản và phân quyền người dùng hệ thống
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm text-sm font-medium disabled:opacity-50"
          >
            <span
              className={`material-icons-round text-lg ${
                loading ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
            Làm mới
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-sm font-medium"
          >
            <span className="material-icons-round text-lg">add</span>
            Thêm người dùng
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <span className="material-icons-round">group</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng số
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
              {stats.total}
            </h3>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-green-200 dark:hover:border-green-800 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <span className="material-icons-round">person_check</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Hoạt động
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-green-600 transition-colors">
              {stats.active}
            </h3>
          </div>
        </div>

        {/* Locked */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-red-200 dark:hover:border-red-800 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <span className="material-icons-round">person_off</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Bị khóa
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-red-600 transition-colors">
              {stats.locked}
            </h3>
          </div>
        </div>

        {/* Admin */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <span className="material-icons-round">security</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Admin
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">
              {stats.admin}
            </h3>
          </div>
        </div>

        {/* Business */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-600 dark:text-teal-400">
              <span className="material-icons-round">business_center</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Business
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition-colors">
              {stats.business}
            </h3>
          </div>
        </div>

        {/* Guest */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between group hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
              <span className="material-icons-round">person_outline</span>
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Khách
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-gray-600 transition-colors">
              {stats.customer}
            </h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col gap-5">
        {/* Search Bar and Clear Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full lg:max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-icons-round text-xl">search</span>
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-icons-round text-lg">
                filter_list_off
              </span>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Role Filter */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <span className="material-icons-round text-lg">
                admin_panel_settings
              </span>
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none relative z-0"
            >
              <option value="all">Tất cả vai trò</option>
              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.BUSINESS}>Business Owner</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.GUEST}>Guest</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-icons-round text-lg">expand_more</span>
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <span className="material-icons-round text-lg">toggle_on</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none relative z-0"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Bị khóa</option>
              <option value="banned">Bị cấm</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-icons-round text-lg">expand_more</span>
            </span>
          </div>

          {/* Group Filter */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <span className="material-icons-round text-lg">groups</span>
            </span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none relative z-0"
            >
              <option value="all">Tất cả nhóm</option>
              <option value="sales">Sales Team</option>
              <option value="marketing">Marketing</option>
              <option value="developer">Developer</option>
              <option value="support">Support</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-icons-round text-lg">expand_more</span>
            </span>
          </div>

          {/* Date Filter */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <span className="material-icons-round text-lg">event_note</span>
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none relative z-0"
            >
              <option value="all">Ngày đăng ký</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="custom">Tùy chọn...</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-icons-round text-lg">expand_more</span>
            </span>
          </div>

          {/* Login Filter */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
              <span className="material-icons-round text-lg">history</span>
            </span>
            <select
              value={loginFilter}
              onChange={(e) => setLoginFilter(e.target.value)}
              className="w-full py-2.5 pl-10 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-blue-600 focus:border-blue-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none relative z-0"
            >
              <option value="all">Đăng nhập gần nhất</option>
              <option value="24h">24h qua</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="inactive">Không hoạt động &gt; 30 ngày</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <span className="material-icons-round text-lg">expand_more</span>
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <span className="material-icons-round text-6xl text-blue-600 dark:text-blue-400 animate-spin">
              refresh
            </span>
            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-icons-round text-7xl text-slate-300 dark:text-slate-600">
              group
            </span>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
              Không tìm thấy người dùng nào
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Thử thay đổi bộ lọc hoặc thêm người dùng mới
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 pl-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12 text-center">
                      #
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="p-4 pr-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user, index) => {
                    const avatarColors = [
                      "from-blue-400 to-blue-600",
                      "from-indigo-400 to-indigo-600",
                      "from-purple-400 to-purple-600",
                      "from-pink-400 to-pink-600",
                      "from-teal-400 to-teal-600",
                    ];
                    const colorIndex = (user.id || index) % avatarColors.length;

                    return (
                      <tr
                        key={`${user.id}-${user.email}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Index */}
                        <td className="p-4 pl-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                          {totalUsers -
                            ((currentPage - 1) * usersPerPage + index)}
                        </td>

                        {/* User Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[colorIndex]} flex items-center justify-center text-sm font-bold border-2 border-white dark:border-slate-800 shadow-sm`}
                            >
                              <span className="text-white">
                                {getAvatarInitial(user)}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {getUserDisplayName(user)}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                          {getUserPhone(user) === "—" ? (
                            <span className="text-slate-400 dark:text-slate-500">
                              —
                            </span>
                          ) : (
                            getUserPhone(user)
                          )}
                        </td>

                        {/* Role */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              user.roleId === ROLES.SUPER_ADMIN
                                ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800"
                                : user.roleId === ROLES.ADMIN
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800"
                                : user.roleId === ROLES.BUSINESS
                                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-100 dark:border-teal-800"
                                : user.roleId === ROLES.STAFF
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {ROLE_NAMES[user.roleId] || "Guest"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              user.status === "active"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                                : user.status === "banned"
                                ? "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-100 dark:border-gray-800"
                                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-emerald-500"
                                  : user.status === "banned"
                                  ? "bg-gray-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {user.status === "active"
                              ? "Hoạt động"
                              : user.status === "banned"
                              ? "Bị cấm"
                              : "Bị khóa"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewDetail(user)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Xem"
                            >
                              <span className="material-icons-round text-lg">
                                visibility
                              </span>
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <span className="material-icons-round text-lg">
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 transition-colors rounded-lg ${
                                user.status === "active"
                                  ? "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                  : "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                              title={
                                user.status === "active" ? "Khóa" : "Mở khóa"
                              }
                            >
                              <span className="material-icons-round text-lg">
                                {user.status === "active"
                                  ? "lock"
                                  : "lock_open"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <span className="material-icons-round text-lg">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Hiển thị{" "}
                  <span className="font-medium text-slate-800 dark:text-white">
                    {(currentPage - 1) * usersPerPage + 1}
                  </span>{" "}
                  đến{" "}
                  <span className="font-medium text-slate-800 dark:text-white">
                    {Math.min(currentPage * usersPerPage, totalUsers)}
                  </span>{" "}
                  trong{" "}
                  <span className="font-medium text-slate-800 dark:text-white">
                    {totalUsers}
                  </span>{" "}
                  kết quả
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-icons-round text-lg">
                      chevron_left
                    </span>
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    const pages = [];

                    // Show first page
                    pages.push(
                      <button
                        key="page-1"
                        onClick={() => setCurrentPage(1)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
                          currentPage === 1
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        1
                      </button>
                    );

                    // Logic for middle pages
                    let startPage = Math.max(2, currentPage - 1);
                    let endPage = Math.min(totalPages - 1, currentPage + 1);

                    // Show ellipsis at start if needed
                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="ellipsis-start"
                          className="px-2 text-slate-500"
                        >
                          ...
                        </span>
                      );
                    }

                    // Show middle pages
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={`page-${i}`}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
                            currentPage === i
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Show ellipsis at end if needed
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span
                          key="ellipsis-end"
                          className="px-2 text-slate-500"
                        >
                          ...
                        </span>
                      );
                    }

                    // Show last page if more than 1 page
                    if (totalPages > 1) {
                      pages.push(
                        <button
                          key={`page-${totalPages}`}
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${
                            currentPage === totalPages
                              ? "bg-blue-600 text-white"
                              : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <span className="material-icons-round text-lg">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleSaveUser}
      />

      <UserDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagePage;
