import { useState, useEffect } from "react";
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
  MapPin,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ROLE_NAMES } from "@/config/constants";
import { locationService } from "@/services/locationService";

const UserDetailModal = ({ open, onClose, user }) => {
  const [fullAddress, setFullAddress] = useState("Đang tải...");
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Build full address from province/district codes
  useEffect(() => {
    const buildAddress = async () => {
      if (!user || !open) {
        setFullAddress("—");
        return;
      }

      setLoadingAddress(true);
      const parts = [];

      // Get address from profile or user
      const address = user.profile?.address || user.address;
      if (address) parts.push(address);

      const provinceCode = user.profile?.provinceCode || user.provinceCode;
      const districtCode = user.profile?.districtCode || user.districtCode;

      if (!provinceCode) {
        setFullAddress(parts.length > 0 ? parts.join(", ") : "—");
        setLoadingAddress(false);
        return;
      }

      try {
        // Fetch all wards for the province
        if (districtCode) {
          try {
            const wards = await locationService.getWardsByProvince(
              provinceCode
            );

            // ProvinceDistrictSelect lưu ward_code vào districtCode
            // Nên tìm ward theo ward_code
            const ward = wards.find((w) => w.ward_code === districtCode);

            if (ward) {
              // Thêm tên phường/xã
              if (ward.ward_name) {
                parts.push(ward.ward_name);
              }
              // Thêm tên quận/huyện
              if (ward.district_name) {
                parts.push(ward.district_name);
              }
            } else {
              console.log(
                "Ward not found. WardCode:",
                districtCode,
                "Available wards:",
                wards.length
              );
            }
          } catch (err) {
            console.error("Error fetching ward:", err);
          }
        }

        // Fetch province name
        const provinces = await locationService.getAllProvinces();
        const province = provinces.find(
          (p) => p.province_code === provinceCode
        );

        if (province) {
          parts.push(province.name);
        }
      } catch (error) {
        console.error("Error fetching location names:", error);
      }

      setFullAddress(parts.length > 0 ? parts.join(", ") : "—");
      setLoadingAddress(false);
    };

    buildAddress();
  }, [user, open]);

  if (!user) return null;

  // Helper functions
  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "—";
    }
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
    return genderMap[gender] || "—";
  };

  const getStatusInfo = (status) => {
    if (status === "active") {
      return { text: "Hoạt động", className: "bg-green-100 text-green-700" };
    }
    if (status === "inactive" || status === "locked") {
      return { text: "Bị khóa", className: "bg-red-100 text-red-700" };
    }
    if (status === "banned") {
      return { text: "Bị cấm", className: "bg-gray-100 text-gray-700" };
    }
    return { text: "Không xác định", className: "bg-gray-100 text-gray-700" };
  };

  const getRoleColor = (roleId) => {
    const colors = {
      1: "bg-red-100 text-red-700", // Super Admin
      2: "bg-purple-100 text-purple-700", // Admin
      3: "bg-emerald-100 text-emerald-700", // Business
      4: "bg-blue-100 text-blue-700", // Staff
      5: "bg-gray-100 text-gray-700", // Guest
    };
    return colors[roleId] || "bg-gray-100 text-gray-700";
  };

  // Get display values
  const displayName =
    user.profile?.fullName || user.fullName || "Chưa cập nhật";
  const displayPhone = user.profile?.phone || user.phone || "—";
  const displayGender = getGenderName(user.profile?.gender || user.gender);
  const displayDob = formatDate(user.profile?.dateOfBirth || user.dateOfBirth);
  const statusInfo = getStatusInfo(user.status);
  const avatarInitial =
    displayName !== "Chưa cập nhật"
      ? displayName.charAt(0).toUpperCase()
      : user.email.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {avatarInitial}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold text-gray-900 truncate">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                    user.roleId
                  )}`}
                >
                  {getRoleName(user.roleId)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}
                >
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Mail className="w-4 h-4 text-blue-500" />
              Thông tin liên hệ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="font-medium text-gray-900 break-all">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Số điện thoại
                </p>
                <p className="font-medium text-gray-900">{displayPhone}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <User className="w-4 h-4 text-blue-500" />
              Thông tin cá nhân
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Giới tính
                  </p>
                  <p className="font-medium text-gray-900">{displayGender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Ngày sinh
                  </p>
                  <p className="font-medium text-gray-900">{displayDob}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Địa chỉ
                </p>
                <p className="font-medium text-gray-900">
                  {loadingAddress ? "Đang tải..." : fullAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Shield className="w-4 h-4 text-blue-500" />
              Thông tin tài khoản
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Vai trò
                </p>
                <p className="font-medium text-gray-900">
                  {getRoleName(user.roleId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Trạng thái
                </p>
                <p className="font-medium text-gray-900">{statusInfo.text}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Email xác thực
                </p>
                <div className="flex items-center gap-1">
                  {user.emailVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-600">
                        Đã xác thực
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-600">
                        Chưa xác thực
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4 text-blue-500" />
              Thời gian
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Ngày tạo
                </p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(user.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Đăng nhập lần cuối
                </p>
                <p className="font-medium text-gray-900">
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
