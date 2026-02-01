import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { userService } from "@/apis/userService";
import { ROLES } from "@/constants/constants";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";
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
} from "lucide-react";
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

/**
 * USER MANAGEMENT PAGE - T.I.M STYLE (VIETNAMESE)
 */
const UserManagePage = () => {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    business: 0,
    active: 0,
  });

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
      const paginationData = response.data.pagination || {
        total: response.data.total || userData.length,
        totalPages: response.data.totalPages || 1,
      };

      setUsers(userData);
      setPagination(paginationData);

      // Simple stats (in real app, fetched from API)
      setStats({
        total: paginationData.total,
        admin: 0, // Placeholder
        business: 0, // Placeholder
        active: 0, // Placeholder
      });
    } catch (error) {
      toast({
        title: "LỖI HỆ THỐNG",
        description: "Không thể tải dữ liệu người dùng.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
    setShowFormModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowFormModal(true);
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
        title: "THÀNH CÔNG",
        description: "Đã xóa người dùng khỏi hệ thống.",
        className: "bg-black text-white border border-primary font-mono",
      });
      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description: error.message,
      });
    }
  };

  const handleSaveUser = async (data, isEdit) => {
    try {
      if (isEdit) {
        await userService.update(selectedUser.id, data);
        toast({
          title: "THÀNH CÔNG",
          description: "Cập nhật thông tin người dùng thành công.",
          className: "bg-black text-white border border-primary font-mono",
        });
      } else {
        await userService.create(data);
        toast({
          title: "THÀNH CÔNG",
          description: "Tạo người dùng mới thành công.",
          className: "bg-black text-white border border-primary font-mono",
        });
      }
      fetchUsers();
      // Modal closes itself on success
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description:
          error.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi lưu dữ liệu.",
      });
      throw error; // Let modal handle loading state if necessary
    }
  };

  const getRoleBadge = (roleId) => {
    // Mapping based on typically used IDs (adjust if your DB differs)
    const roles = {
      1: {
        label: "SUPER ADMIN",
        class: "bg-red-600 text-white border-red-800",
      },
      2: { label: "ADMIN", class: "bg-black text-white border-black" },
      3: { label: "BUSINESS", class: "bg-blue-600 text-white border-blue-800" },
      4: { label: "MEMBER", class: "bg-gray-200 text-black border-gray-400" },
    };
    const role = roles[roleId] || {
      label: `ROLE-${roleId}`,
      class: "bg-gray-100 text-gray-500",
    };
    return (
      <span
        className={`text-[10px] px-2 py-0.5 font-bold uppercase font-mono border ${role.class}`}
      >
        {role.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const active = status === "active" || status === 1 || status === true;
    return active ? (
      <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 font-bold uppercase">
        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
        HOẠT ĐỘNG
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[10px] font-mono text-red-500 font-bold uppercase">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        ĐÃ KHÓA
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
              <h1 className="tim-title">QUẢN LÝ NGƯỜI DÙNG</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // USERS
                </span>
                <p className="tim-meta">QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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
              THÊM NGƯỜI DÙNG
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="flex-1 flex shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder="TÌM THEO TÊN, EMAIL, SĐT..."
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
                <SelectValue placeholder="VAI TRÒ" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">TẤT CẢ VAI TRÒ</SelectItem>
                <SelectItem value="1">SUPER ADMIN</SelectItem>
                <SelectItem value="2">ADMIN</SelectItem>
                <SelectItem value="3">BUSINESS</SelectItem>
                <SelectItem value="4">MEMBER</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(val) => handleFilterChange("status", val)}
            >
              <SelectTrigger className="w-[150px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder="TRẠNG THÁI" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">TẤT CẢ</SelectItem>
                <SelectItem value="active">HOẠT ĐỘNG</SelectItem>
                <SelectItem value="inactive">ĐÃ KHÓA</SelectItem>
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
                LOADING USER DATA...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white tim-table-header">
                    <th className="p-4 border-r border-black/20 w-[60px]">
                      ID
                    </th>
                    <th className="p-4 border-r border-black/20">
                      THÔNG TIN CƠ BẢN
                    </th>
                    <th className="p-4 border-r border-black/20">LIÊN HỆ</th>
                    <th className="p-4 border-r border-black/20">VAI TRÒ</th>
                    <th className="p-4 border-r border-black/20">TRẠNG THÁI</th>
                    <th className="p-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map((user, index) => (
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
                            <AvatarImage src={user.profile?.avatar} />
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
                            <DropdownMenuLabel>HÀNH ĐỘNG</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDetail(user)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-3 w-3" /> CHI TIẾT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(user)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-3 w-3" /> CHỈNH SỬA
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Lock className="mr-2 h-3 w-3" /> ĐỔI MẬT KHẨU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3 w-3" /> XÓA USER
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
                          KHÔNG TÌM THẤY DỮ LIỆU
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
                HIỂN THỊ {users.length} / {pagination.total} KẾT QUẢ
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => handleFilterChange("page", filters.page - 1)}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  TRƯỚC
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
                  SAU
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
              <Activity className="h-6 w-6" /> CẢNH BÁO: QUY TRÌNH XÓA
            </DialogTitle>
            <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
              Thao tác này là vĩnh viễn và không thể hoàn tác. Xin xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="font-mono text-sm mb-4">
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <span className="font-bold">
                [{userToDelete?.username || userToDelete?.email}]
              </span>{" "}
              khỏi cơ sở dữ liệu?
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none border-black hover:bg-gray-100"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
              >
                Xác nhận xóa
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
