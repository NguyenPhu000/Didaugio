import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, Button, Input } from "@/components/ui";
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
  }, [searchTerm, roleFilter, statusFilter]);

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
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-500 font-medium">
              Bạn không có quyền truy cập trang này
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            Quản lý người dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản và phân quyền người dùng
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Tổng số</p>
                <p className="text-xl font-bold text-blue-700">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Hoạt động</p>
                <p className="text-xl font-bold text-green-700">
                  {stats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Bị khóa</p>
                <p className="text-xl font-bold text-red-700">{stats.locked}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">Admin</p>
                <p className="text-xl font-bold text-purple-700">
                  {stats.admin}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Business</p>
                <p className="text-xl font-bold text-emerald-700">
                  {stats.business}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Khách</p>
                <p className="text-xl font-bold text-gray-700">
                  {stats.customer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
            >
              <option value="all">Tất cả vai trò</option>
              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.BUSINESS}>Business Owner</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.GUEST}>Guest</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Bị khóa</option>
              <option value="banned">Bị cấm</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500 font-medium">
                Không tìm thấy người dùng nào
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Thử thay đổi bộ lọc hoặc thêm người dùng mới
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                        Người dùng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user, index) => (
                      <tr
                        key={`${user.id}-${user.email}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Index */}
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {totalUsers -
                            ((currentPage - 1) * usersPerPage + index)}
                        </td>

                        {/* User Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {getAvatarInitial(user)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getUserDisplayName(user)}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getUserPhone(user)}
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.roleId === ROLES.SUPER_ADMIN
                                ? "bg-red-100 text-red-700"
                                : user.roleId === ROLES.ADMIN
                                ? "bg-purple-100 text-purple-700"
                                : user.roleId === ROLES.BUSINESS
                                ? "bg-emerald-100 text-emerald-700"
                                : user.roleId === ROLES.STAFF
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {ROLE_NAMES[user.roleId] || "Guest"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : user.status === "banned"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-green-500"
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
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewDetail(user)}
                              className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-md transition-colors ${
                                user.status === "active"
                                  ? "text-orange-600 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={
                                user.status === "active"
                                  ? "Khóa tài khoản"
                                  : "Mở khóa"
                              }
                            >
                              {user.status === "active" ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * usersPerPage + 1} -{" "}
                    {Math.min(currentPage * usersPerPage, totalUsers)} /{" "}
                    {totalUsers} người dùng
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* Page numbers */}
                    {(() => {
                      const pages = [];

                      // Show first page
                      pages.push(
                        <Button
                          key="page-1"
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="min-w-[36px] px-2"
                        >
                          1
                        </Button>
                      );

                      // Logic for middle pages
                      let startPage = Math.max(2, currentPage - 1);
                      let endPage = Math.min(totalPages - 1, currentPage + 1);

                      // Show ellipsis at start if needed
                      if (startPage > 2) {
                        pages.push(
                          <span
                            key="ellipsis-start"
                            className="px-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }

                      // Show middle pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={`page-${i}`}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="min-w-[36px] px-2"
                          >
                            {i}
                          </Button>
                        );
                      }

                      // Show ellipsis at end if needed
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span
                            key="ellipsis-end"
                            className="px-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }

                      // Show last page if more than 1 page
                      if (totalPages > 1) {
                        pages.push(
                          <Button
                            key={`page-${totalPages}`}
                            variant={
                              currentPage === totalPages ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="min-w-[36px] px-2"
                          >
                            {totalPages}
                          </Button>
                        );
                      }

                      return pages;
                    })()}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
