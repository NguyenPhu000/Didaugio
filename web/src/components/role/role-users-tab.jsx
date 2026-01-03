import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userPermissionService } from "@/services/userPermissionService";
import { Search, Settings, UserCog, Users as UsersIcon } from "lucide-react";
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

      console.log("Users response:", response);

      if (response && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        console.error("Invalid response structure:", response);
        setUsers([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải users:", error);
      toast.error("Không thể tải danh sách users");
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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 border rounded-lg"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm user theo email hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          Tìm
        </Button>
      </div>

      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            Đã chọn {selectedUsers.size} user(s)
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkManage}>
              <UserCog className="h-4 w-4 mr-2" />
              Chỉnh quyền hàng loạt
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeselectAll}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} user(s)</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSelectAll}
          disabled={selectedUsers.size === users.length}
        >
          Chọn tất cả
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có user nào trong vai trò này</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedUsers.has(user.id)}
                onCheckedChange={() => handleToggleUser(user.id)}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {getInitials(user.email, user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {user.fullName || user.email}
                  </p>
                  {user.customPermissionCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{user.customPermissionCount} custom
                    </Badge>
                  )}
                  <Badge
                    variant={
                      user.status === "active" ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {user.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManageUser(user)}
              >
                <Settings className="h-4 w-4 mr-2" />
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
