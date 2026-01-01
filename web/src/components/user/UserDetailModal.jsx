import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components/ui";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Clock,
} from "lucide-react";
import { ROLE_NAMES } from "@/config/constants";

const UserDetailModal = ({ open, onClose, user }) => {
  if (!user) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("vi-VN");
  };

  const getRoleName = (roleId) => {
    return ROLE_NAMES[roleId] || "Không xác định";
  };

  const getGenderName = (gender) => {
    const genderMap = {
      male: "Nam",
      female: "Nữ",
      other: "Khác",
    };
    return genderMap[gender] || "Không xác định";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user.fullName?.charAt(0) || user.email?.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {user.fullName || "N/A"}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.roleId === 1
                      ? "bg-red-100 text-red-800"
                      : user.roleId === 2
                      ? "bg-purple-100 text-purple-800"
                      : user.roleId === 3
                      ? "bg-green-100 text-green-800"
                      : user.roleId === 4
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getRoleName(user.roleId)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive || user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive || user.status === "active"
                    ? "Hoạt động"
                    : "Bị khóa"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Thông tin liên hệ
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium">{user.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Thông tin cá nhân
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Giới tính</p>
                <p className="font-medium">{getGenderName(user.gender)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày sinh</p>
                <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{user.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Thông tin tài khoản
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">#{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="font-medium">{getRoleName(user.roleId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trạng thái</p>
                <p className="font-medium">
                  {user.isActive || user.status === "active"
                    ? "Hoạt động"
                    : "Bị khóa"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email verified</p>
                <p className="font-medium">
                  {user.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Thời gian
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ngày tạo</p>
                <p className="font-medium">{formatDateTime(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Đăng nhập lần cuối</p>
                <p className="font-medium">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
