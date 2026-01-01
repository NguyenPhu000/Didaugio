import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { userService } from "@/services/userService";
import { ROLES, ROLE_NAMES } from "@/config/constants";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";

const UserManagePage = () => {
  const { user: currentUser, isAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        roleId: roleFilter === "all" ? undefined : roleFilter,
      };
      const response = await userService.getAll(params);
      if (response.success) {
        setUsers(response.data.users || response.data);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách người dùng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  // Handle create/update user
  const handleSaveUser = async (data, isEdit) => {
    try {
      let response;
      if (isEdit && selectedUser) {
        response = await userService.update(selectedUser.id, data);
        toast.success("Cập nhật người dùng thành công");
      } else {
        response = await userService.create(data);
        toast.success("Tạo người dùng thành công");
      }
      fetchUsers();
      return response;
    } catch (error) {
      toast.error(
        isEdit ? "Lỗi khi cập nhật người dùng" : "Lỗi khi tạo người dùng"
      );
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
  const handleDelete = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;

    try {
      const response = await userService.delete(userId);
      if (response.success) {
        toast.success("Xóa người dùng thành công");
        fetchUsers();
      }
    } catch (error) {
      toast.error("Lỗi khi xóa người dùng");
      console.error(error);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      const response = await userService.update(user.id, { status: newStatus });
      if (response.success) {
        toast.success(
          `${
            newStatus === "active" ? "Kích hoạt" : "Khóa"
          } người dùng thành công`
        );
        fetchUsers();
      }
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái");
      console.error(error);
    }
  };

  // Check permission
  if (!isAdmin()) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-500">
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
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6 text-blue-600" />
                Quản lý người dùng
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Tổng số: {users.length} người dùng
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
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng người dùng</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admin</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.roleId === ROLES.ADMIN).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Business</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.roleId === ROLES.BUSINESS).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khách</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.roleId === ROLES.CUSTOMER).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.BUSINESS}>Business</option>
              <option value={ROLES.STAFF}>Staff</option>
              <option value={ROLES.CUSTOMER}>Khách</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">Không có người dùng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(currentPage - 1) * usersPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.fullName?.charAt(0) ||
                                  user.email?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.username || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.roleId === ROLES.SUPER_ADMIN
                              ? "bg-red-100 text-red-800"
                              : user.roleId === ROLES.ADMIN
                              ? "bg-purple-100 text-purple-800"
                              : user.roleId === ROLES.BUSINESS
                              ? "bg-green-100 text-green-800"
                              : user.roleId === ROLES.STAFF
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ROLE_NAMES[user.roleId] || "Khách"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive || user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive || user.status === "active"
                            ? "Hoạt động"
                            : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`${
                              user.isActive || user.status === "active"
                                ? "text-orange-600 hover:text-orange-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                            title={
                              user.isActive || user.status === "active"
                                ? "Khóa tài khoản"
                                : "Kích hoạt"
                            }
                          >
                            {user.isActive || user.status === "active" ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
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
