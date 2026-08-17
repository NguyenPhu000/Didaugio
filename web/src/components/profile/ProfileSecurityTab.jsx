import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "sonner";

export const ProfileSecurityTab = memo(({ setChangePasswordOpen }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Change Password Section */}
      <div className="bg-white border-2 border-black shadow-sm">
        <div className="bg-black text-white p-4 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#F3E600]" />
            <div>
              <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t("profile.security.changePassword")}
              </h3>
              <p className="text-xs text-gray-400 uppercase font-mono">
                {t("profile.security.changePasswordDesc")}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-yellow-50 border-2 border-[#F3E600]">
            <AlertCircle className="h-6 w-6 text-black mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase mb-2">
                {t("profile.security.accountSecurity")}
              </p>
              <p className="text-xs text-gray-600 uppercase font-mono leading-relaxed">
                {t("profile.security.passwordTips")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setChangePasswordOpen(true)}
            className="rounded-none border-2 border-black bg-black text-[#F3E600] hover:bg-[#F3E600] hover:text-black h-11 px-8 uppercase font-black text-xs transition-all cursor-pointer"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {t("profile.security.changePasswordBtn")}
          </Button>
        </div>
      </div>

      {/* Login Sessions Section */}
      <div className="bg-white border-2 border-black shadow-sm">
        <div className="bg-black text-white p-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#F3E600]" />
            <div>
              <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("profile.security.loginSessions")}
              </h3>
              <p className="text-xs text-gray-400 uppercase font-mono">
                {t("profile.security.loginSessionsDesc")}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Button
            variant="outline"
            onClick={() => toast(t("common.featureInDevelopment"))}
            className="rounded-none border-2 border-black h-11 px-6 hover:bg-gray-100 uppercase font-black text-xs cursor-pointer"
          >
            {t("profile.security.viewAllSessions")}
          </Button>
        </div>
      </div>
    </div>
  );
});

ProfileSecurityTab.displayName = "ProfileSecurityTab";
export default ProfileSecurityTab;
