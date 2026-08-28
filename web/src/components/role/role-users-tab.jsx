import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userPermissionService } from "@/apis/userPermissionService";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { UserPermissionModal } from "./user-permission-modal";
import { Search, UserCog, Users, Settings, Crown } from "lucide-react";
import { resolveMediaUrl } from "@/utils/mediaUrl";

export function RoleUsersTab({ role }) {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userPermissionService.getUsersByRole(role.id, {
        limit: 100,
        search,
      });

      let fetchedUsers = [];
      if (response?.success && response.data?.users) {
        fetchedUsers = response.data.users;
      }

      // Move current user to the top if they're in this role
      if (currentUser) {
        const selfIndex = fetchedUsers.findIndex((u) => u.id === currentUser.id);
        if (selfIndex > 0) {
          const [self] = fetchedUsers.splice(selfIndex, 1);
          fetchedUsers.unshift(self);
        }
      }

      setUsers(fetchedUsers);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách users";
      toast.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [role.id, search, currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers();
  };

  const canEditUser = (targetUser) => {
    if (!currentUser) return false;
    // Cannot edit self
    if (targetUser.id === currentUser.id) return false;
    // Cannot edit if target has no role
    if (!targetUser.roleId) return false;
    // Cannot edit same or higher role (lower roleId number = higher authority)
    if (currentUser.roleId >= targetUser.roleId) return false;
    return true;
  };

  const isSelf = (targetUser) => currentUser && targetUser.id === currentUser.id;

  const handleToggleUser = (userId) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedUsers(new Set(users.filter((u) => canEditUser(u)).map((u) => u.id)));
  };

  const handleDeselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleManageUser = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleBulkManage = () => {
    const editableSelected = Array.from(selectedUsers).filter((id) => {
      const u = users.find((user) => user.id === id);
      return u && canEditUser(u);
    });
    if (editableSelected.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 user có thể chỉnh sửa");
      return;
    }
    setSelectedUsers(new Set(editableSelected));
    setBulkModalOpen(true);
  };

  const getInitials = (email, fullName) => {
    if (fullName) {
      return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl border border-black/[0.04] bg-white shadow-xs"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Tìm kiếm user theo email hoặc họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-300"
          />
        </div>
        <Button
          onClick={handleSearch}
          variant="outline"
          className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
        >
          Tìm kiếm
        </Button>
      </div>

      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
          <p className="text-xs font-semibold">
            Đã chọn <strong className="font-mono text-emerald-400">{selectedUsers.size}</strong> thành viên
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkManage}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              <UserCog className="h-3.5 w-3.5 mr-1.5" />
              Chỉnh quyền hàng loạt
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeselectAll}
              className="bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
        <p className="text-xs font-semibold text-slate-500">
          Tổng cộng <strong className="text-slate-900 font-mono">{users.length}</strong> thành viên
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelectAll}
          disabled={selectedUsers.size === users.filter((u) => canEditUser(u)).length}
          className="text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold h-8 cursor-pointer"
        >
          Chọn tất cả
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-black/[0.04]">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30 stroke-[1.5]" />
          <p className="text-xs font-semibold">
            Chưa có thành viên nào trong vai trò này
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
            >
              <Checkbox
                checked={selectedUsers.has(user.id)}
                onCheckedChange={() => handleToggleUser(user.id)}
                disabled={!canEditUser(user)}
                className="rounded-md border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 disabled:opacity-40"
              />
              <Avatar className="h-10 w-10 rounded-full border border-slate-100 shadow-2xs">
                <AvatarImage
                  src={
                    resolveMediaUrl(user.avatar || user.profile?.avatar) ||
                    undefined
                  }
                />
                <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {getInitials(user.email, user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate text-sm">
                    {user.fullName || user.email}
                  </p>
                  {isSelf(user) && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 rounded-full font-semibold flex items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      Bạn
                    </Badge>
                  )}
                  {user.customPermissionCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 rounded-full font-semibold"
                    >
                      +{user.customPermissionCount} custom
                    </Badge>
                  )}
                  <Badge
                    variant={
                      user.status === "active" ? "default" : "destructive"
                    }
                    className={
                      user.status === "active"
                        ? "text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-full font-semibold"
                        : "text-[10px] bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-200 rounded-full font-semibold"
                    }
                  >
                    {user.status === "active" ? "Hoạt động" : user.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate font-mono">
                  {user.email}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManageUser(user)}
                disabled={!canEditUser(user)}
                title={!canEditUser(user) ? "Bạn không có quyền chỉnh sửa quyền của user này" : ""}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Quản lý
              </Button>
            </div>
          ))}
        </div>
      )}

      <UserPermissionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={selectedUser}
        role={role}
        onUpdated={fetchUsers}
      />

      <UserPermissionModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        userIds={Array.from(selectedUsers)}
        role={role}
        onUpdated={() => {
          fetchUsers();
          setSelectedUsers(new Set());
        }}
        isBulk
      />
    </div>
  );
}
