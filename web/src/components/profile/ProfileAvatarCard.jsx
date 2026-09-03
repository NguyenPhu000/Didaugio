import React, { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  ShieldCheck,
  Building2,
  Camera,
  Loader2,
  CheckCircle2,
  Calendar,
  Sparkles,
  User,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_NAMES, ROLES } from "@/constants/constants";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { profileService } from "@/apis/profileService";
import { useAuthStore } from "@/stores/authStore";
import { getInitials } from "./profileConstants";

// Helper nén ảnh Avatar nhẹ gọn < 150KB
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

        const targetSize = Math.min(size, 480);
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
  const isBusiness = roleId === ROLES.BUSINESS;

  // Tính % hoàn thiện hồ sơ
  const calculateCompletion = () => {
    let score = 20;
    if (profile?.profile?.avatar || previewAvatar) score += 20;
    if (profile?.profile?.fullName) score += 20;
    if (profile?.profile?.phone) score += 15;
    if (profile?.profile?.address) score += 15;
    if (profile?.profile?.bio) score += 10;
    return Math.min(score, 100);
  };

  const completionPercent = calculateCompletion();

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
        toast.success("Cập nhật ảnh đại diện thành công!");
        const updatedAvatarUrl = response.data?.avatar || compressedDataUrl;

        // Cập nhật Auth Store
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
    <div className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      {/* Editorial Dark Banner */}
      <div className="relative h-32 sm:h-40 w-full bg-slate-950 overflow-hidden flex items-center justify-between px-6 sm:px-8">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Top Right System Label */}
        <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NODE-ACTIVE · CAN THO GIS
          </span>
        </div>
      </div>

      {/* Main Profile Info Section */}
      <div className="px-6 sm:px-8 pb-6 pt-0">
        <div className="relative -mt-14 sm:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-black/[0.05]">
          {/* Avatar and Primary Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-[24px] ring-4 ring-white shadow-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-black/[0.08]">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt={profile?.profile?.fullName || "Avatar"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-950 text-amber-300 text-3xl sm:text-4xl font-extrabold font-mono">
                    {getInitials(profile?.profile?.fullName, profile?.email)}
                  </div>
                )}

                {/* Upload Spinner Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1.5 text-white backdrop-blur-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      Đang tải...
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Thay đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 p-2.5 rounded-2xl bg-slate-950 text-white hover:bg-black border-2 border-white shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5 text-amber-300" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* User Meta Data */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  {profile?.profile?.fullName || profile?.email?.split("@")[0]}
                </h2>
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    SUPER ADMIN
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white border border-slate-950">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    ADMINISTRATOR
                  </span>
                ) : isBusiness ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    DOANH NGHIỆP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    <User className="w-3.5 h-3.5" />
                    {ROLE_NAMES[roleId] || "USER"}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5 font-mono text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {profile?.email}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Email đã xác thực
                </span>
                {profile?.createdAt && (
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Calendar className="h-3.5 w-3.5" />
                    Khởi tạo: {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Editorial Style) */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 pt-2 md:pt-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-900 font-mono">
                BẢO VỆ 2 LỚP: HOẠT ĐỘNG
              </span>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Hoàn thiện hồ sơ:
                </span>
                <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden border border-black/[0.06]">
                  <div
                    className="h-full bg-slate-950 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-950 font-mono tabular-nums">
                  {completionPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileAvatarCard.displayName = "ProfileAvatarCard";
export default ProfileAvatarCard;
