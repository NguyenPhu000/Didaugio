import React, { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_NAMES, ROLES } from "@/constants/constants";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { profileService } from "@/apis/profileService";
import { useAuthStore } from "@/stores/authStore";
import { getInitials } from "./profileConstants";

// Nén ảnh Avatar nhẹ gọn < 150KB
const compressAvatar = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Vui lòng chọn file hình ảnh hợp lệ"));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        const targetSize = Math.min(size, 400);
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          startX,
          startY,
          size,
          size,
          0,
          0,
          targetSize,
          targetSize
        );
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Không thể xử lý hình ảnh"));
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc file"));
  });
};

export const ProfileAvatarCard = memo(({ profile, onAvatarUpdated }) => {
  const { t } = useTranslation();
  const { setUser, user: authUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const currentAvatar =
    previewAvatar ||
    resolveMediaUrl(profile?.profile?.avatar || profile?.avatar);

  const roleId = profile?.roleId ?? authUser?.roleId;
  const isSuperAdmin = roleId === ROLES.SUPER_ADMIN;
  const isAdmin = roleId === ROLES.ADMIN || isSuperAdmin;
  const roleName = isSuperAdmin
    ? "Quản trị viên Cấp cao"
    : isAdmin
    ? "Quản trị viên"
    : ROLE_NAMES[roleId] || "Thành viên";

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressAvatar(file);
      setPreviewAvatar(compressedDataUrl);

      const response = await profileService.updateAvatar(compressedDataUrl);
      if (response.success) {
        toast.success("Cập nhật ảnh đại diện thành công");
        const updatedAvatarUrl = response.data?.avatar || compressedDataUrl;

        if (authUser) {
          setUser({
            ...authUser,
            avatar: updatedAvatarUrl,
            profile: {
              ...authUser.profile,
              avatar: updatedAvatarUrl,
            },
          });
        }

        if (onAvatarUpdated) {
          onAvatarUpdated(updatedAvatarUrl);
        }
      }
    } catch (error) {
      toast.error(error.message || "Tải ảnh đại diện thất bại");
      setPreviewAvatar(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar tròn tối giản phong cách Apple */}
          <div className="relative group shrink-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-[#F5F5F7] border border-black/[0.06] flex items-center justify-center">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profile?.profile?.fullName || "Avatar"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight">
                  {getInitials(profile?.profile?.fullName, profile?.email)}
                </span>
              )}

              {/* Upload Spinner */}
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1D1D1F]" />
                </div>
              )}
            </div>

            {/* Change Photo Overlay Button */}
            {!isUploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                Đổi ảnh
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* User Details */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                {profile?.profile?.fullName || profile?.email?.split("@")[0]}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F]">
                {roleName}
              </span>
            </div>

            <p className="text-sm text-[#86868B] font-normal">
              {profile?.email}
            </p>

            {profile?.createdAt && (
              <p className="text-xs text-[#86868B] pt-0.5">
                Thành viên từ ngày {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 text-xs text-[#86868B] font-medium shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#34C759]" />
          <span>Tài khoản đang hoạt động</span>
        </div>
      </div>
    </div>
  );
});

ProfileAvatarCard.displayName = "ProfileAvatarCard";
export default ProfileAvatarCard;
