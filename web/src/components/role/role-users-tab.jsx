import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { userPermissionService } from "@/apis/userPermissionService";
import { toast } from "sonner";
import { UserPermissionModal } from "./user-permission-modal";

export function RoleUsersTab({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [role.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userPermissionService.getUsersByRole(role.id, {
        limit: 100,
        search,
      });

      if (response?.success && response.data?.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Không thể tải danh sách users";
      toast.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

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
    setSelectedUsers(new Set(users.map((u) => u.id)));
  };

  const handleDeselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleManageUser = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleBulkManage = () => {
    if (selectedUsers.size === 0) {
      toast.error("Vui lòng chọn ít nhất 1 user");
      return;
    }
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
      <div className="space-y-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 border rounded-xl"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
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
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             <span className="material-icons-round text-lg">search</span>
           </span>
          <Input
            placeholder="Tìm user theo email hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800">
          Tìm
        </Button>
      </div>

      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Đã chọn {selectedUsers.size} user(s)
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkManage} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg">
              <span className="material-icons-round text-sm mr-2">manage_accounts</span>
              Chỉnh quyền hàng loạt
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeselectAll} className="bg-white dark:bg-slate-800 border-red-200 text-red-600 hover:bg-red-50 rounded-lg">
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{users.length} user(s)</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelectAll}
          disabled={selectedUsers.size === users.length}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        >
          Chọn tất cả
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
           <span className="material-icons-round text-5xl mb-3 opacity-20">group_off</span>
          <p>Chưa có user nào trong vai trò này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              <Checkbox
                checked={selectedUsers.has(user.id)}
                onCheckedChange={() => handleToggleUser(user.id)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
              />
              <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-700">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                  {getInitials(user.email, user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.fullName || user.email}
                  </p>
                  {user.customPermissionCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30">
                      +{user.customPermissionCount} custom
                    </Badge>
                  )}
                  <Badge
                    variant={
                      user.status === "active" ? "default" : "destructive"
                    }
                    className={
                        user.status === "active" 
                        ? "text-[10px] bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100" 
                        : "text-[10px]"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManageUser(user)}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="material-icons-round text-lg mr-1 text-slate-500">settings</span>
                Quản lý quyền
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
