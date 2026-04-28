import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { userPermissionService } from "@/apis/userPermissionService";
import { toast } from "sonner";
import { UserPermissionModal } from "./user-permission-modal";
import { Search, UserCog, Users, Settings } from "lucide-react";
import { resolveMediaUrl } from "@/utils/mediaUrl";

export function RoleUsersTab({ role }) {
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

      if (response?.success && response.data?.users) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
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
  }, [role.id, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
            className="flex items-center gap-3 p-4 border border-black"
          >
            <Skeleton className="h-10 w-10 border border-gray-300" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-2 border border-gray-300" />
              <Skeleton className="h-3 w-32 border border-gray-300" />
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
          <div className="absolute left-0 top-0 h-full w-10 bg-black flex items-center justify-center text-white">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="TÌM USER THEO EMAIL HOẶC TÊN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-12 h-10 rounded-none border border-black bg-white focus-visible:ring-0 focus-visible:border-black focus:bg-yellow-50 uppercase text-xs font-mono"
          />
        </div>
        <Button
          onClick={handleSearch}
          variant="outline"
          className="h-10 rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
        >
          TÌM
        </Button>
      </div>

      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-[#F3E600]/20 border-2 border-[#F3E600]">
          <p className="text-xs font-bold text-black uppercase tracking-wider font-mono">
            ĐÃ CHỌN {selectedUsers.size} USER(S)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkManage}
              className="bg-black hover:bg-[#F3E600] hover:text-black text-white rounded-none border border-black uppercase text-xs font-bold"
            >
              <UserCog className="h-3 w-3 mr-2" />
              CHỈNH QUYỀN HÀNG LOẠT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeselectAll}
              className="bg-white border border-black text-black hover:bg-gray-100 rounded-none uppercase text-xs font-bold"
            >
              BỎ CHỌN
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-black pb-2">
        <p className="text-xs font-mono font-bold text-black uppercase tracking-wider">
          {users.length} USER(S)
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelectAll}
          disabled={selectedUsers.size === users.length}
          className="text-black hover:bg-gray-100 border border-black rounded-none uppercase text-xs font-bold h-8"
        >
          CHỌN TẤT CẢ
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white border border-black border-dashed">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="uppercase font-mono text-xs">
            CHƯA CÓ USER NÀO TRONG VAI TRÒ NÀY
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-3 p-4 bg-white border border-black hover:shadow-hard transition-all hover:border-l-4 hover:border-l-[#F3E600]"
            >
              <Checkbox
                checked={selectedUsers.has(user.id)}
                onCheckedChange={() => handleToggleUser(user.id)}
                className="data-[state=checked]:bg-[#F3E600] data-[state=checked]:border-black data-[state=checked]:text-black rounded-none border-2"
              />
              <Avatar className="h-10 w-10 border-2 border-black rounded-none">
                <AvatarImage
                  src={
                    resolveMediaUrl(user.avatar || user.profile?.avatar) ||
                    undefined
                  }
                />
                <AvatarFallback className="bg-gray-100 text-black font-bold rounded-none">
                  {getInitials(user.email, user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-black truncate uppercase text-sm tracking-tight">
                    {user.fullName || user.email}
                  </p>
                  {user.customPermissionCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#F3E600] text-black border border-black rounded-none uppercase font-mono"
                    >
                      +{user.customPermissionCount} CUSTOM
                    </Badge>
                  )}
                  <Badge
                    variant={
                      user.status === "active" ? "default" : "destructive"
                    }
                    className={
                      user.status === "active"
                        ? "text-[10px] bg-black text-white border border-black rounded-none uppercase font-mono"
                        : "text-[10px] bg-red-500 text-white border border-black rounded-none uppercase font-mono"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 truncate font-mono">
                  {user.email}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManageUser(user)}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
              >
                <Settings className="h-3 w-3 mr-2" />
                QUẢN LÝ
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
