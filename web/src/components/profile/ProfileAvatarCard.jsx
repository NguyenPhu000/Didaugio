import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Shield, Camera } from "lucide-react";
import { toast } from "sonner";
import { ROLE_NAMES } from "@/constants/constants";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getInitials } from "./profileConstants";

export const ProfileAvatarCard = memo(({ profile }) => {
  const { t } = useTranslation();
  const avatarSrc = resolveMediaUrl(
    profile?.profile?.avatar || profile?.avatar
  );

  return (
    <div className="bg-white border-2 border-black p-6 shadow-sm">
      <div className="flex items-center gap-8">
        <div className="relative">
          <div className="h-32 w-32 border-4 border-black bg-gray-900 overflow-hidden relative group">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-black text-[#F3E600] text-4xl font-black font-mono">
                {getInitials(profile?.profile?.fullName, profile?.email)}
              </div>
            )}
            {/* Accent corner */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#F3E600] border-t-2 border-l-2 border-black" />
          </div>
          <button
            type="button"
            className="absolute -bottom-2 -right-2 p-2 bg-black border-2 border-white text-[#F3E600] hover:bg-[#F3E600] hover:text-black transition-all cursor-pointer"
            onClick={() => toast(t("common.featureInDevelopment"))}
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
            {profile?.profile?.fullName || profile?.email}
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <p className="font-mono text-sm text-gray-600">{profile?.email}</p>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#F3E600] border-2 border-black px-3 py-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-black uppercase font-mono">
              {ROLE_NAMES[profile?.roleId] || "USER"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileAvatarCard.displayName = "ProfileAvatarCard";
export default ProfileAvatarCard;
